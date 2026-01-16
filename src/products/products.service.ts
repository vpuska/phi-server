/**
 * products/products.service.ts
 * ----
 * @author: V. Puska
 * @date: 03-Jan-2025
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Interval } from '@nestjs/schedule';

import { FindOptionsSelect, In, Like, MoreThanOrEqual, Repository } from 'typeorm';
import { Product } from 'src/products/entities/product.entity';
import { HealthService } from './entities/health-service.entity';
import { HospitalTier } from './entities/hospital-tier.entity';
import { ProductsCacheService } from './products.cache.service';
import { SystemService } from '../system/system.service';
import { FundsService } from '../funds/funds.service';
import { FundBrand} from '../funds/entities/fund-brand.entity';


const LIST_FIELDS = [
    'code',
    'name',
    'fundCode',
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
 * **ProductService**
 */
@Injectable()
export class ProductsService {

    private timeStamp = new Date(0);
    private fundBrands = new Map<string, FundBrand>();
    private productNames = new Array<{ fundBrandCode: string, name: string }>();
    private logger = new Logger(ProductsService.name);

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(HealthService)
        private readonly healthServiceRepository: Repository<HealthService>,
        @InjectRepository(HospitalTier)
        private readonly hospitalTierRepository: Repository<HospitalTier>,
        private readonly productCacheService: ProductsCacheService,
        private readonly systemService: SystemService,
        private readonly fundsService: FundsService,
    ) {
        // Initialise the IMPORT timestamp.
        this.updateTimeStamp();
    }

    /**
     * Update last run time stamp every 15 minutes.  Called directly by the constructor and scheduled by NestJS.
     */
    @Interval(15 * 60 * 1000)
    updateTimeStamp() {
        this.systemService.get("IMPORT", "LASTRUN", new Date(0).toString())
            .then(timeStampString => {
                const timeStamp = new Date(timeStampString);
                if (this.timeStamp < timeStamp) {

                    this.timeStamp = timeStamp;
                    this.logger.debug(`IMPORT time stamp changed to ${timeStampString}`);

                    // Load all the fund and brands into memory.
                    this.fundsService.findAllFundBrands().then(fundBrands => {
                        for (const fundBrand of fundBrands) {
                            this.fundBrands.set(fundBrand.code, fundBrand);
                        }
                    });

                    // Load all the product names into memory.
                    this.productRepository
                        .createQueryBuilder()
                        .distinct(true)
                        .select(['fundCode', 'name', 'brands'])
                        .where({timeStamp: MoreThanOrEqual(this.timeStamp)})
                        .orderBy({'name': 'ASC', 'fundCode': 'ASC', })
                        .getRawMany().then(rows => {
                            for (const row of rows) {
                                if ( row.brands )
                                    this.productNames.push({fundBrandCode: row.brands, name: row.name})
                                else
                                    this.productNames.push({fundBrandCode: row.fundCode, name: row.name})
                            }
                    });
                }
            })
        ;
    }

    /**
     * List OPEN products extracting matching policies for state/adults/dependants.
     * @param state `NSW | VIC | QLD | TAS | SA | WA | NT`
     * @param adultsCovered `0 | 1 | 2`
     * @param dependantCover  Whether dependant cover required
     */
    async findByMarketSegment(state: string, adultsCovered: 0 | 1 | 2, dependantCover: boolean,
    ) {
        const filter = {
            state: In(['ALL', state]),
            adultsCovered: adultsCovered,
            dependantCover: dependantCover,
            status: 'Open',
            timeStamp: MoreThanOrEqual(this.timeStamp)
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
                timeStamp: MoreThanOrEqual(this.timeStamp)
            },
        })
    }

    async findByTitle(title: string, fundOrBrandCode: string = null) {
        const where = {
            name: title,
            timeStamp: MoreThanOrEqual(this.timeStamp)
        }
        if (fundOrBrandCode) {
            where['fundCode'] = fundOrBrandCode.substring(0, 3);
            if (fundOrBrandCode.length > 3)
                where['brands'] = Like(`%${fundOrBrandCode}%`);
        }
        return await this.productRepository.find({
            select: LIST_FIELDS as FindOptionsSelect<Product>,
            where: where,
        })
    }

    /**
     * Search products by key words.  Returns a list of products matching the search terms.  The search terms are split
     * into individual words and each word must appear in the product name or brand name.  The search is case insensitive.
     * @param keyWords Space delimited string of search terms.
     * @param count Maximum number of results to return.  Default is 50.
     */
    searchKeyWords(keyWords: string, count: number = 50) {
        const tokens = keyWords.toLowerCase().split(/\s+/)
        const results = [];
        for (const product of this.productNames) {
            let productText: string[] = [];
            let isMatch = true;
            if (this.fundBrands.has(product.fundBrandCode)) {
                const brand = this.fundBrands.get(product.fundBrandCode);
                productText = `${product.name} ${brand.name} ${brand.shortName}`.toLowerCase().split(/\s+/)
            }
            else
                productText = product.name.toLowerCase().split(/\s+/);
            for (const token of tokens) {
                if (!productText.some(word => word.includes(token))) {
                    isMatch = false;
                    break;
                }
            }
            if (isMatch)
                results.push(product);
            if (results.length >= count) break;
        }
        return results;
    }

    /**
     * Return all product titles
     */
    async getProductTitles() {
        return await this.productRepository
            .createQueryBuilder()
            .distinct(true)
            .select(['fundCode', 'name', 'brands'])
            .orderBy({
                'name': 'ASC',
                'fundCode': 'ASC',
            })
            .getRawMany();
    }

    /**
     * Get the XML data for a single product.
     * @param fundCode Fund code.
     * @param productCode Product code.
     */
    async getXml(fundCode: string, productCode: string) {
        return await this.productCacheService.readProductXmlCache(fundCode, productCode);
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
