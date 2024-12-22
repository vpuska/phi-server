import { AppModule } from './app.module';


async function main() {
    if (process.argv.length < 3) {
        await AppModule.run_app_server();
    } else {
        await AppModule.run_phiload();
    }
}


main().then();