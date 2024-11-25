import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FundsModule } from './funds/funds.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [FundsModule,
        TypeOrmModule.forRoot({
            type: 'better-sqlite3',
            database: 'database.sqlite3',
            autoLoadEntities: true,
            synchronize: true,
        })
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
