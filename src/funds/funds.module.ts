import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import { Fund } from "./entities/fund.entity";
import { FundsService } from './funds.service';

@Module({
    imports: [TypeOrmModule.forFeature([Fund])],
    exports: [TypeOrmModule],
    providers: [FundsService],
})

export class FundsModule {}
