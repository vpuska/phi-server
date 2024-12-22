import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Xml2JsObject, XmlElement } from "src/utils/xml";

import { Product } from "src/products/entities/product.entity";
import { HealthService } from "./entities/health-service.entity";
import { BenefitsList } from "./entities/benefits-list.entity";


@Injectable()
export class ProductsService {

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(HealthService)
        private readonly healthServiceRepository: Repository<HealthService>,
        @InjectRepository(BenefitsList)
        private readonly benefitsRepository: Repository<BenefitsList>,
    ) { }

    async search(state: string, adults: number, children: boolean) {
        return await this.productRepository.find({
            where: {
                state: state,
                adultsCovered: adults,
                childCover: children,
            },
        });
    }

    async createHealthService(key: string, type: "H" | "G", code: string) {
        const service = this.healthServiceRepository.create();
        service.key = key;
        service.serviceType = type;
        service.serviceCode = code;
        await this.healthServiceRepository.save(service);
    }

    async mapHealthService(type: string, serviceCode: string) : Promise<string> {
        return (await this.healthServiceRepository.findOne({
            where: {
                serviceType: type,
                serviceCode: serviceCode
            }
        })).key;
    }

    async createFromXML(xml2jsObject: Xml2JsObject): Promise<Product> {
        const productXml = new XmlElement(xml2jsObject);
        const product = this.productRepository.create();

        product.code = productXml.attributes["ProductCode"];
        product.fundCode = productXml.find("FundCode").text;
        product.name = productXml.find("Name").text;
        product.type = productXml.find("ProductType").text;
        product.productURL = productXml.find("ProductURL").text;
        product.phisURL = productXml.find("PHISURL").text;
        product.status = productXml.find("ProductStatus").text;
        product.state = productXml.find("State").text;
        product.hospitalTier = productXml.find("HospitalTier").text;
        product.accommodationType = productXml.find("AccommodationType").text;
        product.premium = +productXml.find("PremiumNoRebate").text;
        product.excessPerPerson = +productXml.find("Excesses")?.find("ExcessPerPerson").text || 0;
        product.excessPerAdmission = +productXml.find("Excesses")?.find("ExcessPerAdmission").text || 0;
        product.excessPerPolicy = +productXml.find("Excesses")?.find("ExcessPerPolicy").text || 0;
        product.excess = Math.max ( product.excessPerPerson, product.excessPerAdmission, product.excessPerPolicy );

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

        product.benefitLimits = [];

        for (const serviceXML of productXml.find("GeneralHealthCover")?.find("GeneralHealthServices")?.findAll("GeneralHealthService")) {
            if (serviceXML.attributes["Covered"] === "true") {
                const title = serviceXML.attributes["Title"];
                const key = await this.mapHealthService("G", title);
                product.services = product.services + key + ";"

                for (const stateXML of serviceXML.findAll("BenefitsList"))
                    for (const benefitXML of stateXML.findAll("Benefit")) {
                        const benefit = this.benefitsRepository.create();
                        benefit.productCode = product.code;
                        benefit.serviceKey = key;
                        benefit.state = stateXML.attributes["State"];
                        benefit.itemCode = benefitXML.attributes["Item"];
                        benefit.benefitType = benefitXML.attributes["Type"];
                        benefit.benefitAmount = +benefitXML.text;
                        product.benefitLimits.push(benefit);
                    }
            }
        }

       return this.productRepository.save(product);
    }
}
