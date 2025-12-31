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
    async findAll() : Promise<Object[]> {
        return await this.fundRepository.find({
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
        return await this.fundRepository.save(fund);
    }
}
