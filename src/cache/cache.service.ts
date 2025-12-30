/**
 * cache/cache.service.ts
 * ---
 * @author: V.Puska
 * @Date: 29-Dec-2025
 */
import * as fs from 'node:fs';
import * as zlib from 'node:zlib';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { Injectable } from '@nestjs/common';
import EventEmitter from 'node:events';

export type CacheMode = "compressed" | "uncompressed" | "both" | "none";

const gunzip = promisify(zlib.gunzip)

/**
 * Provides a `read` and `write` cache service.  The cache directory is taken from the environment variable and defaults to `cache`.
 * @example CACHE_DIR=/usr/phealth/cache
 */
@Injectable()
export class CacheService {

    cacheDirectory = process.env.CACHE_DIR || 'cache';

    /**
     * Cache data to a file.  Required directories will be created if they do not exist.
     * @param name Name of the cache file to write.
     * @param cacheMode "compressed" | "uncompressed" | "both" | "none"
     * @param data Text data to cache
     * @example writeCache('products/xml/I2/AZAA1D',"uncompressed",data)
     */
    writeCache(name: string, cacheMode: CacheMode, data: string | NodeJS.ReadableStream) {
        if (cacheMode === 'none')
            return;

        const fileName = `${this.cacheDirectory}/${name}`;
        const dir = path.dirname(fileName);

        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });

        if (data instanceof Object && 'pipe' in data) {

            const stream = data as NodeJS.ReadableStream;

            if (cacheMode === 'uncompressed' || cacheMode === 'both') {
                const writeStream = fs.createWriteStream(fileName);
                stream.pipe(writeStream);
            }

            if (cacheMode === 'compressed' || cacheMode === 'both') {
                const gzipStream = zlib.createGzip();
                const writeStream = fs.createWriteStream(`${fileName}.gz`);
                stream.pipe(gzipStream).pipe(writeStream);
            }

        } else {

            if (cacheMode === 'uncompressed' || cacheMode === 'both')
                fs.writeFileSync(fileName, data as string);

            if (cacheMode === 'compressed' || cacheMode === 'both')
                fs.writeFileSync(`${fileName}.gz`, zlib.gzipSync(data as string));

        }
    }

     /**
     * Read cache file.  Returns the uncompressed version if available, otherwise uncompresses and returns the compressed file.
     * @example readCache('products/xml/I2/AZAA1D')
     */
    async readCache(name: string) : Promise<string> {
        const fileName = `${this.cacheDirectory}/${name}`;

        if (fs.existsSync(fileName))
            return fs.readFileSync(fileName).toString();
        else
            return (await gunzip(fs.readFileSync(`${fileName}.gz`))).toString();
    }

}
