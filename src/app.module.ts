import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FundsModule } from './funds/funds.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from "@nestjs/config";

const sqlite3 = {
    type: 'better-sqlite3',
    database: process.env.DATABASE_FILENAME || 'database.sqlite3',
    autoLoadEntities: true,
    synchronize: true,
}

const mariaDb = {
    type: 'mariadb',
    host: '192.168.0.6',
    port: 3307,
    database: 'phidev',
    username: 'root',
    password: 'Ham1sh.cat',
    autoLoadEntities: true,
    synchronize: true,
}

@Module({
    imports: [FundsModule,
        ConfigModule.forRoot(),
        TypeOrmModule.forRoot({
            type: 'mariadb',
            host: 'puskanas.myqnapcloud.com',
            port: 3307,
            database: 'phidev',
            username: 'root',
            password: 'Ham1sh.cat',
            autoLoadEntities: true,
            synchronize: true,
            flags: ['-LONG_PASSWORD']
        }),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
