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

function useSignIn<T>(
  mutationFn: (input: T) => ReturnType<typeof authApiRequest.login>,
) {
  const client = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      client.removeQueries({
        predicate: (query) => query.queryKey[0] !== "auth",
      });
      await client.invalidateQueries({ queryKey: authQueryKeys.session });
    },
  });
}

export function useLogin() {
  return useSignIn(authApiRequest.login);
}

export function useGoogleLogin() {
  return useSignIn(authApiRequest.google);
}

export function useAccountAction() {
  return useMutation({ mutationFn: authApiRequest.accountAction });
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
