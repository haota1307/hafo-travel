"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { usersQueryKeys } from "@/features/users/users.queries";

import { rolesApiRequest } from "./roles.api";
import { rolesQueryKeys } from "./roles-query-keys";
import type {
  Role,
  RoleInfoFormValues,
  RolePermissionChanges,
} from "./roles.schema";

async function invalidateUpdatedRole(
  client: QueryClient,
  actorId: string,
  id: string,
) {
  await Promise.all([
    client.invalidateQueries({ queryKey: rolesQueryKeys.list(actorId) }),
    client.invalidateQueries({ queryKey: rolesQueryKeys.detail(actorId, id) }),
    client.invalidateQueries({ queryKey: usersQueryKeys.list(actorId) }),
    client.invalidateQueries({ queryKey: usersQueryKeys.details(actorId) }),
  ]);
}

export function useGetRoles(actorId: string) {
  return useQuery({
    queryKey: rolesQueryKeys.list(actorId),
    queryFn: ({ signal }) => rolesApiRequest.list(signal),
    staleTime: 0,
  });
}

export function useGetRole(actorId: string, id: string) {
  return useQuery({
    queryKey: rolesQueryKeys.detail(actorId, id),
    queryFn: ({ signal }) => rolesApiRequest.detail(id, signal),
    staleTime: 0,
  });
}

export function useGetRolePermissions(actorId: string) {
  return useQuery({
    queryKey: rolesQueryKeys.permissions(actorId),
    queryFn: ({ signal }) => rolesApiRequest.permissions(signal),
  });
}

export function useCreateRole(actorId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: rolesApiRequest.create,
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: rolesQueryKeys.list(actorId),
      }),
  });
}

export function useUpdateRole(actorId: string, id: string) {
  const client = useQueryClient();

  return useMutation({
    scope: { id: `role:${id}` },
    mutationFn: (changes: RoleInfoFormValues) =>
      rolesApiRequest.update(id, changes),
    onSuccess: () => invalidateUpdatedRole(client, actorId, id),
  });
}

export function useUpdateRolePermissions(actorId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      permissions,
    }: {
      id: string;
      permissions: RolePermissionChanges;
    }) => rolesApiRequest.update(id, { permissionChanges: permissions }),
    onSuccess: (role) => {
      client.setQueryData<Role[]>(rolesQueryKeys.list(actorId), (roles) =>
        roles?.map((current) =>
          current.id === role.id ? { ...current, ...role } : current,
        ),
      );
    },
    onSettled: (_role, _error, { id }) =>
      invalidateUpdatedRole(client, actorId, id),
  });
}

export function useDeleteRole(actorId: string, id: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => rolesApiRequest.delete(id),
    onSuccess: async () => {
      client.removeQueries({ queryKey: rolesQueryKeys.detail(actorId, id) });
      await client.invalidateQueries({
        queryKey: rolesQueryKeys.list(actorId),
      });
    },
  });
}
