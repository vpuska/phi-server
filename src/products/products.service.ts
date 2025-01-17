/**
 * products/products.service.ts
 * ----
 * @author V. Puska
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import { DOMParser, Element as XMLElement } from '@xmldom/xmldom';


import { Product } from "src/products/entities/product.entity";
import { HealthService } from "./entities/health-service.entity";
import { HospitalTier } from './entities/hospital-tier.entity';
/**
 * **ProductService**
 */
@Injectable()
export class ProductsService {

    logger = new Logger("ProductsService");

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(HealthService)
        private readonly healthServiceRepository: Repository<HealthService>,
        @InjectRepository(HospitalTier)
        private readonly hospitalTierRepository: Repository<HospitalTier>,
    ) { }

    /**
     * Search products table extracting matching policies.
     * @param hospitalCover `true` to select hospital cover
     * @param generalCover `true` to select general cover
     * @param hospitalTier
     * @param state `NSW`, `VIC`, `QLD`, `TAS`, `SA`, `WA` or `NT`
     * @param adults `0`, `1` or `2`
     * @param dependantFilter  Object of dependent cover flags
     */
    async search(
        hospitalCover: boolean,
        generalCover: boolean,
        hospitalTier: string,
        state: string,
        adults: number,
        dependantFilter: Object
    ) {
        const types = [];
        if (hospitalCover)
            types.push("Hospital");
        if (hospitalCover && generalCover)
            types.push("Combined")

        const filterTier = await this.hospitalTierRepository.findOneBy({tier: hospitalTier});
        const minimumRank = filterTier?.ranking || 0;

        const filter = [];

        if (hospitalCover)
            filter.push({
                state: In([state, 'ALL']),
                type: In(types),
                adultsCovered: adults,
                status: 'Open',
                ...dependantFilter,
                hospitalTierRanking: {
                    ranking: MoreThanOrEqual(minimumRank),
                }
            });

        if (generalCover)
            filter.push({
                state: In([state, 'ALL']),
                type: "GeneralHealth",
                adultsCovered: adults,
                status: 'Open',
                ...dependantFilter,
            });

        return await this.productRepository.find({
            select: [
                'code',
                'name',
                'fundCode',
                'type',
                'state',
                'adultsCovered',
                'childCover',
                'studentCover',
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
                'services'
            ],
            where: filter
        });
    }

    /**
     * Find single product.
     * @param productCode Product code.
     */
    async findByOne(productCode: string) {
        return await this.productRepository.findOneBy({code: productCode});
    }
    /**
     * Add a health service.  Used by {@link PhiLoadService.run}
     * @param key 3 character abbreviated mnemonic for the service
     * @param type `H` | `G`
     * @param code PHIO service code
     */
    async createHealthService(key: string, type: "H" | "G", code: string) {
        const service = this.healthServiceRepository.create();
        service.key = key;
        service.serviceType = type;
        service.serviceCode = code;
        await this.healthServiceRepository.save(service);
    }

    /**
     * Convert PHIO service code to the server's abbreviated mnemonic.
     * @param type `H` | `G`
     * @param serviceCode PHIO service code
     * @return  The abbreviated mnemonic
     */
    async mapHealthService(type: string, serviceCode: string) : Promise<string> {
        return (await this.healthServiceRepository.findOne({
            where: {
                serviceType: type,
                serviceCode: serviceCode
            }
        })).key;
    }

    /**
     * Add a hospital tier ranking.  Used by {@link PhiLoadService.run}.
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

    /**
     * Sets the `isPresent` flag to `false` on all product records.  Used by {@link PhiLoadService.run}.
     */
    async clearIsPresentFlag() {
        await this.productRepository.update({ isPresent: true }, {
            isPresent: false
        })
    }

    /**
     * Decommission records that have been orphaned.  Used by {@link PhiLoadService.run}.
     */
    async decommissionOrphans() {
        await this.productRepository.update({ isPresent: false }, {
            status: 'Orphaned'
        })
    }

    /**
     * Create a {@Link Product} from XML data and save to the database.
     * @param xml Product XML
     */
    async createFromXML(xml: any): Promise<Product> {
        let newXml = xml.toString();
        const unicodeErr = newXml.indexOf('\uFFFD');
        if (unicodeErr >= 0)
            newXml = newXml.replaceAll('\uFFFD', '?');

        const doc = new DOMParser().parseFromString(newXml, 'text/xml');
        const prodNode = doc.getElementsByTagName("Product")[0];
        const prodCode = prodNode.getAttribute("ProductCode");

        if (unicodeErr >= 0)
            this.logger.warn("Unicode character error in product " + prodCode);

        const product = this.productRepository.create();

        product.code = prodCode;
        product.fundCode = prodNode.getElementsByTagName("FundCode")[0].textContent;
        product.name = prodNode.getElementsByTagName("Name")[0].textContent;
        product.type = prodNode.getElementsByTagName("ProductType")[0].textContent;
        product.status = prodNode.getElementsByTagName("ProductStatus")[0].textContent;
        product.state = prodNode.getElementsByTagName("State")[0].textContent;
        product.premium = +getContent(prodNode, "PremiumNoRebate", "0");
        product.hospitalComponent = +getContent(prodNode, "PremiumHospitalComponent", "0");
        product.excessPerPerson = +getContent(prodNode, "ExcessPerPerson", "0");
        product.excessPerAdmission = +getContent(prodNode, "ExcessPerAdmission", "0");
        product.excessPerPolicy = +getContent(prodNode, "ExcessPerPolicy", "0");
        product.excess = Math.max ( product.excessPerPerson, product.excessPerAdmission, product.excessPerPolicy );
        product.hospitalTier = "None";
        product.services = "";

        if (product.excess === product.excessPerPolicy && product.adultsCovered === 2)
            product.excess = product.excess / 2;

        if (product.type !== "GeneralHealth") {
            product.hospitalTier = prodNode.getElementsByTagName("HospitalTier")[0].textContent;
            product.accommodationType = prodNode.getElementsByTagName("Accommodation")[0].textContent;
        }

        const whoIsCoveredNode = prodNode.getElementsByTagName("WhoIsCovered")[0];
        if (whoIsCoveredNode.getAttribute("OnlyOnePerson") === "true") {
            product.adultsCovered = 1
        } else {
            const coverageNode = whoIsCoveredNode.getElementsByTagName("Coverage")[0];
            product.adultsCovered = +coverageNode.getAttribute("NumberOfAdults");
            for (const dependant of coverageNode.getElementsByTagName("DependantCover")) {
                const title = dependant.getAttribute("Title");
                const covered = (dependant.getAttribute("Covered") === "true");
                if (title === "Child")
                    product.childCover = covered;
                else if (title === "ConditionalNonStudent")
                    product.conditionalNonStudentCover = covered;
                else if (title === "Disability")
                    product.disabilityCover = covered;
                else if (title === "NonClassified")
                    product.nonClassifiedCover = covered;
                else if (title === "NonStudent")
                    product.nonStudentCover = covered;
                else if (title === "Student")
                    product.studentCover = covered;
                else
                    console.log("Invalid adult coverage:", title);
            }
        }

        for (const serviceNode of prodNode.getElementsByTagName("MedicalService")) {
            const covered = serviceNode.getAttribute("Cover");
            const title = serviceNode.getAttribute("Title");
            const modifier = (covered==="Restricted") ? "-" : "";
            if (covered !== "NotCovered") {
                const key = await this.mapHealthService("H", title);
                product.services = product.services + key + modifier + ";"
            }
        }

        for (const serviceNode of prodNode.getElementsByTagName("GeneralHealthService")) {
            const covered = serviceNode.getAttribute("Covered");
            const title = serviceNode.getAttribute("Title");
            if (covered === "true") {
                const key = await this.mapHealthService("G", title);
                product.services = product.services + key + ";"
            }
        }

        product.xml = newXml;
        product.isPresent = true;
        return await this.productRepository.save(product);
    }
}

/**
 * Returns the content of an XML note.
 * @param node The node to search
 * @param tag The tag to search for
 * @param defaultValue The default value to return if not found or empty
 */
function getContent(node: XMLElement, tag: string, defaultValue: string = "") : string | null {
    const nodes = node.getElementsByTagName(tag);
    if (!nodes)
        return defaultValue;
    if (nodes.length === 0)
        return defaultValue;
    return nodes[0].textContent;
}

