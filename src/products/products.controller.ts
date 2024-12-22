import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
    constructor(private readonly productService: ProductsService) {}

    @Get('singleparent/:state')
    singleparent(@Param('state') state: string) {
        return this.productService.search(state, 1, true);
    }

    @Get('family/:state')
    family(@Param('state') state: string) {
        return this.productService.search(state, 2, true);
    }

    @Get('single/:state')
    single(@Param('state') state: string) {
        return this.productService.search(state, 1, false);
    }

    @Get('couple/:state')
    couple(@Param('state') state: string) {
        return this.productService.search(state, 2, false);
    }
}
