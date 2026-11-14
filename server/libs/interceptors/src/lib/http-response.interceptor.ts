import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';

import { MetadataKeys } from '@common/constants/common.constants';
import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';
import type { RequestContext } from '@common/interfaces/gateway/request-context.interface';
import { ResponseDto } from '@common/interfaces/gateway/response.interface';

@Injectable()
export class HttpResponseInterceptor implements NestInterceptor<
  unknown,
  ResponseDto<unknown>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<ResponseDto<unknown>> {
    const request = context.switchToHttp().getRequest<RequestContext>();
    const startTime = request[MetadataKeys.START_TIME] ?? Date.now();

    return next.handle().pipe(
      map(
        (data) =>
          new ResponseDto({
            data,
            code: HTTP_MESSAGE.SUCCESS,
            processId: request[MetadataKeys.PROCESS_ID],
            duration: `${Date.now() - startTime} ms`,
          }),
      ),
    );
  }
}
