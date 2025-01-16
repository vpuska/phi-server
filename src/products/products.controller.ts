/**
 * products/products.controller.ts
 * ---
 * Author: V.Puska
 */
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductSearchDto } from './dto/product-search.dto';

/**
 * **ProductController** provides access to product queries and actions.
 */
@Controller('products')
export class ProductsController {

    static DEPENDANT_TYPES = ["child", "student", "nonStudent", "nonClassified", "conditionalNonStudent", "disability" ];

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

    @Post('search')
    search(@Body() data: ProductSearchDto) {

        const dependantFilter = {};
        for (const dependant of ProductsController.DEPENDANT_TYPES) {
            const property = `${dependant}Cover`;
            if (data[property])
                dependantFilter[property] = true;
        }
        if (Object.keys(dependantFilter).length === 0) {
            for (const dependant of ProductsController.DEPENDANT_TYPES) {
                const property = `${dependant}Cover`;
                dependantFilter[property] = false;
            }
        }

        return this.productService.search(
            data.hospitalCover,
            data.generalCover,
            data.hospitalTier,
            data.state === "ACT" ? "NSW" : data.state,
            data.numberOfAdults,
            dependantFilter
        )
    }
}
