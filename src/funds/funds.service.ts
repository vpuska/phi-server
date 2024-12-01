import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XML2JSObject, XMLElement } from "../libs/xml-lib";

import { Fund } from "./entities/fund.entity";
import { CreateFundDto } from "./dto/fund.dto";
import { CreateBrandDto } from './dto/brand.dto';
import { CreateDependantLimitDto } from './dto/dependant-limit.dto';


@Injectable()
export class FundsService {

    constructor(
        @InjectRepository(Fund)
        private readonly fundRepository: Repository<Fund>,
    ) { }

    async findAll(brands=true, dependantLimits=true) : Promise<Fund[]> {
        let query = this.fundRepository.createQueryBuilder('fund')
            .innerJoinAndSelect('fund.brands', 'brand');
        if (dependantLimits)
            query = query.innerJoinAndSelect('fund.dependantLimits', 'dependantLimit');
        if (!brands)
            query = query.where('fund.code=brand.code')
        return await query.getMany();
    }

    async findOne(code: string) : Promise<Fund> {
        const fund = await this.fundRepository.findOne({
            where: {
                code: code
            },
            relations: {
                brands: true,
                dependantLimits: true,
            }
        });
        if (!fund)
            throw new NotFoundException(`Fund ${code} not found`);
        return fund;
    }

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

        let brandDto = new CreateBrandDto();
        brandDto.code = fundDto.code;
        brandDto.name = fundDto.name;
        brandDto.phone = fundXml.find("Phone").text;
        brandDto.email = fundXml.find("Email").text;
        brandDto.website = fundXml.find("Website").text;
        fundDto.brands = [brandDto];

        const relatedBrands = fundXml.find("RelatedBrandNames");
        for (const brand of relatedBrands.findAll("Brand")) {
            brandDto = new CreateBrandDto();
            brandDto.code = brand.find("BrandCode").text;
            brandDto.name = brand.find("BrandName").text;
            brandDto.phone = brand.find("BrandPhone").text;
            brandDto.email = brand.find("BrandEmail").text;
            brandDto.website = brand.find("BrandWebsite").text;
            fundDto.brands.push(brandDto);
        }
        const states = fundXml.find("States");
        for (const state of states.findAll("State")) {
            const field = `state${state.text}`;
            if (fundDto.hasOwnProperty(field))
                fundDto[field] = true
            else
                throw `Unknown state: '${state.text}'`
        }
        const restrictions = fundXml.find("Restrictions");
        fundDto.restrictionDetails = restrictions.find("RestrictionDetails").text;
        fundDto.restrictionHint = restrictions.find("RestrictionHint").text;
        fundDto.restrictionDetails = restrictions.find("RestrictionParagraph").text;

        const fundDependantsXml = fundXml.find("FundDependants");
        fundDto.nonClassifiedDependantDescription = fundDependantsXml.find("NonClassifiedDependantDescription").text;
        fundDto.dependantLimits = [];
        for (const limitXml of fundDependantsXml.find("DependantLimits").findAll("DependantLimit")) {
            const limitDto = new CreateDependantLimitDto();
            limitDto.type = limitXml.attributes["Title"];
            limitDto.supported = limitXml.attributes["Supported"] === "true";
            limitDto.minAge = +limitXml.attributes["MinAge"];
            limitDto.maxAge = +limitXml.attributes["MaxAge"];
            fundDto.dependantLimits.push(limitDto)
        }
        return await this.create(fundDto);
    }
}
