/**
 * funds/funds.service.ts
 * ---
 * @author V.Puska
 * @date 01-Dec-2024
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DOMParser } from '@xmldom/xmldom';
import { Fund } from "./entities/fund.entity";
import { FundBrand } from './entities/fund-brand.entity';

/**
 * **FundsService**
 */
@Injectable()
export class FundsService {

    constructor(
        @InjectRepository(Fund)
        private readonly fundRepository: Repository<Fund>,
        @InjectRepository(FundBrand)
        private readonly fundBrandRepository: Repository<FundBrand>,
    ) { }

    /**
     * Return all fund records.
     */
    async findAll() : Promise<Object[]> {
        return await this.fundRepository.find({
            order: {'code': 'asc'}
        });
    }

    /**
     * Return all fund brand records.
     */
    async findAllFundBrands() : Promise<Object[]> {
        return await this.fundBrandRepository.find({
            order: {'code': 'asc'}
        });
    }

    /**
     * Return one fund.
     * @param code  The fund code - Eg. ```BUP```
     */
    async findOne(code: string) : Promise<Fund> {
        return await this.fundRepository.findOneBy({code: code});
    }

    /**
     * Create a fund record from PHIO XML data
     * @param xml - PHIO XML (string)
     */
    async createFromXML(xml:any): Promise<Fund> {
        const doc = new DOMParser().parseFromString(xml.toString(), 'text/xml');
        const fund =  this.fundRepository.create();
        fund.code = doc.getElementsByTagName("FundCode")[0].textContent;
        fund.name = doc.getElementsByTagName("FundName")[0].textContent;
        fund.type = doc.getElementsByTagName("FundType")[0].textContent;

        const fundBrand = this.fundBrandRepository.create();
        const shortName = this.shortName(fund.code);
        fundBrand.code = fund.code;
        fundBrand.name = fund.name;
        fundBrand.shortName = shortName ? shortName : fund.name;
        fundBrand.type = fund.type;
        await this.fundBrandRepository.save(fundBrand);

        const brands = doc.getElementsByTagName("RelatedBrandNames")[0]?.getElementsByTagName("Brand");
        for (const brand of brands) {
            const fundBrand = this.fundBrandRepository.create();
            fundBrand.code = brand.getElementsByTagName("BrandCode")[0].textContent;
            fundBrand.name = brand.getElementsByTagName("BrandName")[0].textContent;
            fundBrand.shortName = this.shortName(fundBrand.code) ? this.shortName(fundBrand.code) : fundBrand.name;
            fundBrand.type = fund.type;
            await this.fundBrandRepository.save(fundBrand);
        }
        return this.fundRepository.save(fund);
    }

    /**
     * Return a map of fund/brand codes to their short/friendly names.
     * @example ```{ "ACA" : "ACA Health", "AHB" : "Defence Health", ... }```
     * @returns A map of fund/brand codes to their short names.
     */
    shortName(fundBrandCode: string) : string | null {
        const fundBrands = {
            // funds
            "ACA" : "ACA Health",
            "AHB" : "Defence Health",
            "AHM" : "ahm",
            "AMA" : "Doctors Health",
            "AUF" : "Aust Unity",
            "BUP" : "Bupa",
            "CBC" : "CBHS Corporate",
            "CBH" : "Commonwealth Bank",
            "CDH" : "Hunter Health",
            "CPS" : "see-u by HBF",
            "FAI" : "GU Health",
            "GMH" : "GMHBA",
            "HBF" : "HBF",
            "HCF" : "HCF",
            "HCI" : "HCI",
            "HIF" : "HIF",
            "LHM" : "Peoplecare",
            "LHS" : "Latrobe",
            "MBP" : "Medibank",
            "MDH" : "Mildura Health",
            "MYO" : "AIA Health",
            "NHB" : "Navy Health",
            "NIB" : "NIB",
            "NTF" : "Teachers Health",
            "OMF" : "onemedifund",
            "PWA" : "Phoenix Health",
            "QCH" : "Queensland Country",
            "QTU" : "Teachers Health",
            "RBH" : "Reserve Bank Health",
            "RTE" : "RT Health",
            "SLM" : "St Lukes",
            "SPE" : "Police Health",
            "SPS" : "Health Partners",
            "WFD" : "Westfund",
            // brands
            "CDH01" : "Hunter Health",
            "CDH02" : "HHI",
            "GMH02" : "Frank Health",
            "LHS01" : "Federation Health",
            "MYO01" : "MyOwn",
            "NIB01" : "Qantas Insurance",
            "NIB02" : "AAMI",
            "NIB03" : "Suncorp Insurance",
            "NIB04" : "Priceline Health",
            "NIB05" : "Apia Health",
            "NIB06" : "ING Health",
            "NIB07" : "Real Health",
            "NIB08" : "Australian Seniors",
            "NIB09" : "GU Health",
            "QCH02" : "Territory Health",
            "QTU01" : "Union Health",
            "SLM01" : "Astute Simplicity",
            "SPE01" : "Emergency Services",
        }

        if (fundBrandCode in fundBrands)
            return fundBrands[fundBrandCode];
        else
            return null;
    }
}
