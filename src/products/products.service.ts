/**
 * products/products.service.ts
 * ----
 * @author V. Puska
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DOMParser, Element as XMLElement } from '@xmldom/xmldom';


import { Product } from "src/products/entities/product.entity";
import { HealthService } from "./entities/health-service.entity";
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
        let newXml = xml.toString();
        const unicodeErr = newXml.indexOf('\uFFFD');
        if (unicodeErr >=0)
            newXml = newXml.replaceAll('\uFFFD', '?');

        const doc = new DOMParser().parseFromString(newXml, 'text/xml');
        const prodNode = doc.getElementsByTagName("Product")[0];
        const prodCode = prodNode.getAttribute("ProductCode");

        if (unicodeErr >= 0)
            this.logger.warn("Unicode character error in product " + prodCode);

    //const productXml = XmlElement.fromXML(xml);
        let product = await this.productRepository.findOneBy({code: prodCode});
        let oldXml = product ? product.xml : "";

        if (!force_mode)
            if (oldXml === newXml)
                return product;

        product = this.productRepository.create();

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

        // don't update the XML if it is not changed as it has an impact on DB performance and size.
        if (oldXml !== newXml)
            product.xml = newXml;

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
                    product.nonClassifiedCovered = covered;
                else if (title === "NonStudent")
                    product.nonStudentCover = covered;
                else if (title === "Student")
                    product.studentCover = covered;
                else
                    console.log("Invalid adult coverage:", title);
            }
        }
        if (product.excess === product.excessPerPolicy && product.adultsCovered === 2)
            product.excess = product.excess / 2;

        product.services = "";

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
            const covered = serviceNode.getAttribute("Cover");
            const title = serviceNode.getAttribute("Title");
            if (covered === "true") {
                const key = await this.mapHealthService("G", title);
                product.services = product.services + key + ";"
            }
        }

        return await this.productRepository.save(product);
    }

}

function getContent(node: XMLElement, tag: string, defaultValue: string = "") : string | null {
    const nodes = node.getElementsByTagName(tag);
    if (!nodes)
        return defaultValue;
    if (nodes.length === 0)
        return defaultValue;
    return nodes[0].textContent;
}

