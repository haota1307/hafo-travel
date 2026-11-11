import type { UserProfile } from '@common/interfaces/grpc/user-access/v1/user-access';
import type { UserWithRoles } from '@common/schemas/user.schema';

export function userProfileMapper(user: UserWithRoles): UserProfile {
  return {
    id: user.id,
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    roles: user.roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    })),
  };
}
