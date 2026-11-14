import { MetadataKeys } from '@common/constants/common.constants';
import { AuthorizeResponse } from '@common/interfaces/common/authorization.interface';
import { RequestContext } from '@common/interfaces/gateway/request-context.interface';

import { parseToken } from './string.util';

export function getAccessToken(
  request: RequestContext,
  keepBearer = false,
): string {
  const token = request.headers.authorization || '';

  return keepBearer ? token : parseToken(token);
}

export function setUserData(
  request: RequestContext,
  userData?: AuthorizeResponse,
): void {
  request[MetadataKeys.USER_DATA] = userData;
}
