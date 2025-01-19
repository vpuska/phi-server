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
        return "Hello from the PHI Demo Server";
    }
}
