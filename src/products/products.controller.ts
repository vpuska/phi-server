/*
 * products/products.controller.ts
 * -------------------------------
 * author: V.Puska
 * date: 12-Dec-2024
 */

import {
    Controller,
    Get,
    Header,
    NotFoundException,
    Param,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
//import { ProductsSearchService } from './products.search.service';
import { Product } from './entities/product.entity';

/**
 * **ProductController** provides access to the cacheable product queries.
 */
@Controller('products')
export class ProductsController {
    constructor(private readonly productService: ProductsService) {}

    /**
     * Return the product dataset.  The dataset in a complete list of products serialized into JSON arrays.
     */
    @Get('dataset')
    @Header('content-type', 'application/json')
    @ApiOperation({
        summary: 'Returns the complete product dataset.',
        description:
            'Returns the complete product dataset serialised an array of product groups.  Each product group represents a distinct product title.',
    })
    async getDataset() {
        return this.productService.streamProductDataset();
    }

    /**
     * Return a single product. Code is split into 2 fields because the
     * product code includes the `/` character.  EG `I119/WNDI2D`
     * @param fundCode - The fund for this product.  EG. `HIF`
     * @param code1 - 1st part of product code.  EG `I119`
     * @param code2 - Snd part of product code.  EG `WND12D`
     */
    @Get('find/:fundCode/:code1/:code2')
    @Header('content-type', 'application/json')
    @ApiOperation({
        summary: 'Return a single product.',
        description:
            'Returns a single product using the fund code and product code.',
    })
    @ApiParam({
        name: 'fundCode',
        description: 'The fund code for this product.',
        example: 'HIF',
        required: true,
    })
    @ApiParam({
        name: 'code1',
        description: 'First part of the product code.',
        example: 'I119',
        required: true,
    })
    @ApiParam({
        name: 'code2',
        description: 'Second part of the product code.',
        example: 'WND12D',
        required: true,
    })
    async find(
        @Param('fundCode') fundCode: string,
        @Param('code1') code1: string,
        @Param('code2') code2: string,
    ): Promise<Product> {
        const product = await this.productService.findOne(
            fundCode,
            `${code1}/${code2}`,
        );
        if (product) return product;
        else
            throw new NotFoundException(
                `Product ${fundCode}/${code1}/${code2} not found.`,
            );
    }

    /**
     * Retrieve the XML data for a single product.  Code is split into 2 fields because the
     * product code includes the `/` character.  EG `I119/WNDI2D`
     *
     * @param fundCode - The fund for this product.  EG. `HIF`
     * @param code1 - 1st part of product code.  EG `I119`
     * @param code2 - Snd part of product code.  EG `WND12D`
     */
    @Get('xml/:fundCode/:code1/:code2')
    @Header('content-type', 'application/xml')
    @ApiOperation({
        summary: 'Return XML for a single product.',
        description:
            'Returns the XML for a single product using the product code as a key. Eg: `I119/WND12D`',
    })
    @ApiParam({
        name: 'fundCode',
        description: 'The fund code for this product.',
        example: 'HIF',
        required: true,
    })
    @ApiParam({
        name: 'code1',
        description: 'First part of the product code.',
        example: 'I119',
        required: true,
    })
    @ApiParam({
        name: 'code2',
        description: 'Second part of the product code.',
        example: 'WND12D',
        required: true,
    })
    async getXML(
        @Param('fundCode') fundCode: string,
        @Param('code1') code1: string,
        @Param('code2') code2: string,
    ) {
        const product = await this.productService.getXml(
            fundCode,
            `${code1}/${code2}`,
        );
        if (product) return product;
        else
            throw new NotFoundException(`Product ${code1}/${code2} not found.`);
    }
}

/**
 * **ProductServicesController** provides access to product services.
 */
@ApiTags('Product Services')
@Controller('product-services')
export class ProductServicesController {
    constructor(private readonly productService: ProductsService) {}

    /**
     * Return a list of hospital and general medical services.
     */
    @Get('')
    @ApiOperation({
        summary: 'Return a list of hospital and general medical services.',
        description:
            'Return a list of hospital and general medical services and provides a mapping between the mnemonics' +
            'stored in the product record against the actual service description and code.',
    })
    serviceList() {
        return this.productService.serviceList();
    }
}
