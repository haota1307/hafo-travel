import { z } from "zod";

import http from "@/lib/http";

import { applyPermissionChanges } from "./role-permissions";
import {
  RolePermissionsSchema,
  RoleSchema,
  RolesSchema,
  type RoleForm,
  type RoleUpdate,
} from "./roles.schema";

const rolesPath = "/role";

function rolePath(id: string) {
  return `${rolesPath}/${encodeURIComponent(id)}`;
}

export const rolesApiRequest = {
  async list(signal: AbortSignal) {
    const { payload } = await http.getAuthenticated(rolesPath, { signal });

    return RolesSchema.parse(payload);
  },

  async detail(id: string, signal?: AbortSignal) {
    const { payload } = await http.getAuthenticated(rolePath(id), { signal });

    return RoleSchema.parse(payload);
  },

  async permissions(signal: AbortSignal) {
    const { payload } = await http.getAuthenticated(
      `${rolesPath}/permissions`,
      {
        signal,
      },
    );

    return RolePermissionsSchema.parse(payload);
  },

  async create(form: RoleForm) {
    const { payload } = await http.post(rolesPath, form);

    return RoleSchema.parse(payload);
  },

  async update(id: string, changes: RoleUpdate) {
    const role = await rolesApiRequest.detail(id);
    const { name, description, permissions } = role;
    const updates =
      "permissionChanges" in changes
        ? {
            permissions: applyPermissionChanges(
              permissions,
              changes.permissionChanges,
            ),
          }
        : changes;

    if (
      "permissions" in updates &&
      updates.permissions.length === permissions.length &&
      updates.permissions.every((permission) =>
        permissions.includes(permission),
      )
    ) {
      return role;
    }

    const { payload } = await http.put(rolePath(id), {
      name,
      description,
      permissions,
      ...updates,
    });

    return RoleSchema.parse(payload);
  },

  async delete(id: string) {
    const { payload } = await http.delete(rolePath(id));

    return z.string().parse(payload);
  },
};
