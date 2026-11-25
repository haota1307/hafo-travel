import { withSessionLock } from "@/lib/browser-session";
import http, { HttpError } from "@/lib/http";
import {
  accountActionSchemas,
  GoogleLoginSchema,
  type GoogleLoginInput,
  type AccountCommand,
  LoginSchema,
  SessionSchema,
  type LoginInput,
} from "./auth.schema";

const internal = { baseUrl: "" };

export const authApiRequest = {
  login(body: LoginInput) {
    return withSessionLock(() =>
      http.post("/api/auth/login", LoginSchema.parse(body), internal),
    );
  },

  google(body: GoogleLoginInput) {
    return withSessionLock(() =>
      http.post("/api/auth/google", GoogleLoginSchema.parse(body), internal),
    );
  },

  accountAction({ action, body }: AccountCommand) {
    return http.post(
      `/api/auth/${action}`,
      accountActionSchemas[action].parse(body),
      internal,
    );
  },

  logout() {
    return withSessionLock(() => http.post("/api/auth/logout", null, internal));
  },

  async session(signal?: AbortSignal) {
    try {
      const { payload } = await http.getAuthenticated("/user/me", { signal });

      return SessionSchema.parse(payload);
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        return null;
      }

      throw error;
    }
  },
};
