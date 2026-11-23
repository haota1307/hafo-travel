import http from "@/lib/http";

import {
  RoleListSchema,
  RoleSchema,
  type UpdateRoleBody,
} from "./roles.schema";

const rolePath = "/role";

export const rolesApiRequest = {
  async list(signal?: AbortSignal) {
    const response = await http.get<unknown>(rolePath, { signal });

    return { ...response, payload: RoleListSchema.parse(response.payload) };
  },

  async detail(id: string, signal?: AbortSignal) {
    const response = await http.get<unknown>(
      `${rolePath}/${encodeURIComponent(id)}`,
      { signal },
    );

    return { ...response, payload: RoleSchema.parse(response.payload) };
  },

  async update(id: string, body: UpdateRoleBody) {
    const response = await http.put<unknown>(
      `${rolePath}/${encodeURIComponent(id)}`,
      body,
    );

    return { ...response, payload: RoleSchema.parse(response.payload) };
  },
};
