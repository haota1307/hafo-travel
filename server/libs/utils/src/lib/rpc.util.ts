import {
  Metadata,
  type CallOptions,
  type ServerUnaryCall,
} from '@grpc/grpc-js';
import { GatewayTimeoutException, HttpException } from '@nestjs/common';
import {
  catchError,
  defer,
  firstValueFrom,
  type Observable,
  throwError,
  timeout,
  TimeoutError,
} from 'rxjs';

import { normalizeError } from './error.util';
import { getProcessId } from './string.util';

export const RPC_TIMEOUT_MS = 10000;
export const PROCESS_ID_METADATA = 'x-process-id';

export type GrpcCallContext = {
  processId?: string;
  deadline?: Date | number;
};

type GrpcUnary<TInput, TResult> = (
  request: TInput,
  metadata?: Metadata,
  options?: CallOptions,
) => Observable<TResult>;

export function grpcCallContext(
  metadata: Metadata,
  call?: Pick<ServerUnaryCall<unknown, unknown>, 'getDeadline'>,
): GrpcCallContext {
  const processId = metadata.get(PROCESS_ID_METADATA)[0];

  return {
    processId:
      typeof processId === 'string' && processId ? processId : getProcessId(),
    deadline: call?.getDeadline(),
  };
}

export function requestGrpc<TInput, TResult>(
  method: GrpcUnary<TInput, TResult>,
  request: TInput,
  context: GrpcCallContext = {},
  timeoutMs = RPC_TIMEOUT_MS,
): Observable<TResult> {
  return defer(() => {
    const incomingDeadline =
      context.deadline instanceof Date
        ? context.deadline.getTime()
        : (context.deadline ?? Infinity);
    const deadline = Math.min(Date.now() + timeoutMs, incomingDeadline);
    const remaining = deadline - Date.now();

    if (remaining <= 0) {
      throw new GatewayTimeoutException('Service request timed out');
    }

    const metadata = new Metadata();
    metadata.set(PROCESS_ID_METADATA, context.processId || getProcessId());

    return method(request, metadata, { deadline }).pipe(
      timeout({ first: remaining }),
    );
  }).pipe(
    catchError((error: unknown) => {
      if (error instanceof TimeoutError) {
        return throwError(
          () => new GatewayTimeoutException('Service request timed out'),
        );
      }
      if (error instanceof HttpException) {
        return throwError(() => error);
      }

      const { statusCode, message } = normalizeError(error);

      return throwError(
        () => new HttpException({ statusCode, message }, statusCode),
      );
    }),
  );
}

export function requestGrpcData<TInput, TResult>(
  method: GrpcUnary<TInput, TResult>,
  request: TInput,
  context: GrpcCallContext = {},
  timeoutMs = RPC_TIMEOUT_MS,
): Promise<TResult> {
  return firstValueFrom(requestGrpc(method, request, context, timeoutMs));
}
