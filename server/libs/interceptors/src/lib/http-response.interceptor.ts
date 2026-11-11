import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { MetadataKeys } from '@common/constants/common.constants';
import { ResponseDto } from '@common/interfaces/gateway/response.interface';
import { TcpResponse } from '@common/interfaces/tcp/common/response.interface';
import { RequestContext } from '@common/interfaces/gateway/request-context.interface';

/** BFF handlers return the TCP envelope; preserve its fields without nesting it. */
@Injectable()
export class HttpResponseInterceptor implements NestInterceptor<
  TcpResponse<unknown>,
  ResponseDto<unknown>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<TcpResponse<unknown>>,
  ): Observable<ResponseDto<unknown>> {
    const request = context.switchToHttp().getRequest<RequestContext>();
    const startTime = request[MetadataKeys.START_TIME] ?? Date.now();

    return next.handle().pipe(
      map((data) => {
        const response = new ResponseDto(data);
        response.processId = request[MetadataKeys.PROCESS_ID];
        response.duration = `${Date.now() - startTime} ms`;
        return response;
      }),
    );
  }
}
