import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable } from 'rxjs';
import { RequestContext } from '@common/interfaces/gateway/request-context.interface';
import { ResponseDto } from '@common/interfaces/gateway/response.interface';
import { normalizeError } from '@common/utils/error.util';

export class ExceptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ExceptionInterceptor.name);
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestContext>();
    const startTime = request.startTime ?? Date.now();
    return next.handle().pipe(
      catchError((error: unknown) => {
        const { statusCode, message } = normalizeError(error);
        this.logger.error({ processId: request.processId, statusCode });
        throw new HttpException(
          new ResponseDto({
            data: null,
            message,
            statusCode,
            duration: `${Date.now() - startTime} ms`,
            processId: request.processId,
          }),
          statusCode,
        );
      }),
    );
  }
}
