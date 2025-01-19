/**
 * funds/funds.service.ts
 * ---
 * @author V.Puska
 * @date 01-Dec-2024
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
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
     * @param elements - Optional array of element names
     */
    async findAll(elements : string[] = []) : Promise<Object[]> {
        const result = await this.fundRepository.find();
        const result2 = [];
        const parser = new DOMParser();
        const serializer = new XMLSerializer();
        for (const fund of result) {
            const { xml, ...obj } = fund;
            for (const key of elements) {
                const doc = parser.parseFromString(xml, 'text/xml')
                const elems = doc.getElementsByTagName(key);
                if (elems.length > 0)
                    obj[key] = serializer.serializeToString(elems[0]);
            }
            result2.push(obj);
        }
        return result2;
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
        fund.xml = xml.toString()

        return await this.fundRepository.save(fund);
    }
}
