import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FundsModule } from './funds/funds.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from "@nestjs/config";
import * as process from "node:process";


function typeOrmSettings() {
    const type: string = process.env.DATABASE || "SQLITE";

    if (type==='MARIADB') {
        console.log('Using MARIADB');
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
        console.log('Using SQLITE');
        return TypeOrmModule.forRoot({
            type: 'better-sqlite3',
            database: process.env.SQLITE_DATABASE || 'database.sqlite3',
            autoLoadEntities: true,
            synchronize: true,
        })
    }

    throw `Invalid database type: ${type}`;
}


@Module({
    imports: [FundsModule,
        ConfigModule.forRoot(),
        typeOrmSettings(),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
