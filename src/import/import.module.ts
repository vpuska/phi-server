/**
 * import/import.module.ts
 * ---
 * @author V.Puska
 * @date 01-Dec-2025
 */
import { Module } from '@nestjs/common';

import { ImportService } from './import.service';
import { ProductsModule } from "../products/products.module";
import { FundsModule } from "../funds/funds.module";
import { CacheModule } from "../cache/cache.module";
import { SystemModule } from '../system/system.module';
import { ImportCommand } from './import.command';

@Module({
  imports: [ProductsModule, FundsModule, CacheModule, SystemModule],
  providers: [ImportService, ImportCommand ],
  exports: [ ImportCommand],
})
/**
 * **ImportModule**
 *
 * @Imports {@link ProductsModule}, {@link FundsModule}, {@link CacheModule}, {@link SystemModule},
 * @Provides {@link ImportService}, {@link ImportCommand}
 * @Exports {@link ImportCommand}
 */
export class ImportModule {}
