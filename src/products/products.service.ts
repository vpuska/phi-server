/*
 * products/products.service.ts
 * ----------------------------
 * author: V. Puska
 * date: 03-Jan-2025
 */
import { Readable } from 'stream';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsSelect, In, MoreThanOrEqual, Repository } from 'typeorm';

import {
    ProductGroup,
    ProductVariant,
    SerializedProductGroup,
} from 'phi-common';

import { Product } from './entities/product.entity';
import { HealthService } from './entities/health-service.entity';
import { HospitalTier } from './entities/hospital-tier.entity';
//import { ProductsCacheService } from './products.cache.service';
import { Interval } from '@nestjs/schedule';
import { SystemService } from '../system/system.service';
import { CacheMode, CacheService } from '../cache/cache.service';

const LIST_FIELDS = [
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


/**
 * Convert data into a Readable JSON stream.
 * Arrays are yielded item by item to prevent large memory allocations.
 * @param data The data to convert to a JSON readable stream.
 */
export function jsonStream(data: any): Readable {
    if (Array.isArray(data)) {
        console.log("Records =", data.length)
        function* generate() {
            yield '[';
            for (let i = 0; i < data.length; i++) {
                if (i > 0) {
                    yield ',';
                }
                console.log("yield", i)
                yield JSON.stringify(data[i]);
            }
            yield ']';
        }
        return Readable.from(generate(), { objectMode: false });
    }
    return Readable.from([JSON.stringify(data)], { objectMode: false });
}


/**
 * **ProductService**
 */
@Injectable()
export class ProductsService {
    // Latest import time stamp.  Used to determine which products to return from the database.
    private timeStamp = new Date(0);
    private productXmlCacheMode: CacheMode = (process.env.PRODUCT_XML_CACHE ||
        'none') as CacheMode;
    private productDatasetCacheMode: CacheMode = (process.env
        .PRODUCT_DATASET_CACHE || 'none') as CacheMode;
    private logger = new Logger(ProductsService.name);
    groups: SerializedProductGroup[] = [];

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(HealthService)
        private readonly healthServiceRepository: Repository<HealthService>,
        @InjectRepository(HospitalTier)
        private readonly hospitalTierRepository: Repository<HospitalTier>,
        //private readonly productCacheService: ProductsCacheService,
        private readonly systemService: SystemService,
        private readonly cacheService: CacheService,
    ) {
        this.updateTimeStamp();
    }

    /**
     * Check the last import run time stamp every 15 minutes.  Called directly by the constructor and scheduled by NestJS.
     * If the time stamp has changed, update the product search tables.
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
                    this.createProductCache().then((group) => {
                        this.groups = group;
                        this.logger.debug(
                            `${group.length} product groups loaded.`,
                        );
                    });
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
            select: LIST_FIELDS as FindOptionsSelect<Product>,
            where: {
                fundCode: fundCode,
                code: productCode,
            },
        });
    }

    /**
     * List OPEN products extracting matching policies for state/adults/dependants.
     * @param state `NSW | VIC | QLD | TAS | SA | WA | NT`
     * @param adultsCovered `0 | 1 | 2`
     * @param dependantCover  Whether dependant cover required
     */
    async findByMarketSegment(
        state: string,
        adultsCovered: 0 | 1 | 2,
        dependantCover: boolean,
    ) {
        const filter = {
            state: In(['ALL', state]),
            adultsCovered: adultsCovered,
            dependantCover: dependantCover,
            status: 'Open',
            timeStamp: MoreThanOrEqual(this.timeStamp),
        };

        return await this.productRepository.find({
            select: LIST_FIELDS as FindOptionsSelect<Product>,
            where: filter,
        });
    }

    /**
     * List all OPEN products table extracting policies for a single fund or brand.  Includes corporate products.  If
     * querying for a fund, all brand products are included.
     * The fundOrBrandCode can be a:
     * - a fund: E.g. `ACA`
     * - a brand: E.g. `NIB01`
     *
     *
     * @param fundCode
     */
    async findByFund(fundCode: string) {
        return await this.productRepository.find({
            select: LIST_FIELDS as FindOptionsSelect<Product>,
            where: {
                fundCode: fundCode,
                status: 'Open',
                timeStamp: MoreThanOrEqual(this.timeStamp),
            },
        });
    }

    /**
     * List all OPEN products table extracting policies for a single product name.  Includes corporate products.  If
     * querying for a fund, all brand products are included.
     * @param title The product name to search for (exact match).
     * @param fundOrBrandCode Options fund or brand code.
     */
    async findByTitle(title: string, fundOrBrandCode: string = null) {
        const where = {
            name: title,
            timeStamp: MoreThanOrEqual(this.timeStamp),
        };
        if (fundOrBrandCode) {
            where['fundCode'] = fundOrBrandCode.substring(0, 3);
            where['fundBrandCode'] = fundOrBrandCode;
        }
        return await this.productRepository.find({
            select: LIST_FIELDS as FindOptionsSelect<Product>,
            where: where,
        });
    }

    async createProductCache() {
        const groups: SerializedProductGroup[] = [];

        const rows = await this.productRepository.find({
            select: LIST_FIELDS as FindOptionsSelect<Product>,
            where: {
                timeStamp: MoreThanOrEqual(this.timeStamp)
            },
            order: {
                name: 'ASC',
                fundCode: 'ASC',
                brands: 'ASC',
                type: 'ASC',
                status: 'ASC',
                isCorporate: 'ASC',
                accommodationType: 'ASC',
                hospitalTier: 'ASC',
                onlyAvailableWith: 'ASC',
                onlyAvailableWithProducts: 'ASC',
                services: 'ASC',
            }
        });

        let currentGroup = ProductGroup.createFromObject(rows[0]);

        for (const row of rows) {
            const group = ProductGroup.createFromObject(row);
            const variant = ProductVariant.createFromObject(row).serialize();

            if (group.isSameAs(currentGroup)) {
                currentGroup.addVariant(variant);
            } else {
                groups.push(currentGroup.serialize());
                currentGroup = group;
                currentGroup.addVariant(variant);
            }
            // temporary limit for testing
            if (groups.length > 1000)
                break;
        }
        groups.push(currentGroup.serialize());
        return groups;
    }

    async writeProductDatasetCache() {
        this.logger.log(`PRODUCT_DATASET_CACHE=${this.productDatasetCacheMode}`);
        const dataset = jsonStream(await this.createProductCache());
        if (this.productDatasetCacheMode !== 'none') {
            this.cacheService.writeCache(
                'products/dataset',
                this.productDatasetCacheMode,
                dataset,
            );
        }
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
