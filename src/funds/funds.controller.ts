import { Controller, Get, Param } from '@nestjs/common';
import { FundsService } from './funds.service';

@Controller('funds')
export class FundsController {
    constructor(private readonly fundsService: FundsService) {}

    @Get(':code')
    findOne(@Param('code') code: string) {
        return this.fundsService.findOne(code);
    }

}
