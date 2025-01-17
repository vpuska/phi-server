/**
 * funds/funds.controller.ts
 * ---
 * @author V. Puska
 */
import { Controller, Get, Param, Query } from '@nestjs/common';
import { FundsService } from './funds.service';

@Controller('funds')
export class FundsController {
    constructor(private readonly fundsService: FundsService) {}
    /**
     * Returns all fund records.
     * @example Return `FundDependants` and `RelatedBrandNames`
     * /funds/?elements=FundDependants,RelatedBrandNames
     * @example Return the complete `Fund` element
     * /funds/?elements=Fund
     * @param elements Optional. Comma-delimited array of XML elements to include in the result.
     */
    @Get()
    fundAll(@Query('elements') elements: string) {
        if (elements)
            return this.fundsService.findAll(elements.split(','))
        else
            return this.fundsService.findAll();
    }
    /**
     * Returns all fields, incuding the complete XML document, for one fund
     * @example /funds/BUP
     * @param code - fund code
     */
    @Get(':code')
    findOne(@Param('code') code: string) {
        return this.fundsService.findOne(code);
    }

}
