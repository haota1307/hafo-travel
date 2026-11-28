import { z } from "zod";

import { withSystemDashboardPermissions } from "@/features/dashboard/sections";

const DisplayNameSchema = z.string().trim().min(1).max(100);

export const RoleIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

export const RoleSummarySchema = z.object({
  id: RoleIdSchema,
  name: z.string().min(1),
  displayName: z.string().optional(),
  displayNameVi: z.string().optional(),
  displayNameEn: z.string().optional(),
});

export const RoleSchema = RoleSummarySchema.extend({
  description: z.string(),
  permissions: z.array(z.string()),
  memberCount: z.int().nonnegative().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).transform((role) => ({
  ...role,
  permissions: withSystemDashboardPermissions(role.name, role.permissions),
}));

export const RolesSchema = z.array(RoleSchema);

export const RolePermissionsSchema = z.array(z.string());

export const RoleInfoFormSchema = z.object({
  displayNameVi: DisplayNameSchema,
  displayNameEn: DisplayNameSchema,
  name: z.string().regex(/^[a-z][a-z0-9_-]{0,63}$/),
  description: z.string().max(500),
});

export const RoleFormSchema = RoleInfoFormSchema.extend({
  permissions: RolePermissionsSchema.refine(
    (permissions) => new Set(permissions).size === permissions.length,
  ),
});

export type RoleSummary = z.infer<typeof RoleSummarySchema>;

export type Role = z.infer<typeof RoleSchema>;

export type RoleForm = z.infer<typeof RoleFormSchema>;

export type RoleInfoFormValues = z.infer<typeof RoleInfoFormSchema>;

export type RolePermissionChanges = ReadonlyMap<string, boolean>;

export type RoleUpdate =
  RoleInfoFormValues | { permissionChanges: RolePermissionChanges };
