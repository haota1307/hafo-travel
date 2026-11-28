export const rolesQueryKeys = {
  list: (actorId: string) => ["roles", actorId, "list"] as const,
  details: (actorId: string) => ["roles", actorId, "detail"] as const,
  detail: (actorId: string, id: string) =>
    [...rolesQueryKeys.details(actorId), id] as const,
  permissions: (actorId: string) => ["roles", actorId, "permissions"] as const,
};
