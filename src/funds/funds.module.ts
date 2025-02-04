/**
 * funds/funds.module.ts
 * ----
 * @author V Puska
 * @date 01-Dec-2024
 */
import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import { FundsService } from './funds.service';
import { Fund } from "./entities/fund.entity";
import { FundsController } from './funds.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Fund])],
    exports: [TypeOrmModule, FundsService],
    providers: [FundsService],
    controllers: [FundsController],
})

export class FundsModule {}
