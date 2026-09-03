/*
 * products/products.service.ts
 * ----------------------------
 * author: V. Puska
 * date: 03-Jan-2025
 */

import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsSelect, MoreThanOrEqual, Repository } from 'typeorm';

import { ProductGroup, ProductVariant, SerializedProductGroup } from 'phi-common';

import { Product } from './entities/product.entity';
import { HealthService } from './entities/health-service.entity';
import { HospitalTier } from './entities/hospital-tier.entity';
import { Interval } from '@nestjs/schedule';
import { SystemService } from '../system/system.service';
import { CacheMode, CacheService } from '../cache/cache.service';
import { createReadStream } from 'node:fs';

const PRODUCT_FIELDS = [
    'code',
    'name',
    'fundCode',
    'fundBrandCode',
    'type',
    'isCorporate',
    'brands',
    'state',
    'onlyAvailableWith',
    'onlyAvailableWithProducts',
    'adultsCovered',
    'dependantCover',
    'childCover',
    'studentCover',
    'youngAdultCover',
    'nonStudentCover',
    'nonClassifiedCover',
    'conditionalNonStudentCover',
    'disabilityCover',
    'excess',
    'excessPerAdmission',
    'excessPerPerson',
    'excessPerPolicy',
    'premium',
    'hospitalComponent',
    'hospitalTier',
    'accommodationType',
    'services',
];

const PRODUCT_GROUP_FIELDS = [
    'name',
    'fundCode',
    'brands',
    'type',
    'status',
    'isCorporate',
    'accommodationType',
    'hospitalTier',
    'onlyAvailableWith',
    'onlyAvailableWithProducts',
    'services'
]

/**
 * **ProductService**
 */
@Injectable()
export class ProductsService {
    // Latest import time stamp.  Used to determine which products to return from the database.
    private timeStamp = new Date(0);
    private productXmlCacheMode: CacheMode = (process.env.PRODUCT_XML_CACHE ||'none') as CacheMode;
    private productDatasetCacheMode: CacheMode = (process.env.PRODUCT_DATASET_CACHE || 'none') as CacheMode;
    private logger = new Logger(ProductsService.name);

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(HealthService)
        private readonly healthServiceRepository: Repository<HealthService>,
        @InjectRepository(HospitalTier)
        private readonly hospitalTierRepository: Repository<HospitalTier>,
        private readonly systemService: SystemService,
        private readonly cacheService: CacheService,
    ) {
        this.updateTimeStamp();
    }

    /**
     * Check the last import run time stamp every 15 minutes.  Called directly by the constructor and scheduled by NestJS.
     * @note There are no longer any queries that are executed by the server that need the timestamp, so the regular update is not necessary.
     */
    @Interval(15 * 60 * 1000)
    updateTimeStamp() {
        this.systemService
            .get('IMPORT', 'LASTRUN', new Date(0).toString())
            .then((timeStampString) => {
                const timeStamp = new Date(timeStampString);
                if (this.timeStamp < timeStamp) {
                    this.timeStamp = timeStamp;
                    this.logger.debug(
                        `IMPORT time stamp changed to ${timeStampString}`,
                    );
                }
            });
    }

    /**
     * Return a single product.
     * @param fundCode
     * @param productCode
     */
    async findOne(fundCode: string, productCode: string) {
        return await this.productRepository.findOne({
            select:  PRODUCT_FIELDS as FindOptionsSelect<Product>,
            where: {
                fundCode: fundCode,
                code: productCode,
            },
        });
    }

    /**
     * Create a product dataset structured into {@link ProductGroup} objects.  An array of {@link ProductVariant} objects
     * is added to each {@link ProductGroup}.
     */
    async createProductDataset() {
        const groups: SerializedProductGroup[] = [];

        // query the distinct groups from the database
        const groupsRaw = await this.productRepository
            .createQueryBuilder()
            .select(PRODUCT_GROUP_FIELDS)
            .distinct(true)
            .where({
                timeStamp: MoreThanOrEqual(this.timeStamp)
            })
            .orderBy(PRODUCT_GROUP_FIELDS.reduce((obj, field) => {
                obj[field] = 'ASC';
                return obj;
            }, {}))
            .getRawMany();

        for (const group of groupsRaw) {
            // initialise a new group
            const thisGroup = ProductGroup.createFromObject(group);
            // find corresponding products
            const products = await this.productRepository.find({
                select:  PRODUCT_FIELDS as FindOptionsSelect<Product>,
                where: {
                    ...group,
                    timeStamp: MoreThanOrEqual(this.timeStamp)
                }
            });
            // add each product variant to the group
            for (const product of products) {
                thisGroup.addVariant(ProductVariant.createFromObject(product).serialize())
            }
            // save the group
            groups.push(thisGroup.serialize());
        }

        this.cacheService.writeCache(
            'products/dataset',
            this.productDatasetCacheMode,
            JSON.stringify(groups)
        );
    }

    /**
     * Get the product dataset as a stream.
     */
    streamProductDataset() {
        const cacheDirectory = process.env.CACHE_DIR || 'cache';
        const file = createReadStream(`${cacheDirectory}/products/dataset`);
        return new StreamableFile(file, {
            type: 'application/json',
            disposition: 'inline'
        });
    }

    /**
     * Get the XML data for a single product.
     * @param fundCode Fund code.
     * @param productCode Product code.
     */
    async getXml(fundCode: string, productCode: string) {
        const baseFileName = `products/xml/${fundCode}/${productCode}`;
        return await this.cacheService.readCache(baseFileName);
    }

    /**
     * Write out the product XML cache file according to the PRODUCT_XML_CACHE environment setting. <br>
     * Note: we ALWAYS write an XML cache - if the setting is `none`, we write the uncompressed version
     * @param fundCode
     * @param prodCode
     * @param data
     */
    writeProductXmlCache(fundCode: string, prodCode: string, data: any) {
        const fileName = `products/xml/${fundCode}/${prodCode}`;
        if (this.productXmlCacheMode === 'none')
            this.cacheService.writeCache(fileName, 'compressed', data);
        else
            this.cacheService.writeCache(
                fileName,
                this.productXmlCacheMode,
                data,
            );
    }

    /**
     * Add a health service.  Used by {@link ImportService.run}
     * @param key 3 character abbreviated mnemonic for the service
     * @param type `H` | `G`
     * @param tier `None` | `Basic` | `Bronze` | `Silver` | `Gold`
     * @param code PHIO service code
     * @param description Description/label for the service
     */
    async createHealthService(
        key: string,
        type: 'H' | 'G',
        tier: 'None' | 'Basic' | 'Bronze' | 'Silver' | 'Gold',
        code: string,
        description?: string,
    ) {
        const service = this.healthServiceRepository.create();
        service.key = key;
        service.serviceType = type;
        service.serviceCode = code;
        service.hospitalTier = tier;
        service.description = description
            ? description
            : code.replace(/(?!^)([A-Z])/g, ' $1'); // insert space before capital letters
        await this.healthServiceRepository.save(service);
    }

    /**
     * Convert PHIO service code to the server's abbreviated mnemonic.
     * @param type `H` | `G`
     * @param serviceCode PHIO service code
     * @return  The abbreviated mnemonic
     */
    async mapHealthService(type: string, serviceCode: string): Promise<string> {
        return (
            await this.healthServiceRepository.findOne({
                where: {
                    serviceType: type,
                    serviceCode: serviceCode,
                },
            })
        ).key;
    }

    /**
     * Add a hospital tier ranking.  Used by {@link ImportService.run}.
     * @param tier The PHIO HospitalTier. E.g. "SilverPlus"
     * @param ranking Assigned tier ranking.
     */
    async createHospitalTier(tier: string, ranking: number) {
        const hospitalTier = this.hospitalTierRepository.create();
        hospitalTier.tier = tier;
        hospitalTier.ranking = ranking;
        await this.hospitalTierRepository.save(hospitalTier);
    }

    /**
     * Return full service mapping table.
     */
    async serviceList() {
        return await this.healthServiceRepository.find();
    }
}
