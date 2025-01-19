/**
 * phi-load/phi-load.module.ts
 * ---
 * @author V.Puska
 * @date 01-Dec-2025
 */
import {Module} from '@nestjs/common';
import { PhiLoadService } from './phi-load.service';
import {ProductsModule} from "../products/products.module";
import {FundsModule} from "../funds/funds.module";


@Module({
  imports: [ProductsModule, FundsModule],
  providers: [PhiLoadService],
})
/**
 * **PhiLoadModule**
 *
 * Provides {@link PhiLoadService}
 */
export class PhiLoadModule {}
