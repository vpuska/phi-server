/**
 * products/products.controller.ts
 * ---
 * Author: V.Puska
 */
import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

/**
 * **ProductController** provides access to product queries and actions.
 */
@Controller('products')
export class ProductsController {
    constructor(private readonly productService: ProductsService) {}
    /**
     * Find a single product using the product code.  Code is split into 2 fields because the
     * product code includes a ```/``` character.  Eg ```I119/WNDI2D```
     *
     * Returns the product code and xml.
     *
     * @param code1 - 1st part of product code.  Eg ```I119```
     * @param code2 - Snd part of product code.  Eg. ```WND12D```
     */
    @Get('xml/:code1/:code2')
    async findOne(@Param('code1') code1: string, @Param('code2') code2: string) {
        const product = await this.productService.findByOne(`${code1}/${code2}`);
        return { code: product.code, xml: product.xml };
    }
    /**
     * Return a list of hospital and general services
     */
    @Get('services')
    serviceList() {
        return this.productService.serviceList();
    }
    /**
     * Returns all single parent policies for a given state.  (1 adult and children covered)
     * @param state - State code
     */
    @Get('search/singleparent/:state')
    singleparent(@Param('state') state: string) {
        return this.productService.search(state, 1, true);
    }
    /**
     * Returns all family policies for a given state.  (2 adults and children covered)
     * @param state - State code
     */
    @Get('search/family/:state')
    family(@Param('state') state: string) {
        return this.productService.search(state, 2, true);
    }
    /**
     * Returns all singles policies for a given state.  (1 adult and children not covered)
     * @param state
     */
    @Get('search/single/:state')
    single(@Param('state') state: string) {
        return this.productService.search(state, 1, false);
    }
    /**
     * Returns all couples policies for a given state.  (2 adults and children not covered)
     * @param state - State code
     */
    @Get('search/couple/:state')
    couple(@Param('state') state: string) {
        return this.productService.search(state, 2, false);
    }
}
