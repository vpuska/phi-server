/**
 * system/system.service.ts
 * ---
 * @Author V.Puska
 * @Date 30-Dec-2025
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import {System} from './entities/system.entity';

/**
 * Service to manage the {@Link System} control records.
 */
@Injectable()
export class SystemService {

    constructor(
        @InjectRepository(System)
        private readonly systemRepository: Repository<System>,
    ) {}

    /**
     * Create or update a {@Link System} record.
     * @param key1
     * @param key2
     * @param data
     */
    async save(key1: string, key2: string, data: string) {
        return await this.systemRepository.save({
            key1: key1,
            key2: key2,
            data: data
        });
    }

    /**
     * Find a single {@Link System} record.
     * @param key1
     * @param key2
     */
    async findOne(key1: string, key2: string) {
        return await this.systemRepository.findOne({
            where: {
                key1: key1,
                key2: key2,
            }
        })
    }

    /**
     * Find {@Link System} records matching search options.
     * @param where
     */
    async findAll(where:  FindOptionsWhere<System> | FindOptionsWhere<System>[]) {
        return await this.systemRepository.find({where})
    }

    /**
     * Get the data value for a particular {@Link System} record.
     * @param key1
     * @param key2
     * @param defaultValue
     */
    async get(key1: string, key2: string, defaultValue: string) : Promise<string> {
        const record = await this.findOne(key1, key2);
        return record ? record.data : defaultValue;
    }

}

