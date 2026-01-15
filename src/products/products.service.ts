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
import { SystemService } from '../system/system.service';

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

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(HealthService)
        private readonly healthServiceRepository: Repository<HealthService>,
        @InjectRepository(HospitalTier)
        private readonly hospitalTierRepository: Repository<HospitalTier>,
        private readonly productCacheService: ProductsCacheService,
        private readonly systemService: SystemService,
    ) {
    }

    /**
     * List OPEN products extracting matching policies for state/adults/dependants.
     * @param state `NSW | VIC | QLD | TAS | SA | WA | NT`
     * @param adultsCovered `0 | 1 | 2`
     * @param dependantCover  Whether dependant cover required
     */
    async findByMarketSegment(state: string, adultsCovered: 0 | 1 | 2, dependantCover: boolean,
    ) {
        const timeStamp = new Date(await this.systemService.get("IMPORT", "TIMESTAMP", new Date(0).toString()));

        const filter = {
            state: In(['ALL', state]),
            adultsCovered: adultsCovered,
            dependantCover: dependantCover,
            status: 'Open',
            timeStamp: MoreThanOrEqual(timeStamp)
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
        const timeStamp = new Date(await this.systemService.get("IMPORT", "TIMESTAMP", new Date(0).toString()));
        return await this.productRepository.find({
            select: LIST_FIELDS as FindOptionsSelect<Product>,
            where: {
                fundCode: fundCode,
                status: 'Open',
                timeStamp: MoreThanOrEqual(timeStamp)
            },
        })
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
