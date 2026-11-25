import type { UserProfile } from '../grpc/identity/v1/identity';

export class AuthorizedMetadata {
  userId?: string;
  user?: UserProfile;
  permissions?: string[];

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
