import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { RequestContext } from '@common/interfaces/gateway/request-context.interface';
import { getProcessId } from '@common/utils/string.util';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: RequestContext, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const processId = getProcessId();
    req.processId = processId;
    req.startTime = startTime;
    // Log metadata only: bodies, query strings and credentials are excluded.
    const path = req.originalUrl.split('?')[0];
    Logger.log({
      transport: 'HTTP',
      phase: 'start',
      processId,
      method: req.method,
      path,
    });
    res.once('finish', () => {
      Logger.log({
        transport: 'HTTP',
        phase: 'finish',
        processId,
        method: req.method,
        path,
        statusCode: res.statusCode,
        durationMs: Date.now() - startTime,
      });
    });
    next();
  }
}
