import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, tap } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { TcpRequest } from '@common/interfaces/tcp/common/request.interface';
import { normalizeError } from '@common/utils/error.util';

@Injectable()
export class TcpLoggingInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    const startTime = Date.now();
    const processId =
      context.switchToRpc().getData<TcpRequest<unknown>>()?.processId ||
      'unknown';
    const method = context.getHandler().name;
    Logger.log({ transport: 'TCP', phase: 'start', processId, method });
    return next.handle().pipe(
      tap(() =>
        Logger.log({
          transport: 'TCP',
          phase: 'finish',
          processId,
          method,
          durationMs: Date.now() - startTime,
        }),
      ),
      catchError((error: unknown) => {
        const { statusCode, message } = normalizeError(error);
        const duration = Date.now() - startTime;
        Logger.error({
          transport: 'TCP',
          processId,
          method,
          statusCode,
          duration,
        });
        throw new RpcException({ code: statusCode, message, duration });
      }),
    );
  }
}
