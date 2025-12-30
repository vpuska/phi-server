/**
 * import/import.command.ts
 * ---
 * @Date 25-Dec-2025
 * @Author V.Puska
 */
import { Command, CommandRunner, Option } from 'nest-commander';
import { ImportService } from './import.service';
import { SystemService } from '../system/system.service';
import { Logger } from '@nestjs/common';
import { Not } from 'typeorm';

// Terminal/console color control codes
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
};

/**
 * Command to import PHIO data from data.gov.au.
 * @example npx nest start -- import -f
 */
@Command({
    name: 'import',
    description: 'Import latest dataset of private health insurance data from data.gov.au',
})
export class ImportCommand extends CommandRunner {

    constructor(
        private readonly importService: ImportService,
        private readonly systemService: SystemService,)
    {
        super()
    }

    /**
     * Run the import.
     * @param args This parameter is ignored
     * @param options Command options
     */
    async run(args: any, options : {
        force? : boolean,
        status? : boolean,
        history? : boolean,
        cache? : boolean,
    }): Promise<void> {
        Logger.overrideLogger(["log", "error", "warn"])
        if (options.status || options.history)
            await this.displayStatus(options.status, options.history);
        else if (options.cache)
            await this.importService.cache()
        else
            await this.importService.run(options.force)
    }

    /**
     * Display the current import status or history (`--status` or `--history` options)
     * @param showStatus
     * @param showHistory
     */
    async displayStatus(showStatus: boolean, showHistory: boolean): Promise<void> {
        const lastRun = await this.systemService.get("IMPORT", "LASTRUN", "none");
        if (lastRun === "none") {
            console.log(colors.red, "No import history on file. Missing IMPORT/LASTRUN record", colors.reset)
            return
        }

        const lastFile = await this.systemService.get("IMPORT", lastRun, "none");
        if (lastFile === "none") {
            console.log(colors.red, "No import history found. Missing IMPORT record", colors.reset);
            return;
        }

        if (showStatus) {
            console.log("Database updated at", colors.magenta, lastRun, colors.reset);
            console.log("Current imported dataset:", colors.magenta, lastFile, colors.reset);
        }

        if (showHistory) {
            const importHistory = await this.systemService.findAll({
                key1: "IMPORT",
                key2: Not("LASTRUN")
            })
            console.log("History:")
            importHistory.sort((a,b) => {
                const dataA = new Date(a.key2)
                const dataB = new Date(b.key2)
                return dataA > dataB ? -1 : 1
            }).forEach((item) => {
                console.log(" ", item.key2.split("(")[0], item.data);
            })
        }
    }

    @Option({
        flags: '-f, --force [force]',
        description: 'Force importing latest dataset, even if it has already been imported',
    })
    parseForce(val: string) {
        return JSON.parse(val);
    }

    @Option({
        flags: '-s, --status [status]',
        description: 'Display the import status',
    })
    parseStatus(val: string) {
        return JSON.parse(val);
    }

    @Option({
        flags: '-H, --history [history]',
        description: 'Display the import history',
    })
    parseHistory(val: string) {
        return JSON.parse(val);
    }

    @Option({
        flags: '-c, --cache [cache]',
        description: 'Rebuild the cache files',
    })
    parseCache(val: string) {
        return JSON.parse(val);
    }
}
