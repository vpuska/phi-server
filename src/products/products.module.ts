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
import { CacheModule } from '../cache/cache.module'
import { ProductsLoadService } from './products.load.service';
import { ProductsCacheService } from './products.cache.service';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, HealthService, HospitalTier]), CacheModule, SystemModule],
  exports: [TypeOrmModule, ProductsService, ProductsLoadService, ProductsCacheService],
  providers: [ProductsService, ProductsLoadService, ProductsCacheService],
  controllers: [ProductsController]
})
export class ProductsModule {}
