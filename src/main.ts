/**
 * main.ts
 * @author: V.Puska
 * @Date: 01-Nov-2024
 */
import { AppModule } from './app/app.module';


async function main() {
    if (process.argv.length < 3) {
        await AppModule.run_app_server();
    } else {
        switch (process.argv[2]) {
            case 'phi-load':
                await AppModule.run_phi_data_load();
                break;
            case 'phi-cache':
                await AppModule.run_build_cache();
                break;
            default:
                console.log("Invalid command name");
        }
    }
}


main().then();