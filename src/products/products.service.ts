/**
 * products/products.service.ts
 * ----
 * @author V. Puska
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XmlElement } from "src/utils/xml";

import { Product } from "src/products/entities/product.entity";
import { HealthService } from "./entities/health-service.entity";
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
    ) { }
    /**
     * Search products table extracting matching policies.
     * @param state ```NSW```, ```VIC```, ```QLD```, ```TAS```, ```SA```, ```WA``` or ```NT```
     * @param adults ```1``` or ```2```
     * @param children  ```true``` if policies should include children
     */
    async search(state: string, adults: number, children: boolean) {
        return await this.productRepository.find({
            select: [
                'code',
                'name',
                'fundCode',
                'type' ,
                'adultsCovered',
                'childCover',
                'studentCover',
                'nonStudentCover',
                'nonClassifiedCovered',
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
            where: [{
                state: state,
                adultsCovered: adults,
                childCover: children,
                status: 'Open',
            },{
                state: "ALL",
                adultsCovered: adults,
                childCover: children,
                status: 'Open',
            }]
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
     * @param type ```H``` | ```G```
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
     * @param type ```H``` | ```G```
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
     * Return full service mapping table.
     */
    async serviceList() {
        return await this.healthServiceRepository.find();
    }

    /**
     * Create a {@Link Product} from XML data and save to the database.
     * @param xml Product XML
     * @param force_mode ```true``` to force update even though XML has not changed.
     */
    async createFromXML(xml: any, force_mode = false): Promise<Product> {

        const productXml = XmlElement.fromXML(xml);
        let product = await this.productRepository.findOneBy({code: productXml.attributes["ProductCode"]});
        let oldXml = product ? product.xml : "";
        const newXml = xml.toString();

        if (!force_mode)
            if (oldXml === newXml)
                return product;

        product = this.productRepository.create();

        product.code = productXml.attributes["ProductCode"];
        product.fundCode = productXml.find("FundCode").text;
        product.name = productXml.find("Name").text;
        product.type = productXml.find("ProductType").text;
        product.status = productXml.find("ProductStatus").text;
        product.state = productXml.find("State").text;
        product.premium = +productXml.find("PremiumNoRebate").text || 0;
        product.hospitalComponent = +productXml.find("PremiumHospitalComponent").text || 0;
        product.excessPerPerson = +productXml.find("Excesses")?.find("ExcessPerPerson").text || 0;
        product.excessPerAdmission = +productXml.find("Excesses")?.find("ExcessPerAdmission").text || 0;
        product.excessPerPolicy = +productXml.find("Excesses")?.find("ExcessPerPolicy").text || 0;
        product.excess = Math.max ( product.excessPerPerson, product.excessPerAdmission, product.excessPerPolicy );

        // don't update the XML if it is not changed as it has an impact on DB performance and size.
        if (oldXml !== newXml)
            product.xml = newXml;

        if (product.type !== "GeneralHealth") {
            const hospitalXml = productXml.find("HospitalCover");
            product.hospitalTier = hospitalXml.find("HospitalTier").text;
            product.accommodationType = hospitalXml.find("Accommodation").text;
        }

        const whoIsCoveredXml = productXml.find("WhoIsCovered");
        if (whoIsCoveredXml.attributes["OnlyOnePerson"] === "true") {
            product.adultsCovered = 1
        } else {
            const coverageXml = whoIsCoveredXml.find("Coverage");
            product.adultsCovered = +coverageXml.attributes["NumberOfAdults"]
            for (const dependant of coverageXml.findAll("DependantCover")) {
                if (dependant.attributes["Title"] === "Child")
                    product.childCover = dependant.attributes["Covered"] === "true";
                else if (dependant.attributes["Title"] === "ConditionalNonStudent")
                    product.conditionalNonStudentCover = dependant.attributes["Covered"] === "true";
                else if (dependant.attributes["Title"] === "Disability")
                    product.disabilityCover = dependant.attributes["Covered"] === "true";
                else if (dependant.attributes["Title"] === "NonClassified")
                    product.nonClassifiedCovered = dependant.attributes["Covered"] === "true";
                else if (dependant.attributes["Title"] === "NonStudent")
                    product.nonStudentCover = dependant.attributes["Covered"] === "true";
                else if (dependant.attributes["Title"] === "Student")
                    product.studentCover = dependant.attributes["Covered"] === "true";
                else
                    console.log("Invalid adult coverage:", dependant.attributes["Title"]);
            }
        }
        if (product.excess === product.excessPerPolicy && product.adultsCovered === 2)
            product.excess = product.excess / 2;

        product.services = "";

        for (const serviceXML of productXml.find("HospitalCover")?.find("MedicalServices")?.findAll("MedicalService")) {
            const covered = serviceXML.attributes["Cover"];
            const title = serviceXML.attributes["Title"];
            const modifier = (covered==="Restricted") ? "-" : "";
            if (covered !== "NotCovered") {
                const key = await this.mapHealthService("H", title);
                product.services = product.services + key + modifier + ";"
            }
        }

        for (const serviceXML of productXml.find("GeneralHealthCover")?.find("GeneralHealthServices")?.findAll("GeneralHealthService")) {
            const covered = serviceXML.attributes["Covered"];
            const title = serviceXML.attributes["Title"];
            if (covered === "true") {
                const key = await this.mapHealthService("G", title);
                product.services = product.services + key + ";"
            }
        }

        return await this.productRepository.save(product);
    }
}
