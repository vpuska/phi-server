import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fund } from "./entities/fund.entity";
import { CreateFundDto } from "./dto/fund.dto";
import { XML2JSObject, XMLElement } from "../libs/xml-lib";


@Injectable()
export class FundsService {

    constructor(
        @InjectRepository(Fund)
        private readonly fundRepository: Repository<Fund>,
    ) {}

    async create(createFundDto: CreateFundDto): Promise<Fund> {
        const fund = this.fundRepository.create(createFundDto);
        return await this.fundRepository.save(fund);
    }

    async createFromXML(xml2jsObject: XML2JSObject): Promise<Fund> {
        const fundXml = new XMLElement(xml2jsObject);
        const fundDto =  new CreateFundDto();

        fundDto.code = fundXml.find("FundCode").text;
        fundDto.name = fundXml.find("FundName").text;
        fundDto.description = fundXml.find("FundDescription").text;
        fundDto.address1 = fundXml.find("Address").find("AddressLine1").text;
        fundDto.address2 = fundXml.find("Address").find("AddressLine2").text;
        fundDto.address3 = fundXml.find("Address").find("AddressLine3").text;
        fundDto.town = fundXml.find("Address").find("Town").text;
        fundDto.state = fundXml.find("Address").find("State").text;
        fundDto.postcode = fundXml.find("Address").find("Postcode").text;
        fundDto.type = fundXml.find("FundType").text;

        console.log("   - creating ", fundDto.code);
        return this.create(fundDto);
    }
}
