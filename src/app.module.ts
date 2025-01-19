/**
 * app.module.ts
 * ------------
 * The main module file for the ```nest.js``` application.
 * @author V.Puska
 * @date 01-Nov-24
 *
 */
import { DynamicModule, Logger, Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FundsModule } from './funds/funds.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from "@nestjs/config";
import { ProductsModule } from './products/products.module';
import { PhiLoadModule } from './phi-load/phi-load.module';
import * as process from "node:process";
import { NestFactory } from '@nestjs/core';
import { PhiLoadService } from './phi-load/phi-load.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';


const logger = new Logger('AppModule');

/**
 * Factory function to create the ```TypeOrmModule``` for the application.  Used by {@Link AppModule}.
 */
function typeOrmSettings(): DynamicModule {

    const type: string = process.env.DATABASE || "SQLITE";

    if (type==='MARIADB') {
        logger.log('Using MARIADB');
        return TypeOrmModule.forRoot({
            type: 'mariadb',
            host: process.env["MARIADB_HOST"] || 'localhost',
            port: parseInt(process.env["MARIADB_PORT"]) || 3307,
            database: process.env["MARIADB_DATABASE"],
            username: process.env["MARIADB_USERNAME"],
            password: process.env["MARIADB_PASSWORD"],
            autoLoadEntities: true,
            synchronize: true,
        })
    }

    if (type==='SQLITE') {
        logger.log('Using SQLITE');
        return TypeOrmModule.forRoot({
            type: 'better-sqlite3',
            database: process.env.SQLITE_DATABASE || 'database.sqlite3',
            autoLoadEntities: true,
            synchronize: true,
        })
    }

    throw `Invalid database type: ${type}`;
}
/**
 * Main application module.
 */
@Module({
    imports: [
        ConfigModule.forRoot(),
        typeOrmSettings(),
        FundsModule,
        ProductsModule,
        PhiLoadModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
    /**
     * Run the main web service.
     */
    static async run_app_server() {
        const app = await NestFactory.create(AppModule);

        const config = new DocumentBuilder()
            .setTitle('Private Health Insurance (PHI) Product Search API')
            .setDescription(
                "This is a demonstration/sample API server built with <a target='_blank' href='https://nestjs.com/'>NestJS</a>.<br><br>" +
                "The API serves information about **Australian private health insurance** funds and products. <em>Its only purpose is " +
                "as a platform to provide a non-trivial dataset for personal research, investigation and " +
                "education into web application development technologies</em>.<br><br>" +
                "To allow for easier comparison of health insurance products, all Australian health insurers " +
                "are required by law to create a Private Health Information Statement for each of their products. " +
                "These statements are collated by the **Australian Private Health Insurance Ombudsman** (PHIO) and published on  " +
                "<a target='_blank' href='https://data.gov.au/dataset/ds-dga-8ab10b1f-6eac-423c-abc5-bbffc31b216c/details?q=PHIO'>data.gov.au</a>. " +
                "Further information about PHIO can be found at " +
                "<a href='https://www.privatehealth.gov.au/'>https://www.privatehealth.gov.au/</a><br><br>" +
                "This site and application has no connection to the Australian Private Health Insurance Ombudsman, and is purely a personal, " +
                "non-commercial, non-official project.  Data provided by this API is not to be relied upon for any comparison of, or research into, " +
                "private health insurance products.  Please use <a href='https://www.privatehealth.gov.au/'>https://www.privatehealth.gov.au/</a> " +
                "or one of the commercial product comparison services."
            )
            .setVersion('1.0')
            .build();
        const documentFactory = () => SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('swagger', app, documentFactory);

        app.enableCors({
            origin: true,
            methods: ['GET', 'POST']
        });
        app.useGlobalPipes(new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true
        }));
        await app.listen(process.env.PORT ?? 3000);
    }
    /**
     * Run the phi-load command.
     */
    static async run_phiload() {
        const app = await NestFactory.createApplicationContext(AppModule);
        const loader = app.get(PhiLoadService);
        await loader.run();
        process.exit(0);
    }

}
