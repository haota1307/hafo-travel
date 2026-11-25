import type { Request } from 'express';

import type { AuthenticatedActor } from '../common/authorization.interface';

export interface RequestContext extends Request {
  processId?: string;
  startTime?: number;
  userData?: AuthenticatedActor;
}
