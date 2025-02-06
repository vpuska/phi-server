/**
 * products/products.controller.ts
 * ---
 * @author: V.Puska
 * @date: 12-Dec-2024
 */
import { Body, Controller, Get, HttpException, HttpStatus, HttpCode, NotFoundException, Param, Post } from "@nestjs/common";
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductSearchDto } from './dto/product-search.dto';

/**
 * **ProductController** provides access to product queries and actions.
 */
@Controller('products')
export class ProductsController {
    static DEPENDANT_TYPES = ['child', 'student', 'youngAdult', 'disability'];

    constructor(private readonly productService: ProductsService) {}

    /**
     * Find a single product using the product code.  Code is split into 2 fields because the
     * product code includes a `/` character.  Eg `I119/WNDI2D`
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

    @Post('search')
    @HttpCode(200)
    @ApiOperation({
        summary: 'Return a list products matching search criteria',
        description:
            'Filters products matching the search criteria.<br>' +
            '- State you live in<br>' +
            '- Product type required (Hospital/General Medical or both)<br>' +
            '- Minimum hospital tier<br>' +
            '- Dependant filters<br><br>' +
            'See the `ProductSearchDto` schema for further details.<br><br>' +
            'Note: The result sets can be large and affect browser performance.  Set `disabilityCover = true` to ' +
            'return a small result set.',
    })
    search(@Body() filter: ProductSearchDto) {
        const dependantFilter = {};
        // Only condition specified dependant filters
        for (const dependant of ProductsController.DEPENDANT_TYPES) {
            const property = `${dependant}Cover`;
            if (filter.hasOwnProperty(property))
                dependantFilter[property] = filter[property];
        }
        // If no filters specified for dependants, then set all to false.
        if (Object.keys(dependantFilter).length === 0) {
            for (const dependant of ProductsController.DEPENDANT_TYPES) {
                const property = `${dependant}Cover`;
                dependantFilter[property] = false;
            }
        }

        return this.productService.search(
            filter.hospitalCover,
            filter.generalCover,
            filter.hospitalTier ? filter.hospitalTier : 'None',
            filter.state === 'ACT' ? 'NSW' : filter.state,
            filter.numberOfAdults,
            dependantFilter,
        );
    }
    /**
     * Return a list of matching products.
     * @param state State
     * @param type `Hospital | GeneralHealth | Combined`
     * @param cover `1 | 2 | 0D | 1D | 2D` - code representing number of adults and if dependants included
     */
    @Get(':state/:type/:cover')
    @ApiOperation({
        summary: 'Return a list products matching search criteria',
        description: 'Return a list of hospital and general medical services.',
    })
    @ApiParam({
        name: 'state',
        description: 'State of residence.',
        example: 'NSW',
        required: true,
    })
    @ApiParam({
        name: 'type',
        description: '`Hospital | GeneralHealth | Combined` - Policy type',
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
}
