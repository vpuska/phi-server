import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Product} from "./entities/product.entity";
import {BenefitsList} from "./entities/benefits-list.entity";
import { ProductsController } from './products.controller';
import { HealthService } from './entities/health-service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, HealthService, BenefitsList])],
  exports: [TypeOrmModule, ProductsService],
  providers: [ProductsService],
  controllers: [ProductsController]
})

export class ProductsModule {}
