"use client";

import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { HttpError } from "@/lib/http";

import { usersApiRequest } from "./users.api";
import type { InternalUser, InviteUserForm, UserName } from "./users.schema";

const usersQueryKeys = {
  list: (actorId: string) => ["users", actorId, "list"] as const,
  detail: (actorId: string, userId: string | undefined) =>
    ["users", actorId, "detail", userId] as const,
  roleOptions: (actorId: string) => ["users", actorId, "roles"] as const,
};

export function useGetUsers(actorId: string, enabled: boolean) {
  return useQuery({
    queryKey: usersQueryKeys.list(actorId),
    queryFn: enabled ? ({ signal }) => usersApiRequest.list(signal) : skipToken,
    staleTime: 0,
  });
}

export function useGetUser(actorId: string, userId?: string) {
  return useQuery({
    queryKey: usersQueryKeys.detail(actorId, userId),
    queryFn: userId
      ? ({ signal }) => usersApiRequest.detail(userId, signal)
      : skipToken,
    staleTime: 0,
  });
}

export function useGetUserRoleOptions(actorId: string, enabled: boolean) {
  return useQuery({
    queryKey: usersQueryKeys.roleOptions(actorId),
    queryFn: enabled
      ? ({ signal }) => usersApiRequest.roleOptions(signal)
      : skipToken,
  });
}

function useRefreshUsers(actorId: string) {
  const client = useQueryClient();

  return async (users: InternalUser[]) => {
    for (const user of users) {
      client.setQueryData(usersQueryKeys.detail(actorId, user.userId), user);
    }

    await Promise.all([
      client.invalidateQueries({ queryKey: usersQueryKeys.list(actorId) }),
      ...users.map((user) =>
        client.invalidateQueries({
          queryKey: usersQueryKeys.detail(actorId, user.userId),
        }),
      ),
    ]);
  };
}

export function useInviteUser(actorId: string) {
  const refresh = useRefreshUsers(actorId);

  return useMutation({
    mutationFn: ({ form, locale }: { form: InviteUserForm; locale: string }) =>
      usersApiRequest.invite(form, locale),
    onSuccess: ({ user }) => refresh([user]),
  });
}

export function useResendUserInvitation(actorId: string) {
  const refresh = useRefreshUsers(actorId);

  return useMutation({
    mutationFn: ({ userId, locale }: { userId: string; locale: string }) =>
      usersApiRequest.resend(userId, locale),
    onSuccess: ({ user }) => refresh([user]),
  });
}

export function useUpdateUserName(actorId: string, userId: string) {
  const refresh = useRefreshUsers(actorId);

  return useMutation({
    mutationFn: (data: UserName) => usersApiRequest.updateName(userId, data),
    onSuccess: (user) => refresh([user]),
  });
}

export function useUpdateUserStatus(actorId: string, userId: string) {
  const refresh = useRefreshUsers(actorId);

  return useMutation({
    mutationFn: (locked: boolean) =>
      usersApiRequest.updateStatus(userId, locked),
    onSuccess: (user) => refresh([user]),
  });
}

export function useUpdateUsersRole(actorId: string) {
  const refresh = useRefreshUsers(actorId);

  return useMutation({
    mutationFn: async ({
      userIds,
      roleId,
    }: {
      userIds: string[];
      roleId: string;
    }) => {
      const updated: InternalUser[] = [];
      const failures = new Map<string, unknown>();
      let stopped: HttpError | undefined;

      for (const userId of userIds) {
        if (stopped) {
          failures.set(userId, stopped);
          continue;
        }

        try {
          updated.push(await usersApiRequest.updateRole(userId, roleId));
        } catch (error) {
          failures.set(userId, error);

          if (error instanceof HttpError && [401, 429].includes(error.status)) {
            stopped = error;
          }
        }
      }

      return { updated, failures };
    },
    onSuccess: ({ updated }) => refresh(updated),
  });
}
