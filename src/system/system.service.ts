import { Injectable } from '@nestjs/common';

import {System} from './entities/system.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export type Key1Type = "TIMESTAMP" | "DATASET";

@Injectable()
export class SystemService {

    constructor(
        @InjectRepository(System)
        private readonly systemRepository: Repository<System>,
    ) {}

    async save(key1: Key1Type, key2: string, data: string) {
        await this.systemRepository.save({
            key1: key1,
            key2: key2,
            data: data
        });
    }

    async findOne(key1: Key1Type, key2: string) {
        return await this.systemRepository.findOne({
            where: {
                key1: key1,
                key2: key2,
            }
        })
    }

    async findAll(where: Partial<System>) {
        return await this.systemRepository.find({where})
    }
}

