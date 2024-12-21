import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XML2JSObject, XMLElement } from "src/libs/xml-lib";

import { Product } from "src/products/entities/product.entity";
import { CreateProductDto } from "./dto/product.dto";
import {HealthService} from "./entities/health-service.entity";
import {BenefitsList} from "./entities/benefits-list.entity";


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

    async create(createProductDto: CreateProductDto): Promise<Product> {
        const product = this.productRepository.create(createProductDto);
        return await this.productRepository.save(product);
    }

    async createFromXML2(xml2jsObject: XML2JSObject): Promise<Product> {
        const productXml = new XMLElement(xml2jsObject);
        const productDto = new CreateProductDto();

        productDto.code = productXml.attributes["ProductCode"];
        productDto.fundCode = productXml.find("FundCode").text;
        productDto.name = productXml.find("Name").text;
        productDto.type = productXml.find("ProductType").text;
        productDto.productURL = productXml.find("ProductURL").text;
        productDto.phisURL = productXml.find("PHISURL").text;
        productDto.status = productXml.find("ProductStatus").text;
        productDto.state = productXml.find("State").text;
        productDto.excessPerPerson = + productXml.find("ExcessPerPerson").text;
        productDto.excessPerAdmission = + productXml.find("ExcessPerAdmission").text;
        productDto.excessPerPolicy = + productXml.find("ExcessPerPolicy").text;
        productDto.hospitalTier = productXml.find("HospitalTier").text;
        productDto.accommodationType = productXml.find("AccommodationType").text;

        if (productDto.type !== "GeneralHealth") {
            const hospitalXml = productXml.find("HospitalCover");
            productDto.hospitalTier = hospitalXml.find("HospitalTier").text;
            productDto.accommodationType = hospitalXml.find("Accommodation").text;
        }

        const whoIsCoveredXml = productXml.find("WhoIsCovered");
        if (whoIsCoveredXml.attributes["OnlyOnePerson"]==="true") {
            productDto.adultsCovered = 1
        } else {
            const coverageXml = whoIsCoveredXml.find("Coverage");
            productDto.adultsCovered = + coverageXml.attributes["NumberOfAdults"]
            for (const dependant of coverageXml.findAll("DependantCover")) {
                if (dependant.attributes["Title"] === "Child")
                    productDto.childCover = dependant.attributes["Covered"] === "true";
                else if (dependant.attributes["Title"] === "ConditionalNonStudent")
                    productDto.conditionalNonStudentCover = dependant.attributes["Covered"] === "true";
                else if (dependant.attributes["Title"] === "Disability")
                    productDto.disabilityCover = dependant.attributes["Covered"] === "true";
                else if (dependant.attributes["Title"] === "NonClassified")
                    productDto.nonClassifiedCovered = dependant.attributes["Covered"] === "true";
                else if (dependant.attributes["Title"] === "NonStudent")
                    productDto.nonStudentCover = dependant.attributes["Covered"] === "true";
                else if (dependant.attributes["Title"] === "Student")
                    productDto.studentCover = dependant.attributes["Covered"] === "true";
                else
                    console.log("Invalid adult coverage:", dependant.attributes["Title"]);
            }
        }

        return await this.create(productDto);
    }

    async createFromXML(xml2jsObject: XML2JSObject): Promise<Product> {
        const productXml = new XMLElement(xml2jsObject);
        const product = this.productRepository.create();

        product.code = productXml.attributes["ProductCode"];
        product.fundCode = productXml.find("FundCode").text;
        product.name = productXml.find("Name").text;
        product.type = productXml.find("ProductType").text;
        product.productURL = productXml.find("ProductURL").text;
        product.phisURL = productXml.find("PHISURL").text;
        product.status = productXml.find("ProductStatus").text;
        product.state = productXml.find("State").text;
        product.excessPerPerson = +productXml.find("ExcessPerPerson").text;
        product.excessPerAdmission = +productXml.find("ExcessPerAdmission").text;
        product.excessPerPolicy = +productXml.find("ExcessPerPolicy").text;
        product.hospitalTier = productXml.find("HospitalTier").text;
        product.accommodationType = productXml.find("AccommodationType").text;

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
        await this.productRepository.save(product);

        const services: HealthService[] = []
        const benefits: BenefitsList[] = []

        for (const serviceXML of productXml.find("HospitalCover")?.find("MedicalServices")?.findAll("MedicalService")) {
            const service = this.healthServiceRepository.create();
            service.productCode = product.code;
            service.serviceType = "H";
            service.serviceCode = serviceXML.attributes["Title"];
            service.covered = serviceXML.attributes["Cover"][0];
            services.push(service);
        }

        for (const serviceXML of productXml.find("GeneralHealthCover")?.find("GeneralHealthServices")?.findAll("GeneralHealthService")) {
            const service = this.healthServiceRepository.create();
            service.productCode = product.code;
            service.serviceType = "G";
            service.serviceCode = serviceXML.attributes["Title"];
            service.covered = (serviceXML.attributes["Covered"] === "true") ? "C" : "N";
            services.push(service);

            for (const stateXML of serviceXML.findAll("BenefitsList"))
                for (const benefitXML of stateXML.findAll("Benefit")) {
                    const benefit = this.benefitsRepository.create();
                    benefit.productCode = product.code;
                    benefit.serviceType = "G";
                    benefit.serviceCode = service.serviceCode;
                    benefit.state = stateXML.attributes["State"];
                    benefit.itemCode = benefitXML.attributes["Item"];
                    benefit.benefitType = benefitXML.attributes["Type"];
                    benefit.benefitAmount = + benefitXML.text;
                    benefits.push(benefit);
                }
        }

        await this.healthServiceRepository.save(services);
        await this.benefitsRepository.save(benefits);

        return product;
    }
}
