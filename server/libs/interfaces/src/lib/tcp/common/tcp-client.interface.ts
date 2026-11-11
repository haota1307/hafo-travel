import { Observable } from 'rxjs';

import { TcpRequest } from './request.interface';
import { TcpResponse } from './response.interface';

export interface TcpClient {
  send<TResult = unknown, TInput = unknown>(
    pattern: string,
    data: TcpRequest<TInput>,
  ): Observable<TcpResponse<TResult>>;
  emit<TResult = unknown, TInput = unknown>(
    pattern: string,
    data: TcpRequest<TInput>,
  ): Observable<TcpResponse<TResult>>;
}
