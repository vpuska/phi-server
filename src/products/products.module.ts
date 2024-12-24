/**
 * products/products.module.ys
 * ---
 * @author V.Puska
 */

import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Product} from "./entities/product.entity";
import { ProductsController } from './products.controller';
import { HealthService } from './entities/health-service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, HealthService])],
  exports: [TypeOrmModule, ProductsService],
  providers: [ProductsService],
  controllers: [ProductsController]
})
export class ProductsModule {}
