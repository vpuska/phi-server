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
     * List OPEN, non-Corporate products table extracting matching policies for state/type/adults/dependants.
     * @param state `NSW | VIC | QLD | TAS | SA | WA | NT`
     * @param adultsCovered `0 | 1 | 2`
     * @param dependantCover  Whether dependant cover required
     */
    async list(
        state: string,
        adultsCovered: 0 | 1 | 2,
        dependantCover: boolean,
    ) {
        const timeStamp = await this.systemService.findOne("TIMESTAMP", "");

        const filter = {
            state: In(['ALL', state]),
            adultsCovered: adultsCovered,
            dependantCover: dependantCover,
            status: 'Open',
            timeStamp: MoreThanOrEqual(new Date(timeStamp.data))
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
        const timeStamp = await this.systemService.findOne("TIMESTAMP", "");
        return await this.productRepository.find({
            select: LIST_FIELDS as FindOptionsSelect<Product>,
            where: {
                fundCode: fundCode,
                status: 'Open',
                timeStamp: MoreThanOrEqual(new Date(timeStamp.data))
            },
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
     * Add a health service.  Used by {@link PhiDataService.run}
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
     * Add a hospital tier ranking.  Used by {@link PhiDataService.run}.
     * @param tier The PHIO HospitalTier. Eg "SilverPlus"
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
