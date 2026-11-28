import type { RoleProfile } from '@common/interfaces/grpc/identity/v1/identity';
import type { Role, RoleDisplayNames } from '@common/schemas/role.schema';

export function roleDisplayNamesMapper(role: RoleDisplayNames) {
  return {
    displayName: role.displayName ?? role.displayNameVi ?? role.displayNameEn,
    displayNameVi: role.displayNameVi,
    displayNameEn: role.displayNameEn,
  };
}

export function roleProfileMapper(
  role: Role,
  memberCount?: number,
): RoleProfile {
  return {
    id: role.id,
    name: role.name,
    ...roleDisplayNamesMapper(role),
    description: role.description ?? '',
    permissions: role.permissions,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
    memberCount,
  };
}
