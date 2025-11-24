/**
 * products/products.controller.ts
 * ---
 * @author: V.Puska
 * @date: 12-Dec-2024
 */
import { Controller, Get, HttpException, HttpStatus, NotFoundException, Param } from "@nestjs/common";
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service';

/**
 * **ProductController** provides access to product queries and actions.
 */
@Controller('products')
export class ProductsController {
    static DEPENDANT_TYPES = ['child', 'student', 'youngAdult', 'disability'];

    constructor(private readonly productService: ProductsService) {}

    /**
     * Find a single product using the product code.  Code is split into 2 fields because the
     * product code includes the `/` character.  Eg `I119/WNDI2D`
     *
     * Returns the product code and xml.
     *
     * @param code1 - 1st part of product code.  Eg ```I119```
     * @param code2 - Snd part of product code.  Eg. ```WND12D```
     */
    @Get('xml/:code1/:code2')
    @ApiOperation({
        summary: 'Return a single product.',
        description:
            'Return a simple record identified by its product code.  The product code ' +
            'is the "PHIS" code.  Eg. `I119/WND12D`',
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
    async findOne(
        @Param('code1') code1: string,
        @Param('code2') code2: string,
    ) {
        const product = await this.productService.findByOne(
            `${code1}/${code2}`,
        );
        if (product) return { code: product.code, xml: product.xml };
        else throw new NotFoundException(`Product ${code1}/${code2} found.`);
    }

    /**
     * Return a list of hospital and general services
     */
    @Get('services')
    @ApiOperation({
        summary: 'Return a list of hospital and general medical services.',
        description:
            'Return a list of hospital and general medical services and provides a mapping between the mnemonics' +
            'stored in the product record against the actual service description and code.',
    })
    serviceList() {
        return this.productService.serviceList();
    }

    /**
     * Return a list of matching OPEN products by state/type/adults/dependants.
     * @param state State
     * @param type `Hospital | GeneralHealth | Combined`
     * @param cover `1 | 2 | 0D | 1D | 2D` - code representing number of adults and if dependants included
     */
    @Get(':state/:type/:cover')
    @ApiOperation({
        summary: 'Return a list OPEN products matching search criteria',
        description: 'Return a list OPEN products matching search criteria: state, type and cover',
    })
    @ApiParam({
        name: 'state',
        description: 'State of residence.',
        example: 'NSW',
        required: true,
    })
    @ApiParam({
        name: 'type',
        description: '`Hospital | GeneralHealth | Combined | All` - Policy type',
        example: 'Hospital',
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
        @Param('type') type: string,
        @Param('cover') cover: string,
    ) {
        if (!["Hospital", "GeneralHealth", "Combined"].includes(type)) {
            throw new HttpException(`Invalid cover type - ${type}`, HttpStatus.BAD_REQUEST);
        }
        if (!["1", "2", "0D", "1D", "2D"].includes(cover)) {
            throw new HttpException(`Invalid Cover Code - ${cover}`, HttpStatus.BAD_REQUEST);
        }
        return this.productService.list(
            state,
            type,
            +cover[0] as 0 | 1 | 2,
            cover[1] === 'D',
        );
    }

    /**
     * List all OPEN products table extracting policies for a single fund or brand.  Includes corporate products.
     * The fundOrBrandCode can be a:
     * - a fund: Eg. `ACA`
     * - a brand: Eg. `NIB01`
     * */
    @Get(':fundOrBrand')
    @ApiOperation({
        summary: 'Return a list of all OPEN products for a single fund or brand.',
        description: 'Return a list of all OPEN products for a single fund or brand.  If selecting a fund, all sub-brands are returned.',
    })
    @ApiParam({
        name: 'fundOrBrand',
        description: 'Fund code or brand.',
        example: 'NIB03',
        required: true,
    })
    listForFundOrBrand(
        @Param('fundOrBrand') fundOrBrand: string,
    ) {
        return this.productService.findByFundOrBrand(fundOrBrand);
    }
}
