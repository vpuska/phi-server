import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ValidationPipe} from "@nestjs/common";  // <-- insert statement

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
        origin: true,
        methods: ['GET']
    });
    app.useGlobalPipes(new ValidationPipe({     // <-- insert statement
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true
    }));
    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();