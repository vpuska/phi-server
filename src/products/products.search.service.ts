/*
 * products/products.search.service.ts
 * ------------------------------------
 * author: V. Puska
 * date: 20-Jul-2026
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Interval } from '@nestjs/schedule';
import { MoreThanOrEqual, Repository } from 'typeorm';

import { compressAttributes, ProductSearchTitle } from 'phi-common';

import { Product } from './entities/product.entity';
import { SystemService } from '../system/system.service';

/**
 * **ProductSearchService**
 */
@Injectable()
export class ProductsSearchService {

    // Latest import time stamp.  Used to determine which products to return from the database.
    private timeStamp = new Date(0);
    // Array of product titles
    private productTitles = new Array<ProductSearchTitle>();

    private logger = new Logger(ProductsSearchService.name);

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        private readonly systemService: SystemService

    ) {
        this.updateTimeStamp(); // this will also update the product search tables
    }
    /**
     * Check the last import run time stamp every 15 minutes.  Called directly by the constructor and scheduled by NestJS.
     * If the time stamp has changed, update the product search tables.
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
     * Load the product title search table into memory.
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

        let currentTitle: ProductSearchTitle = {
            name: "",
            fundBrandCode: "",
            type: "",
            products: []
        };

        for (const row of rows) {
            if (currentTitle.name !== row.name ||
                currentTitle.fundBrandCode !== row.fundBrandCode ||
                currentTitle.type !== row.type) {
                currentTitle = {
                    name: row.name,
                    fundBrandCode: row.fundBrandCode,
                    type: row.type,
                    products: []
                };
                this.productTitles.push(currentTitle);
            }
            currentTitle.products.push(row.code, compressAttributes(row));
        }

        this.logger.debug(`Analysed ${rows.length} product records`);
        this.logger.debug(`Found ${this.productTitles.length} product groups`);
    }
    /**
     * Retrieves a dataset containing product titles and product codes.
     */
    getDataset() {
        return this.productTitles;
    }
}


