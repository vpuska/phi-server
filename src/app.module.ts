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
        app.enableCors({
            origin: true,
            methods: ['GET']
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
     * @param mode omit, blank or "force"  If "force", the phi-load process will update
     * product records even though the input XML is unchanged.  Useful where update logic has been
     * changed.
     */
    static async run_phiload(mode = "") {
        const app = await NestFactory.createApplicationContext(AppModule);
        const loader = app.get(PhiLoadService);
        await loader.run(mode);
        process.exit(0);
    }

}
