import { Module } from '@nestjs/common';
import { PhiLoadService } from './phi-load.service';
import {ProductsModule} from "../products/products.module";
import {FundsModule} from "../funds/funds.module";


@Module({
  imports: [ProductsModule, FundsModule],
  providers: [PhiLoadService],
})
export class PhiLoadModule {}
