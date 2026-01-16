import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AppLoggingInterceptor implements NestInterceptor {

    private readonly logger = new Logger(this.constructor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const className = context.getClass().name;
        const funcName = context.getHandler().name;
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        const url = request.url;
        this.logger.debug(`[${method}] ${url} => ${className}.${funcName}`);
        return next.handle();
    }
}