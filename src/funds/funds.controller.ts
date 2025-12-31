/**
 * funds/funds.controller.ts
 * ---
 * @author V. Puska
 */
import { Controller, Get, Header } from '@nestjs/common';
import { FundsService } from './funds.service';
import { ApiOperation } from '@nestjs/swagger';
import { CacheService } from '../cache/cache.service';


@Controller('funds')
export class FundsController {
    constructor(
        private readonly fundsService: FundsService,
        private readonly cacheService: CacheService
    ) {}

    /**
     * Returns all fund records.
     */
    @Get()
    @ApiOperation({
        summary: 'Return all fund records.',
        description: `Return all **fund** records`,
    })
    findAll() {
        return this.fundsService.findAll();
    }

    @Get("xml")
    @Header('content-type', 'application/xml')
    @ApiOperation({
        summary: 'Returns all fund details in XML format.',
        description: 'Returns the XML fund package downloaded from data.gov.au.'
    })
    async findXML() {
        return await this.cacheService.readCache("funds/xml")
    }
}
