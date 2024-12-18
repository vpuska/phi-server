import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ValidationPipe} from "@nestjs/common";
import {PhiLoadService} from "./phi-load/phi-load.service";  // <-- insert statement


async function bootstrap_server() {
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


async function bootstrap_phiload() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const loader = app.get(PhiLoadService);
    await loader.run();
    console.log("--- Complete!");
}

console.log(process.argv);
if (process.argv.length < 3) {
    bootstrap_server();
} else {
    bootstrap_phiload().then(()=>{process.exit(0)});;
}