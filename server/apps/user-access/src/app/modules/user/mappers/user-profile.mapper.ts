import type { UserProfile } from '@common/interfaces/grpc/user-access/v1/user-access';
import type { UserWithRoles } from '@common/schemas/user.schema';

import { roleProfileMapper } from '../../role/mappers/role-profile.mapper';

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
