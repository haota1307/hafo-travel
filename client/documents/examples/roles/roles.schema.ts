import { z } from "zod";

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  permissions: z.array(z.string()),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const RoleListSchema = z.array(RoleSchema);

export const UpdateRoleBodySchema = z.object({
  name: z
    .string()
    .max(64)
    .regex(/^[a-z][a-z0-9_-]*$/),
  description: z.string().max(500),
  permissions: z
    .array(z.string())
    .refine((permissions) => new Set(permissions).size === permissions.length),
});

export type UpdateRoleBody = z.infer<typeof UpdateRoleBodySchema>;
