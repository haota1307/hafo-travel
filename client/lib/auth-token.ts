export const ACCESS_TOKEN_KEY = "tcapp_access_token";
export const REFRESH_TOKEN_KEY = "tcapp_refresh_token";

export type AccessTokenPayload = {
  userId: string;
  roleCode: string;
  roleName: string | null;
  sessionId: string;
  mustChangePassword: boolean;
  jti: string;
  exp: number;
  iat: number;
};

export type RefreshTokenPayload = {
  userId: string;
  roleCode: string;
  sessionId: string;
  jti: string;
  exp: number;
  iat: number;
};

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  return atob(padded);
}

export function decodeJwtPayload<TPayload>(token: string): TPayload | null {
  try {
    const [, payload] = token.split(".");

    if (!payload) return null;

    return JSON.parse(decodeBase64Url(payload)) as TPayload;
  } catch {
    return null;
  }
}

export function decodeAccessToken(token: string) {
  return decodeJwtPayload<AccessTokenPayload>(token);
}

export function decodeRefreshToken(token: string) {
  return decodeJwtPayload<RefreshTokenPayload>(token);
}

export async function clearAuthData() {
  if (typeof window === "undefined") return;

  await fetch("/api/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch(() => undefined);
}
