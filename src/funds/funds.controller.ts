/**
 * funds/funds.controller.ts
 * ---
 * @author V. Puska
 */
import { Controller, Get, Param } from '@nestjs/common';
import { FundsService } from './funds.service';

@Controller('funds')
export class FundsController {
    constructor(private readonly fundsService: FundsService) {}
    /**
     * Return all fund records
     */
    @Get()
    fundAll() {
        return this.fundsService.findAll();
    }
    /**
     * Return one fund record
     * @param code - fund code
     */
    @Get(':code')
    findOne(@Param('code') code: string) {
        return this.fundsService.findOne(code);
    }

}
