/**
 * products/products.module.ys
 * ---
 * @author V.Puska
 * @date: 01-Dec-2024
 */

import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from "./entities/product.entity";
import { HealthService } from './entities/health-service.entity';
import { HospitalTier } from './entities/hospital-tier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, HealthService, HospitalTier])],
  exports: [TypeOrmModule, ProductsService],
  providers: [ProductsService],
  controllers: [ProductsController]
})
export class ProductsModule {}
