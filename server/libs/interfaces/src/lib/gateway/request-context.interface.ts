import { Request } from 'express';
import { AuthorizeResponse } from '../tcp/authorizer';

export interface RequestContext extends Request {
  processId?: string;
  startTime?: number;
  userData?: AuthorizeResponse;
}
