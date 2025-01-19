/**
 * app.service.ts
 * @author: V.Puska
 * @Date: 01-Nov-2024
 */

import { Injectable } from '@nestjs/common';
import {DataSource} from "typeorm";
import {InjectDataSource} from "@nestjs/typeorm";

@Injectable()
export class AppService {
    constructor(@InjectDataSource() private datasource: DataSource) {
    }

    root(): string {
        return 'Hello from phi-demo-server!';
    }
}
