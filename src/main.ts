import { AppModule } from './app.module';


async function main() {
    if (process.argv.length < 3) {
        await AppModule.run_app_server();
    } else {
        if (process.argv[2] === "phi-load")
            await AppModule.run_phiload(process.argv[3]);
    }
}


main().then();