import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Product} from "./entities/product.entity";
import {HealthService} from "./entities/health-service.entity";
import {BenefitsList} from "./entities/benefits-list.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Product, HealthService, BenefitsList])],
  exports: [TypeOrmModule, ProductsService],
  providers: [ProductsService]
})

export class ProductsModule {}
