/**
 * app.service.ts
 * ---
 * @author: V.Puska
 * @Date: 01-Nov-2024
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

    constructor() {
    }

    root(): string {
        return 'Hello from phi-demo-server!';
    }

}
