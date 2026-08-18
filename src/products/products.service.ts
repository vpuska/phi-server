/**
 * products/products.service.ts
 * ----
 * @author: V. Puska
 * @date: 03-Jan-2025
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { FindOptionsSelect, In, MoreThanOrEqual, Repository } from 'typeorm';
import { Product } from 'src/products/entities/product.entity';
import { HealthService } from './entities/health-service.entity';
import { HospitalTier } from './entities/hospital-tier.entity';
import { ProductsCacheService } from './products.cache.service';
import { FundBrand} from '../funds/entities/fund-brand.entity';


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
 * Represents a product fund/brand/name entry with associated coverage details and fund/brand information
 * for all the products matching the fund/brand/name.
 */
class ProductNameEntry {
    // Map of fund/brand codes to fund/brand records.
    static fundBrands = new Map<string, FundBrand>();

    // Flags representing whether one or more products with this title have this attribute
    has0Adults: boolean = false;
    has1Adults: boolean = false;
    has2Adults: boolean = false;
    hasDependants: boolean = false;
    hasDisability: boolean = false;

    constructor(
        readonly name: string, 
        readonly fundBrandCode: string,
        readonly type: string,
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
}

/**
 * **ProductService**
 */
@Injectable()
export class ProductsService {

    // Latest import time stamp.  Used to determine which products to return from the database.
    private timeStamp = new Date(0);
    // Array of distinct product names.
    // Map of fund/brands codes
    private fundBrands = new Map<string, FundBrand>();

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(HealthService)
        private readonly healthServiceRepository: Repository<HealthService>,
        @InjectRepository(HospitalTier)
        private readonly hospitalTierRepository: Repository<HospitalTier>,
        private readonly productCacheService: ProductsCacheService,
    ) {
        ProductNameEntry.fundBrands = this.fundBrands;
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
