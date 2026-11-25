import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApiRequest } from "./auth.api";

export const authQueryKeys = { session: ["auth", "session"] as const };

export function useGetSession() {
  return useQuery({
    queryKey: authQueryKeys.session,
    queryFn: ({ signal }) => authApiRequest.session(signal),
    staleTime: 0,
  });
}

export function useLogin() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: authApiRequest.login,
    onSuccess: async () => {
      client.removeQueries({
        predicate: (query) => query.queryKey[0] !== "auth",
      });
      await client.invalidateQueries({ queryKey: authQueryKeys.session });
    },
  });
}

export function useLogout() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: authApiRequest.logout,
    onSuccess: async () => {
      await client.cancelQueries();
      client.removeQueries({
        predicate: (query) => query.queryKey[0] !== "auth",
      });
      client.setQueryData(authQueryKeys.session, null);
    },
  });
}
