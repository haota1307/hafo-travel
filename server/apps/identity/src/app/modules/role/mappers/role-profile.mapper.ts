import type { RoleProfile } from '@common/interfaces/grpc/identity/v1/identity';
import type { Role } from '@common/schemas/role.schema';

export function roleProfileMapper(role: Role): RoleProfile {
  return {
    id: role.id,
    name: role.name,
    description: role.description ?? '',
    permissions: role.permissions,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}
