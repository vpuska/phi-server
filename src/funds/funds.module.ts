import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import { FundsService } from './funds.service';
import { Brand } from './entities/brand.entity';
import { Fund } from "./entities/fund.entity";
import { FundsController } from './funds.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Fund, Brand])],
    exports: [TypeOrmModule],
    providers: [FundsService],
    controllers: [FundsController],
})

export class FundsModule {}
