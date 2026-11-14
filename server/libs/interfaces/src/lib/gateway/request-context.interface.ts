import { Request } from 'express';

import { AuthorizeResponse } from '../common/authorization.interface';

export interface RequestContext extends Request {
  processId?: string;
  startTime?: number;
  userData?: AuthorizeResponse;
}
