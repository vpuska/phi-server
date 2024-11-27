import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fund } from "./entities/fund.entity";
import { CreateFundDto } from "./dto/fund.dto";
import { XML2JSObject, XMLElement } from "../libs/xml-lib";
import { CreateBrandDto } from './dto/brand.dto';
import { Brand } from './entities/brand.entity';


@Injectable()
export class FundsService {

    constructor(
        @InjectRepository(Fund)
        private readonly fundRepository: Repository<Fund>,
        @InjectRepository(Brand)
        private readonly brandRepository: Repository<Brand>,
    ) { }

    async findOne(code: string) {
        const coffee = await this.fundRepository.findOne({
            where: {
                code: code
            },
            relations: {
                brands: true
            }
        });
        if (!coffee)
            throw new NotFoundException(`Fund ${code} not found`);
        return coffee;
    }

    async create(createFundDto: CreateFundDto): Promise<Fund> {
        const fund = this.fundRepository.create(createFundDto);
        const record = await this.fundRepository.save(fund);

        const brand = this.brandRepository.create({
            fund,
            ...createFundDto.brands[0]
        });
        await this.brandRepository.save(brand);
        return record;
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

        return await this.create(fundDto);

    }
    async remove(id: string) {
        const fund = await this.findOne(id);
        return this.fundRepository.remove(fund);
    }
}
