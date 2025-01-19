/**
 * app.controller.ts
 * ---
 * @Author V.Puska
 * @Date: 01-Nov-2024
 */
import { Controller, Get, Redirect } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiExcludeController } from '@nestjs/swagger';


@ApiExcludeController()
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    @Redirect("/swagger")
    root(): string {
        // not used!!
        return this.appService.root();
    }
}
