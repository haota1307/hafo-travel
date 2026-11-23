"use client";

import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { rolesApiRequest } from "./roles.api";
import type { UpdateRoleBody } from "./roles.schema";

export const rolesQueryKeys = {
  list: ["roles", "list"] as const,
  detail: (id?: string) => ["roles", "detail", id] as const,
};

export function useGetRoles(enabled: boolean) {
  return useQuery({
    queryKey: rolesQueryKeys.list,
    queryFn: async ({ signal }) => (await rolesApiRequest.list(signal)).payload,
    enabled,
  });
}

export function useGetRole(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: rolesQueryKeys.detail(id),
    queryFn: id
      ? async ({ signal }) => (await rolesApiRequest.detail(id, signal)).payload
      : skipToken,
    enabled,
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: UpdateRoleBody }) =>
      (await rolesApiRequest.update(id, body)).payload,
    onSuccess: async (_, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: rolesQueryKeys.list }),
        queryClient.invalidateQueries({ queryKey: rolesQueryKeys.detail(id) }),
      ]);
    },
  });
}
