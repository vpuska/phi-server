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

    /**
     * Return a cache of products
     */
    @Get('cache')
    async getCache() {
        return this.productService.groups;
    }
}

/**
 * Return a list of matching OPEN products by state/type/adults/dependants.
 * @param state State
 * @param cover `1 | 2 | 0D | 1D | 2D` - code representing number of adults and if dependants included
 */
/*
    @Get('segment/:state/:cover')
    @ApiOperation({
        summary: 'Return a list OPEN products for a market segment (state and persons covered)',
        description: 'Return a list OPEN products for a market segment (state and persons covered)',
    })
    @ApiParam({
        name: 'state',
        description: 'State of residence.',
        example: 'NSW',
        required: true,
    })
    @ApiParam({
        name: 'cover',
        description: '`1 | 2 | 0D | 1D | 2D` - code representing number of adults and if dependants included',
        example: '1D',
        required: true,
    })
    list(
        @Param('state') state: string,
        @Param('cover') cover: string,
    ) {
        if (!["1", "2", "0D", "1D", "2D"].includes(cover)) {
            throw new HttpException(`Invalid Cover Code - ${cover}`, HttpStatus.BAD_REQUEST);
        }
        return this.productService.findByMarketSegment(
            state,
            +cover[0] as 0 | 1 | 2,
            cover[1] === 'D',
        );
    }
    */

/**
 * List all OPEN products table extracting policies for a single fund or brand.  Includes corporate products.
 * @param fundCode
 */
/*
    @Get('fund/:fundCode')
    @ApiOperation({
        summary: 'Return a list of all OPEN products for a single fund.',
        description: 'Return a list of all OPEN products for a single fund.  Result includes all sub-brands.',
    })
    @ApiParam({
        name: 'fundCode',
        description: 'Fund code.',
        example: 'NIB',
        required: true,
    })
    listForFundOrBrand(
        @Param('fundCode') fundCode: string,
    ) {
        return this.productService.findByFund(fundCode);
    }
}
*/

/**
 * **ProductSearchController** provides access to product search.
 */
/*
@ApiTags('Product Search')
@Controller('product-search')
export class ProductSearchController {

    constructor(private readonly ProductSearchService: ProductsSearchService) {
    }

    @Get('dataset')
    @ApiOperation({
        summary: 'Return dataset of product titles and product codes with searchable attributes.',
        description: 'Return a list of matching products by title.',
    })
    listDataset() {
        return this.ProductSearchService.getDataset();
    }
}
*/

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
