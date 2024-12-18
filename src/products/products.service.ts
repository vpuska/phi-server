import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XML2JSObject, XMLElement } from "src/libs/xml-lib";

import { Product } from "src/products/entities/product.entity";
import { CreateProductDto } from "./dto/product.dto";


@Injectable()
export class ProductsService {

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
    ) { }

    async create(createProductDto: CreateProductDto): Promise<Product> {
        const product = this.productRepository.create(createProductDto);
        return await this.productRepository.save(product);
    }

    async createFromXML(xml2jsObject: XML2JSObject): Promise<Product> {
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

}
