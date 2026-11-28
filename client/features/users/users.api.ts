import http from "@/lib/http";

import {
  InternalUserSchema,
  InternalUsersSchema,
  UserInvitationResultSchema,
  UserRoleOptionsSchema,
  type InviteUserForm,
  type UserName,
} from "./users.schema";

const usersPath = "/user/internal";

function accountPath(userId: string) {
  return `${usersPath}/${encodeURIComponent(userId)}`;
}

export const usersApiRequest = {
  async list(signal: AbortSignal) {
    const { payload } = await http.getAuthenticated(usersPath, { signal });

    return InternalUsersSchema.parse(payload);
  },

  async detail(userId: string, signal: AbortSignal) {
    const { payload } = await http.getAuthenticated(accountPath(userId), {
      signal,
    });

    return InternalUserSchema.parse(payload);
  },

  async roleOptions(signal: AbortSignal) {
    const { payload } = await http.getAuthenticated("/role", { signal });

    return UserRoleOptionsSchema.parse(payload);
  },

  async invite({ roleId, ...form }: InviteUserForm, locale: string) {
    const { payload } = await http.post(usersPath, {
      ...form,
      locale,
      roles: [roleId],
    });

    return UserInvitationResultSchema.parse(payload);
  },

  async resend(userId: string, locale: string) {
    const { payload } = await http.post(`${accountPath(userId)}/invitation`, {
      locale,
    });

    return UserInvitationResultSchema.parse(payload);
  },

  async updateName(userId: string, data: UserName) {
    const { payload } = await http.patch(accountPath(userId), data);

    return InternalUserSchema.parse(payload);
  },

  async updateRole(userId: string, roleId: string) {
    const { payload } = await http.patch(`${accountPath(userId)}/roles`, {
      roles: [roleId],
    });

    return InternalUserSchema.parse(payload);
  },

  async updateStatus(userId: string, locked: boolean) {
    const { payload } = await http.patch(`${accountPath(userId)}/status`, {
      locked,
    });

    return InternalUserSchema.parse(payload);
  },
};
