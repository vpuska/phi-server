import { Injectable } from '@nestjs/common';

import {System} from './entities/system.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';


@Injectable()
export class SystemService {

    constructor(
        @InjectRepository(System)
        private readonly systemRepository: Repository<System>,
    ) {}

    async save(key1: string, key2: string, data: string) {
        await this.systemRepository.save({
            key1: key1,
            key2: key2,
            data: data
        });
    }

    async findOne(key1: string, key2: string) {
        return await this.systemRepository.findOne({
            where: {
                key1: key1,
                key2: key2,
            }
        })
    }

    async findAll(where:  FindOptionsWhere<System> | FindOptionsWhere<System>[]) {
        return await this.systemRepository.find({where})
    }

    async get(key1: string, key2: string, defaultValue: string) : Promise<string> {
        const record = await this.findOne(key1, key2);
        return record ? record.data : defaultValue;
    }

}

