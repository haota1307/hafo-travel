import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { TcpResponse } from '@common/interfaces/tcp/common/response.interface';

/** Register only on the TCP microservice, not HTTP or gRPC. */
@Injectable()
export class TcpResponseInterceptor implements NestInterceptor<
  unknown,
  TcpResponse<unknown>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<TcpResponse<unknown>> {
    return next.handle().pipe(map((data) => TcpResponse.success(data)));
  }
}
