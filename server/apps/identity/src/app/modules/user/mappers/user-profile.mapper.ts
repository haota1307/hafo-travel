import type {
  InternalUser,
  UserProfile,
} from '@common/interfaces/grpc/identity/v1/identity';
import type { UserWithRoles } from '@common/schemas/user.schema';

import { roleProfileMapper } from '@identity/role/mappers/role-profile.mapper';
import type { InternalUserRecord } from '@identity/user/repositories/internal-user.repository';

export function userProfileMapper(user: UserWithRoles): UserProfile {
  return {
    id: user.id,
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    roles: user.roles.map(roleProfileMapper),
  };
}

export function internalUserProfileMapper(
  user: InternalUserRecord,
  actorUserId: string,
): InternalUser {
  return {
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: { id: user.role._id.toHexString(), name: user.role.name },
    status: user.status,
    accessProtected: user.userId === actorUserId || user.initialAdministrator,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
