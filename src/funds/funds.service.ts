/**
 * funds/funds.service.ts
 * ---
 * @author V.Puska
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XmlElement } from "../utils/xml";

import { Fund } from "./entities/fund.entity";

/**
 * **FundsService**
 */
@Injectable()
export class FundsService {

    constructor(
        @InjectRepository(Fund)
        private readonly fundRepository: Repository<Fund>,
    ) { }

    /**
     * Return all fund records.
     */
    async findAll() : Promise<Fund[]> {
        return await this.fundRepository.find();
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
     * @param xml - PHIO XML
     */
    async createFromXML(xml:any): Promise<Fund> {
        const fundXml = XmlElement.fromXML(xml);
        const fund =  this.fundRepository.create();

        fund.code = fundXml.find("FundCode").text;
        fund.name = fundXml.find("FundName").text;
        fund.type = fundXml.find("FundType").text;
        fund.xml = xml.toString()

        return await this.fundRepository.save(fund);
    }
}
