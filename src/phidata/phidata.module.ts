/**
 * phidata/phidata.module.ts
 * ---
 * @author V.Puska
 * @date 01-Dec-2025
 */
import {Module} from '@nestjs/common';
import { PhiDataService } from './phidata.service';
import {ProductsModule} from "../products/products.module";
import {FundsModule} from "../funds/funds.module";
import {CacheModule} from "../cache/cache.module";
import { SystemModule } from '../system/system.module';

@Module({
  imports: [ProductsModule, FundsModule, CacheModule, SystemModule],
  providers: [PhiDataService],
})
/**
 * **PhiDataModule**
 *
 * Provides {@link PhiDataService}
 */
export class PhiDataModule {}
