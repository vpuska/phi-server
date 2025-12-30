import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AppLoggingInterceptor implements NestInterceptor {

    private readonly debug = process.env.DEBUG || "off";
    private readonly logger = new Logger("Debug");

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        if (this.debug === "on") {
            const className = context.getClass().name;
            const funcName = context.getHandler().name;
            const request = context.switchToHttp().getRequest();
            const method = request.method;
            const url = request.url;
            this.logger.log(`[${method}] ${url} => ${className}.${funcName}`);
        }
        return next.handle();
    }
}