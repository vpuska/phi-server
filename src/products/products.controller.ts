/**
 * products/products.controller.ts
 * ---
 * @author: V.Puska
 * @date: 12-Dec-2024
 */
import { Controller, Get, Header, HttpException, HttpStatus, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';

/**
 * **ProductController** provides access to the cacheable product queries.
 */
@Controller('products')
export class ProductsController {

    constructor(private readonly productService: ProductsService) {}

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
        const product = await this.productService.getXml(fundCode, `${code1}/${code2}`)
        if (product)
            return product;
        else
            throw new NotFoundException(`Product ${code1}/${code2} found.`);
    }

    /**
     * Return a list of matching OPEN products by state/type/adults/dependants.
     * @param state State
     * @param cover `1 | 2 | 0D | 1D | 2D` - code representing number of adults and if dependants included
     */
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

    /**
     * List all OPEN products table extracting policies for a single fund or brand.  Includes corporate products.
     * @param fundCode
     * */
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

/**
 * **ProductSearchController** provides access to product search.
 */
@ApiTags('Product Search')
@Controller('product-search')
export class ProductSearchController {

    constructor(private readonly productService: ProductsService) {}

    /**
     * Return a list of matching products by title.  The keywords are matched against the product title and fund/branch name.
     * @example /product-search/by-name?name=Hospital%20Gold%20Plus&fund=NIB
     * @param title - Exact title to search for.
     * @param fundOrBrandCode - fund or brand code to search for.  If not specified, all funds are searched.
     */
    @Get('by-name')
    @ApiOperation({
        summary: 'Return a list of matching products by title.',
        description: 'Return a list of matching products by title.',
    })
    @ApiQuery({
        name: 'name',
        description: 'Product title.',
        required: true,
        example: 'Hospital Gold Plus'
    })
    @ApiQuery({
        name: 'fund',
        description: 'Fund code.',
        required: false,
        example: 'NIB'
    })
    @ApiQuery({
        name: 'count',
        description: 'Number of records to return.  Default is 20.',
        required: false,
        example: 15
    })
    getTitleList(
        @Query('name') title: string,
        @Query('fund') fundOrBrandCode: string = null,
    ) {
        return this.productService.findByTitle(title, fundOrBrandCode);
    }

    /**
     * Return a list of matching products by keywords.  The keywords are matched against the product title and fund/branch name.
     * @example /product-search/by-keyword?keywords=hospital%20gold%20plus
     * @param keywords - keywords to search for.
     * @param count - maximum number of records to return.  Default is 20.
     * @param timeout - maximum time in milliseconds to wait for results.  Default is 1000ms.
     */
    @Get('by-keyword')
    @ApiOperation({
        summary: 'Return a list of matching products by keywords.',
        description: 'Return a list of matching products by keywords.',
    })
    @ApiQuery({
        name: 'keywords',
        description: 'Keywords to search for.',
        required: true,
        example: 'hospital gold plus'
    })
    @ApiQuery({
        name: 'count',
        description: 'Number of records to return.  Default is 50.',
        required: false,
        example: 15
    })
    @ApiQuery({
        name: 'timeout',
        description: 'Maximum time in milliseconds to wait for results.  Default is 1000ms.',
        required: false,
        example: 1500
    })
    search(
        @Query('keywords') keywords: string,
        @Query('count') count: number = 50,
        @Query('timeout') timeout: number = 1000,
    ) {
        return this.productService.searchKeyWords(keywords, count, timeout);
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