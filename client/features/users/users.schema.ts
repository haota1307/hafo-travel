import { z } from "zod";

const NameSchema = z.string().trim().min(1).max(100);

export const UserIdSchema = z.string().regex(/^[a-z\d_-]{1,128}$/i);

export const UserRoleIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

export const UserStatusSchema = z.enum(["pending", "active", "locked"]);

const UserRoleSchema = z.object({
  id: UserRoleIdSchema,
  name: z.string().min(1),
});

export const UserRoleOptionsSchema = z.array(
  UserRoleSchema.extend({ permissions: z.array(z.string()) }),
);

export const InternalUserSchema = z.object({
  userId: UserIdSchema,
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  accessProtected: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const InternalUsersSchema = z.array(InternalUserSchema);

export const UserInvitationResultSchema = z.object({
  user: InternalUserSchema,
  invitationDelivery: z.enum(["sent", "unconfirmed"]),
});

export const UserNameSchema = z.object({
  firstName: NameSchema,
  lastName: NameSchema,
});

export const UserRoleFormSchema = z.object({ roleId: UserRoleIdSchema });

export const InviteUserFormSchema = UserNameSchema.extend({
  email: z.string().trim().pipe(z.email().max(254)),
  ...UserRoleFormSchema.shape,
});

export type InternalUser = z.infer<typeof InternalUserSchema>;

export type UserName = z.infer<typeof UserNameSchema>;

export type InviteUserForm = z.infer<typeof InviteUserFormSchema>;

export type UserInvitationResult = z.infer<typeof UserInvitationResultSchema>;
