import { normalizePath } from "@/lib/utils";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type CustomOptions = Omit<RequestInit, "body" | "method"> & {
  baseUrl?: string;
  body?: BodyInit | object | null;
  skipAuth?: boolean;
};

type ApiResponse<TPayload> = {
  status: number;
  payload: TPayload;
};

type BackendEnvelope<TPayload> = {
  success: boolean;
  message: string;
  data?: TPayload;
  error?: unknown;
  meta?: {
    pagination?: {
      total: number;
      page: number;
      limit: number;
      [key: string]: unknown;
    };
  };
};

type EntityErrorPayload = {
  message: string;
  errors: {
    field?: string;
    path?: string;
    message: string;
    code?: string;
    detail?: string;
  }[];
};

const ENTITY_ERROR_STATUS = 422;
const AUTHENTICATION_ERROR_STATUS = 401;
const MAX_AUTH_RETRIES = 1;
const DEFAULT_LOGIN_PATH = "/vi/auth/login";
const AUTH_PATHS = {
  refreshToken: "api/auth/refresh-token",
  logout: "api/auth/logout",
};

const isClient = typeof window !== "undefined";

export class HttpError<
  TPayload extends { message?: string } = { message?: string },
> extends Error {
  status: number;
  payload: TPayload;
  response: {
    data: TPayload;
    status: number;
  };

  constructor({
    status,
    payload,
    message = "UNKNOWN_ERROR",
  }: {
    status: number;
    payload: TPayload;
    message?: string;
  }) {
    super(message);
    this.status = status;
    this.payload = payload;
    this.response = {
      data: payload,
      status,
    };
  }
}

export class EntityError extends HttpError<EntityErrorPayload> {
  status: typeof ENTITY_ERROR_STATUS;
  payload: EntityErrorPayload;

  constructor({
    status,
    payload,
  }: {
    status: typeof ENTITY_ERROR_STATUS;
    payload: EntityErrorPayload;
  }) {
    super({ status, payload, message: "VALIDATION_ERROR" });
    this.status = status;
    this.payload = payload;
  }
}

let clientLogoutRequest: Promise<void> | null = null;
let refreshTokenRequest: Promise<void> | null = null;

function getLoginPath() {
  if (!isClient) return DEFAULT_LOGIN_PATH;

  const [locale] = location.pathname.split("/").filter(Boolean);

  return locale ? `/${locale}/auth/login` : DEFAULT_LOGIN_PATH;
}

function getBaseUrl(baseUrl?: string) {
  return (
    baseUrl ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_ENDPOINT ??
    ""
  );
}

function getFullUrl(url: string, baseUrl?: string) {
  const normalizedUrl = normalizePath(url);
  const normalizedBaseUrl = getBaseUrl(baseUrl).replace(/\/+$/g, "");

  if (!normalizedBaseUrl) return `/${normalizedUrl}`;

  return `${normalizedBaseUrl}/${normalizedUrl}`;
}

function getRequestUrl(url: string, options: CustomOptions) {
  if (isClient && !options.skipAuth && options.baseUrl === undefined) {
    return getFullUrl(`api/backend/${normalizePath(url)}`, "");
  }

  return getFullUrl(url, options.baseUrl);
}

function normalizeBody(body: CustomOptions["body"]) {
  if (body === undefined || body === null) return undefined;
  if (body instanceof FormData) return body;
  if (body instanceof URLSearchParams) return body;
  if (body instanceof Blob) return body;
  if (typeof body === "string") return body;

  return JSON.stringify(body);
}

async function parsePayload(response: Response) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return text || null;
}

function isBackendEnvelope(
  payload: unknown,
): payload is BackendEnvelope<unknown> {
  return Boolean(
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    "message" in payload &&
    ("data" in payload || "error" in payload),
  );
}

function unwrapPayload<TPayload>(payload: unknown): TPayload {
  if (isBackendEnvelope(payload) && payload.success) {
    if (payload.meta?.pagination && Array.isArray(payload.data)) {
      return {
        items: payload.data,
        ...payload.meta.pagination,
      } as TPayload;
    }

    return payload.data as TPayload;
  }

  return payload as TPayload;
}

function toEntityErrorPayload(payload: unknown): EntityErrorPayload {
  if (!payload || typeof payload !== "object") {
    return {
      message: "VALIDATION_ERROR",
      errors: [],
    };
  }

  const value = payload as {
    message?: string;
    errors?: EntityErrorPayload["errors"];
    error?: {
      details?: {
        message?: EntityErrorPayload["errors"] | string;
      };
    };
  };

  if (value.errors?.length) {
    return {
      message: value.message ?? "VALIDATION_ERROR",
      errors: value.errors,
    };
  }

  const detailMessage = value.error?.details?.message;

  return {
    message: value.message ?? "VALIDATION_ERROR",
    errors: Array.isArray(detailMessage) ? detailMessage : [],
  };
}

class AuthAgent {
  async refreshTokens() {
    if (refreshTokenRequest) return refreshTokenRequest;

    refreshTokenRequest = (async () => {
      await request<{ message: string }>(
        "POST",
        AUTH_PATHS.refreshToken,
        {
          baseUrl: "",
          skipAuth: true,
        },
        MAX_AUTH_RETRIES,
      );
    })();

    try {
      return await refreshTokenRequest;
    } finally {
      refreshTokenRequest = null;
    }
  }

  async handleLogout() {
    if (clientLogoutRequest) return clientLogoutRequest;

    clientLogoutRequest = (async () => {
      await fetch(getFullUrl(AUTH_PATHS.logout, ""), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }).catch(() => undefined);

      if (isClient) {
        location.href = getLoginPath();
      }
    })();

    try {
      return await clientLogoutRequest;
    } finally {
      clientLogoutRequest = null;
    }
  }
}

const authAgent = new AuthAgent();

async function request<TPayload>(
  method: HttpMethod,
  url: string,
  options: CustomOptions = {},
  retryCount = 0,
): Promise<ApiResponse<TPayload>> {
  const normalizedUrl = normalizePath(url);
  const body = normalizeBody(options.body);
  const headers = new Headers(options.headers);

  if (
    !(body instanceof FormData) &&
    body !== undefined &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(getRequestUrl(url, options), {
      ...options,
      body,
      headers,
      method,
    });
    const rawPayload = await parsePayload(response);
    const payload = unwrapPayload<TPayload>(rawPayload);
    const data = {
      status: response.status,
      payload,
    };

    if (!response.ok) {
      if (response.status === ENTITY_ERROR_STATUS) {
        throw new EntityError({
          status: ENTITY_ERROR_STATUS,
          payload: toEntityErrorPayload(rawPayload),
        });
      }

      if (response.status === AUTHENTICATION_ERROR_STATUS) {
        if (
          isClient &&
          retryCount < MAX_AUTH_RETRIES &&
          normalizedUrl !== AUTH_PATHS.refreshToken &&
          normalizedUrl !== AUTH_PATHS.logout
        ) {
          try {
            await authAgent.refreshTokens();

            return request<TPayload>(method, url, options, retryCount + 1);
          } catch {
            await authAgent.handleLogout();
          }
        }

        if (isClient) {
          await authAgent.handleLogout();
        }
      }

      throw new HttpError({
        status: data.status,
        payload: data.payload as TPayload & { message?: string },
      });
    }

    return data;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError({
      status: 500,
      payload: {
        message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      },
    });
  }
}

const http = {
  get<TPayload>(url: string, options?: Omit<CustomOptions, "body">) {
    return request<TPayload>("GET", url, options);
  },
  post<TPayload>(
    url: string,
    body?: CustomOptions["body"],
    options?: Omit<CustomOptions, "body">,
  ) {
    return request<TPayload>("POST", url, { ...options, body });
  },
  put<TPayload>(
    url: string,
    body?: CustomOptions["body"],
    options?: Omit<CustomOptions, "body">,
  ) {
    return request<TPayload>("PUT", url, { ...options, body });
  },
  patch<TPayload>(
    url: string,
    body?: CustomOptions["body"],
    options?: Omit<CustomOptions, "body">,
  ) {
    return request<TPayload>("PATCH", url, { ...options, body });
  },
  delete<TPayload>(url: string, options?: Omit<CustomOptions, "body">) {
    return request<TPayload>("DELETE", url, options);
  },
  authAgent,
};

export type { ApiResponse, CustomOptions, EntityErrorPayload };
export default http;
