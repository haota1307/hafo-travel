import { GatewayTimeoutException, HttpException } from '@nestjs/common';
import { normalizeError } from './error.util';
import {
  catchError,
  firstValueFrom,
  map,
  Observable,
  throwError,
  timeout,
  TimeoutError,
} from 'rxjs';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { TcpRequest } from '@common/interfaces/tcp/common/request.interface';
import { TcpResponse } from '@common/interfaces/tcp/common/response.interface';

export const RPC_TIMEOUT_MS = 10000;

/** Keep the envelope for BFF callers; internal callers can use requestTcpData. */
export function requestTcp<TResult, TInput>(
  client: TcpClient,
  pattern: string,
  request: TcpRequest<TInput>,
  timeoutMs = RPC_TIMEOUT_MS,
): Observable<TcpResponse<TResult>> {
  return client.send<TResult, TInput>(pattern, request).pipe(
    timeout({ first: timeoutMs }),
    catchError((error: unknown) =>
      throwError(() => {
        if (error instanceof TimeoutError)
          return new GatewayTimeoutException('Service request timed out');
        if (error instanceof HttpException) return error;
        const { statusCode, message } = normalizeError(error);
        return new HttpException({ statusCode, message }, statusCode);
      }),
    ),
  );
}

export function requestTcpData<TResult, TInput>(
  client: TcpClient,
  pattern: string,
  request: TcpRequest<TInput>,
  timeoutMs = RPC_TIMEOUT_MS,
): Promise<TResult | undefined> {
  return firstValueFrom(
    requestTcp<TResult, TInput>(client, pattern, request, timeoutMs).pipe(
      map((response) => response.data),
    ),
  );
}
