import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import * as zlib from 'node:zlib';
import * as path from 'node:path';
import { promisify } from 'node:util';

export type CacheMode = "compressed" | "uncompressed" | "both" | "none";

const gunzip = promisify(zlib.gunzip)

@Injectable()
export class CacheService {

    cacheDirectory = process.env.CACHE_DIR || 'cache';

    /**
     * Cache data to a file.  Required directories will be created if they do not exist.
     * @param name Name of the cache file to write.
     * @param cacheMode
     * @param data
     * @example writeCache('products/xml/I2/AZAA1D', data)
     */
    writeCache(name: string, cacheMode: CacheMode, data: string) {
        if (cacheMode === 'none')
            return;

        const fileName = `${this.cacheDirectory}/${name}`;
        const dir = path.dirname(fileName);

        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });

        if (cacheMode === 'uncompressed' || cacheMode === 'both')
            fs.writeFileSync(fileName, data);

        if (cacheMode === 'compressed' || cacheMode === 'both') {
            fs.writeFileSync(`${fileName}.gz`, zlib.gzipSync(data));
        }
    }

     /**
     * Read cache file.  Returns the uncompressed version if available, otherwise uncompresses and returns the compressed file.
     */
    async readCache(name: string) : Promise<string> {
        const fileName = `${this.cacheDirectory}/${name}`;

        if (fs.existsSync(fileName))
            return fs.readFileSync(fileName).toString();
        else
            return (await gunzip(fs.readFileSync(`${fileName}.gz`))).toString();
    }

}
