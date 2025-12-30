import { Injectable, Logger } from '@nestjs/common';
import { CacheService, CacheMode } from '../cache/cache.service';

@Injectable()
export class ProductsCacheService {

    productXmlCacheMode: CacheMode = (process.env.PRODUCT_XML_CACHE || "none") as CacheMode;
    productFundCacheMode: CacheMode = (process.env.PRODUCT_FUND_CACHE || "none") as CacheMode;
    //TODO: change to PRODUCT_SEGMENT_CACHE
    productSearchCacheMode: CacheMode = (process.env.PRODUCT_SEARCH_CACHE || "none") as CacheMode;

    logger = new Logger('ProductsCacheService');

    constructor(
        private readonly cacheService: CacheService,
    ) {}

    /**
     * Write out the product XML cache file according to the PRODUCT_XML_CACHE environment setting. <br>
     * Note: we ALWAYS write an XML cache - if the setting is `none`, we write the uncompressed version
     * @param fundCode
     * @param prodCode
     * @param data
     */
    writeProductXmlCache(fundCode: string, prodCode: string, data: any) {
        const fileName = `products/xml/${fundCode}/${prodCode}`;

        if (this.productXmlCacheMode === "none")
            this.cacheService.writeCache(fileName, "compressed", data);
        else
            this.cacheService.writeCache(fileName, this.productXmlCacheMode, data);
    }

    /**
     * Read Product XML cache.
     * @param fundCode
     * @param prodCode
     */
    async readProductXmlCache(fundCode: string, prodCode: string) {
        const baseFileName = `products/xml/${fundCode}/${prodCode}`;
        return await this.cacheService.readCache(baseFileName);
    }

    async cacheProductFundQueries(funds: string[], queryFunction: (fundCode: string) => any) {
        this.logger.log(`PRODUCT_FUND_CACHE=${this.productFundCacheMode}`);
        if (this.productFundCacheMode !== "none") {
            for (const fundCode of funds) {
                this.cacheService.writeCache(
                    `products/fund/${fundCode}`,
                    this.productFundCacheMode,
                    JSON.stringify(await queryFunction(fundCode))
                )
            }
        }
    }

    async cacheProductSegmentQueries(queryFunction: (state: string, adultsCovered: 0 | 1 | 2, dependants: boolean) => any) {
        this.logger.log(`PRODUCT_SEARCH_CACHE=${this.productSearchCacheMode}`);
        if (this.productSearchCacheMode !== "none")
            for (const state of [ "NSW", "VIC", "QLD", "TAS", "SA", "WA", "NT" ])
                for (const adults of [0, 1, 2])
                    for (const dependants of [true, false])
                        if (adults > 0 || dependants)
                            this.cacheService.writeCache(
                                `products/segment/${state}/${adults}${dependants ? "D" : ""}`,
                                this.productSearchCacheMode,
                                JSON.stringify(await queryFunction(state, adults as 0|1|2, dependants))
                            )

    }
}
