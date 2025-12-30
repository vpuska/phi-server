/**
 * cache/cache.module.ts
 * ---
 * @author V.Puska
 * @Date 29-Dec-2025
 * @Comments Manages caching of queries.
 */
import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';

@Module({
    imports: [],
    controllers: [],
    providers: [CacheService],
    exports: [CacheService],
})
export class CacheModule {}
