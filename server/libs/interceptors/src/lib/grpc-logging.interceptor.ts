import type { Metadata } from '@grpc/grpc-js';
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { catchError, type Observable, tap } from 'rxjs';

import { normalizeError, toGrpcError } from '@common/utils/error.util';
import { PROCESS_ID_METADATA } from '@common/utils/rpc.util';

@Injectable()
export class GrpcLoggingInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    const started = Date.now();
    const metadata = context.switchToRpc().getContext<Metadata>();
    const processId = metadata.get(PROCESS_ID_METADATA)[0] || 'unknown';
    const method = context.getHandler().name;
    Logger.log({ transport: 'gRPC', phase: 'start', processId, method });

    return next.handle().pipe(
      tap(() =>
        Logger.log({
          transport: 'gRPC',
          phase: 'finish',
          processId,
          method,
          durationMs: Date.now() - started,
        }),
      ),
      catchError((error: unknown) => {
        const { statusCode } = normalizeError(error);
        Logger.error({
          transport: 'gRPC',
          processId,
          method,
          statusCode,
          durationMs: Date.now() - started,
        });

        throw new RpcException(toGrpcError(error));
      }),
    );
  }
}
