/**
 * products/products.search.service.ts
 * ----
 * @author: V. Puska
 * @date: 20-Jul-2026
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Interval } from '@nestjs/schedule';
import { MoreThanOrEqual, Repository } from 'typeorm';

import { compressAttributes} from 'phi-common';

import { Product } from './entities/product.entity';
import { SystemService } from '../system/system.service';

/**
 * Object representing a disting product title
 */
export interface ProductTitle {
    name: string;
    fundBrandCode: string;
    type: string;
}
/**
 * Object representing a product code and associated title and attributes.
 */
export interface ProductCodeAndAttributes {
    productCode: string;
    group: number;
    attributes: number;
}
/**
 * **ProductSearchService**
 */
@Injectable()
export class ProductsSearchService {

    // Latest import time stamp.  Used to determine which products to return from the database.
    private timeStamp = new Date(0);
    // Array of product titles
    private productTitles = new Array<ProductTitle>();
    // Array of product codes and associated title and attributes.
    private productCodes = new Array<ProductCodeAndAttributes>();

    private logger = new Logger(ProductsSearchService.name);

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        private readonly systemService: SystemService

    ) {
        this.updateTimeStamp(); // this will also update the product search tables
    }
    /**
     * Update the last run time stamp every 15 minutes.  Called directly by the constructor and scheduled by NestJS.
     */
    @Interval(15 * 60 * 1000)
    updateTimeStamp() {
        this.systemService.get("IMPORT", "LASTRUN", new Date(0).toString()).then(timeStampString => {
            const timeStamp = new Date(timeStampString);
            if (this.timeStamp < timeStamp) {
                this.timeStamp = timeStamp;
                this.logger.debug(`IMPORT time stamp changed to ${timeStampString}`);
                this.buildProductSearchTables().then();
            }
        })
    }
    /**
     * Load the product search tables into memory:
     * - `productTitles` : Array of distinct product titles
     * - `productCodes` : Array of product codes and associated title and attributes
     */
    async buildProductSearchTables() {

        const rows = await this.productRepository
            .createQueryBuilder()
            .select([
                'code', 'name', 'fundBrandCode', 'type', 'state', 'excess',
                'adultsCovered', 'childCover', 'studentCover', 'youngAdultCover', 'disabilityCover'
            ])
            .where({timeStamp: MoreThanOrEqual(this.timeStamp)})
            .orderBy({'name': 'ASC', 'fundCode': 'ASC', 'brands': 'ASC', 'type': 'ASC'})
            .getRawMany();

        let currentTitle: ProductTitle = {
            name: "",
            fundBrandCode: "",
            type: "",
        };

        for (const row of rows) {
            if (currentTitle.name !== row.name ||
                currentTitle.fundBrandCode !== row.fundBrandCode ||
                currentTitle.type !== row.type) {
                currentTitle = {
                    name: row.name,
                    fundBrandCode: row.fundBrandCode,
                    type: row.type,
                };
                this.productTitles.push(currentTitle);
            }
            this.productCodes.push({
                group: this.productTitles.length - 1,
                productCode: row.code,
                attributes: compressAttributes(row)
            });
        }

        this.logger.debug(`Analysed ${rows.length} product records`);
        this.logger.debug(`Found ${this.productTitles.length} product groups`);
    }
    /**
     * Retrieves a dataset containing product titles and product codes.
     * - `productTitles` : Array of distinct product titles
     * - `productCodes` : Array of product codes and associated title and attributes
     */
    getDataset() {
        return {
            productTitles: this.productTitles,
            productCodes: this.productCodes,
        }
    }
}


