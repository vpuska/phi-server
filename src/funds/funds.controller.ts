/**
 * funds/funds.controller.ts
 * ---
 * @author V. Puska
 */
import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { FundsService } from './funds.service';
import { ApiOperation, ApiParam, ApiQuery, ApiSchema } from '@nestjs/swagger';
import { CacheService } from '../cache/cache.service';


@Controller('funds')
export class FundsController {
    constructor(
        private readonly fundsService: FundsService,
        private readonly cacheService: CacheService
    ) {}

    /**
     * Returns all fund records.
     * @example Return `FundDependants` and `RelatedBrandNames`
     * /funds/?tags=FundDependants,RelatedBrandNames
     * @example Return the complete `Fund` element
     * /funds/?tags=Fund
     * @param tags Optional. Comma-delimited array of XML elements to include in the result.
     */
    @Get()
    @ApiOperation({
        summary: 'Return all fund records.',
        description: `Return all **fund** records.  An optional list of XML tag names can be selected
                      to include with the result.`,
    })
    @ApiQuery({
        name: 'tags',
        required: false,
        description: 'Comma-separated list of required XML tags',
        example: 'FundDependants,RelatedBrandNames',
    })
    findAll(@Query('tags') tags?: string) {
        if (tags)
            return this.fundsService.findAll(tags.split(','))
        else
            return this.fundsService.findAll();
    }

    /**
     * Returns all fields, incuding the complete XML document, for one fund
     * @example /funds/BUP
     * @param code - fund code
     */
    @Get('get/:code')
    @ApiOperation({
        summary: 'Return a single fund record.',
        description: `Return a single **fund** record`
    })
    @ApiParam({
        name: 'code',
        required: true,
        description: 'The fund code.',
        example: "BUP"
    })
    findOne(@Param('code') code: string) {
        return this.fundsService.findOne(code.toUpperCase());
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
