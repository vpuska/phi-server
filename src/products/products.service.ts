/**
 * products/products.service.ts
 * ----
 * @author: V. Puska
 * @date: 03-Jan-2025
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Interval } from '@nestjs/schedule';

import { FindOptionsSelect, In, MoreThanOrEqual, Repository } from 'typeorm';
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
 * Represents a product fund/brand/name entry with associated coverage details and fund/brand information
 * for all the products matching the fund/brand/name.
 */
class ProductNameEntry {
    // Map of fund/brand codes to fund/brand records.
    static fundBrands = new Map<string, FundBrand>();

    // Flags representing whether one or more proucts with this title have this attribute
    has0Adults: boolean = false;
    has1Adults: boolean = false;
    has2Adults: boolean = false;
    hasDependants: boolean = false;
    hasDisability: boolean = false;

    constructor(
        readonly name: string, 
        readonly fundBrandCode: string
    ){}

    /**
     * Returns a string representation of the product name, including the fund/brand name if available.
     */
    productNameSearchString() {
        let str = this.name;
        if (ProductNameEntry.fundBrands.has(this.fundBrandCode)) {
            const brand = ProductNameEntry.fundBrands.get(this.fundBrandCode);
            str = str.concat(" ", brand.name, " ", brand.shortName);
        }
        return str;
    }

    /**
     * Add coverage details for a product name.
     * @param adultsCovered number of adults covered
     * @param dependantCover  has dependant cover
     * @param disabilityCover  has disability cover
     */
    addCoverage(adultsCovered: number, dependantCover: boolean, disabilityCover: boolean) {
        this.has0Adults = this.has0Adults || adultsCovered === 0;
        this.has1Adults = this.has1Adults || adultsCovered === 1;
        this.has2Adults = this.has2Adults || adultsCovered === 2;
        this.hasDependants = this.hasDependants || dependantCover;
        this.hasDisability = this.hasDisability || disabilityCover;
    }

    /**
     * Returns a list of tokens extracted from the product name and coverage details.  Tokens are split into individual words and each word
     * is lowercased.
     */
    tokens() {
        let str = this.productNameSearchString().toLowerCase() + " nsw act vic qld tas sa wa nt";
        if (this.has0Adults) str = str.concat(" dependants dependents children");
        if (this.has1Adults) str = str.concat(this.hasDependants ? " sole parent" : " single");
        if (this.has2Adults) str = str.concat(this.hasDependants ? " family" : " couple");
        if (this.hasDisability) str = str.concat(" disability");

        return str.split(/\s+/);
    }
}

/**
 * **ProductService**
 */
@Injectable()
export class ProductsService {

    // Latest import time stamp.  Used to determine which products to return from the database.
    private timeStamp = new Date(0);
    // Array of distinct product names.
    private productNames = new Array<ProductNameEntry>();
    // Map of fund/brands codes
    private fundBrands = new Map<string, FundBrand>();
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
        ProductNameEntry.fundBrands = this.fundBrands;

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
                    this.fundsService.getFundBrandMap().then(fundBrands => {
                        this.fundBrands = fundBrands;
                        ProductNameEntry.fundBrands = fundBrands;
                    });

                    // Load all the product names into memory.
                    this.productRepository
                        .createQueryBuilder()
                        .distinct(true)
                        .select(['name', 'fundBrandCode', 'adultsCovered', 'dependantCover', 'disabilityCover'])
                        .where({timeStamp: MoreThanOrEqual(this.timeStamp)})
                        .orderBy({'name': 'ASC', 'fundCode': 'ASC', 'brands': 'ASC'})
                        .getRawMany().then(rows => {
                            this.logger.debug(`Pre-loading ${rows.length} product names.`);
                            let lastProduct = new ProductNameEntry("", "");
                            for (const row of rows) {
                                if (row.fundBrandCode !== lastProduct.fundBrandCode || row.name !== lastProduct.name) {
                                    if (lastProduct.name !== "")
                                        this.productNames.push(lastProduct);
                                    lastProduct = new ProductNameEntry(row.name, row.fundBrandCode);
                                }
                                lastProduct.addCoverage(row.adultsCovered, row.dependantCover, row.disabilityCover);
                            }
                            if (lastProduct.name !== "")
                                this.productNames.push(lastProduct);
                            this.logger.debug(`Pre-loaded ${this.productNames.length} product name entries`);
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

    /**
     * List all OPEN products table extracting policies for a single product name.  Includes corporate products.  If
     * querying for a fund, all brand products are included.
     * @param title The product name to search for (exact match).
     * @param fundOrBrandCode Options fund or brand code.
     */
    async findByTitle(title: string, fundOrBrandCode: string = null) {
        const where = {
            name: title,
            timeStamp: MoreThanOrEqual(this.timeStamp)
        }
        if (fundOrBrandCode) {
            where['fundCode'] = fundOrBrandCode.substring(0, 3);
            where['fundBrandCode'] = fundOrBrandCode;
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
     * @param timeout Maximum time in milliseconds to wait for results.  Default is 1000ms.
     */
    async searchKeyWords(keyWords: string, count: number = 50, timeout: number = 1000) {
        const kwTokens = keyWords.toLowerCase().split(/\s+/)
        const timeStarted = new Date();
        const results = [];

        for (const productName of this.productNames) {

            // preliminary test matching the product name tokens against the search terms
            let targetText = productName.tokens();
            let isMatch = kwTokens.every(kwToken => targetText.some(word => word.startsWith(kwToken)));
            // No match, skip to next product name.
            if (!isMatch) continue;

            // Now we do the same thing, but a detailed match of individual products against the search terms!
            const products = await this.findByTitle(productName.name, productName.fundBrandCode);
            for (const product of products) {
                targetText = this.getProductTokens(product);

                // now check if at least one product matches the search terms
                isMatch = kwTokens.every(kwToken => targetText.some(word => word.startsWith(kwToken)));
                if (isMatch) {
                    results.push({
                        name: productName.name,
                        fund: productName.fundBrandCode
                    });
                    break;
                }
            }
            if (results.length >= count)
                break;

            if (new Date().getTime() - timeStarted.getTime() > timeout)
                break;
        }
        return results;
    }

    /**
     * Search products by title (exact match) AND key words.  Returns a list of products matching the search terms.  The search terms are split
     * into individual words and each word must appear in the product name or brand name.  The search is case insensitive.  This function is
     * typically called after {@link searchKeyWords} to further refine the results.
     * @param productName The product name to search for (exact match).  Usually a title returned from {@link searchKeyWords}.
     * @param fundBrandCode The fund or brand code to search for.  Usually a fund or brand code returned from {@link searchKeyWords}.
     * @param keyWords Keyword search terms.  Usually the same terms used for {@link searchKeyWords}.
     */
    async searchKeyWords2(productName: string, fundBrandCode: string, keyWords: string) : Promise<Product[]> {
        const kwTokens = keyWords.toLowerCase().split(/\s+/)
        const results = [];

        const products = await this.findByTitle(productName, fundBrandCode);
        for (const product of products) {
            const productTokens = this.getProductTokens(product);
            const isMatch = kwTokens.every(kwToken => productTokens.some(word => word.startsWith(kwToken)));
            if (isMatch)
                results.push(product);
        }
        return results;
    }

    /**
     * Extract the product tokens for a product.  The tokens are the product name and brand name split into individual words.
     * The tokens are used for keyword searching.
     * @param product
     */
    getProductTokens(product: Product) : string[] {
        const productTokens = product.name.toLowerCase().split(/\s+/);

        if (ProductNameEntry.fundBrands.has(product.fundBrandCode)) {
            const fundBrand = this.fundBrands.get(product.fundBrandCode);
            fundBrand.name.toLowerCase().split(/\s+/).map(s => productTokens.push(s));
            fundBrand.shortName.toLowerCase().split(/\s+/).map(s => productTokens.push(s));
        }

        // extract the state token
        const state = product.state === 'ALL' ? ['nsw', 'vic', 'qld', 'tas', 'sa', 'wa', 'nt'] : [product.state];
        if (state[0].toLowerCase() === 'nsw')
            state.push('act');
        state.map(st => productTokens.push(st.toLowerCase()));

        // extract family type token
        [
            ['dependent', 'dependant', 'children'],
            product.dependantCover ? ['sole', 'parent'] : ['single'],
            product.dependantCover ? ['family'] : ['couple'],
        ] [product.adultsCovered].map(token => productTokens.push(token));

        // extract disability token
        if (product.disabilityCover) productTokens.push('disability');

        return productTokens;
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
