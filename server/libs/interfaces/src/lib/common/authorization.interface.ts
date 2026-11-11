import type { JwtPayload } from 'jsonwebtoken';
import type { UserProfile } from '../grpc/user-access/v1/user-access';

export class AuthorizedMetadata {
  userId?: string;
  user?: UserProfile;
  permissions?: string[];
  jwt?: JwtPayload;

  constructor(payload?: Partial<AuthorizedMetadata>) {
    Object.assign(this, payload);
  }
}

export class AuthorizeResponse {
  valid = false;
  MetadataKeys = new AuthorizedMetadata();

  constructor(payload?: Partial<AuthorizeResponse>) {
    Object.assign(this, payload);
  }
}
