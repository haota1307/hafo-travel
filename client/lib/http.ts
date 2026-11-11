import { getApiBaseUrl } from "./api-url";

export type ApiEnvelope<T> = {
  statusCode: number;
  message: string | string[];
  data?: T;
  processId?: string;
  duration?: string;
  code?: string;
  error?: string;
};

export type HttpResponse<TPayload> = {
  status: number;
  payload: TPayload;
};

export type HttpOptions = Omit<RequestInit, "method" | "body"> & {
  baseUrl?: string;
};

type HttpBody = object | string | null;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : `HTTP ${status}`,
    );

    this.name = "HttpError";
  }
}

export class EntityError extends HttpError {
  constructor(status: number, payload: unknown) {
    super(status, payload);

    this.name = "EntityError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function unwrapPayload(body: unknown): unknown {
  if (
    !isRecord(body) ||
    typeof body.statusCode !== "number" ||
    !(
      typeof body.message === "string" ||
      (Array.isArray(body.message) &&
        body.message.every((message) => typeof message === "string"))
    )
  ) {
    return body;
  }

  return body.data;
}

function getRequestUrl(path: string, configuredBaseUrl?: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl =
    configuredBaseUrl ??
    (typeof window === "undefined" ? getApiBaseUrl() : "/api/backend");
  const url = `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  if (typeof window === "undefined" && !/^https?:\/\//i.test(url)) {
    throw new Error("Server HTTP requests require an absolute baseUrl.");
  }

  return url;
}

function serializeBody(body: HttpBody | undefined): BodyInit | undefined {
  if (body == null) {
    return undefined;
  }
  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob
  ) {
    return body;
  }

  return JSON.stringify(body);
}

async function request<TPayload>(
  method: HttpMethod,
  path: string,
  body: HttpBody | undefined,
  options: HttpOptions = {},
): Promise<HttpResponse<TPayload>> {
  const { baseUrl, headers: customHeaders, ...requestOptions } = options;
  const headers = new Headers(customHeaders);
  const serializedBody = serializeBody(body);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (
    body != null &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams) &&
    !(body instanceof Blob) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(getRequestUrl(path, baseUrl), {
    cache: "no-store",
    ...requestOptions,
    method,
    headers,
    body: serializedBody,
  });
  const text = await response.text();
  const contentType = response.headers.get("Content-Type") ?? "";

  let payload: unknown = text || null;

  if (text && /\bjson\b/i.test(contentType)) {
    try {
      payload = JSON.parse(text);
    } catch (error) {
      // Preserve HTTP status for non-JSON gateway/error responses.
      if (response.ok) {
        throw error;
      }
    }
  }

  if (!response.ok) {
    const ErrorClass = response.status === 422 ? EntityError : HttpError;
    throw new ErrorClass(response.status, payload);
  }

  return {
    status: response.status,
    payload: unwrapPayload(payload) as TPayload,
  };
}

const http = {
  get: <T>(path: string, options?: HttpOptions) =>
    request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: HttpBody, options?: HttpOptions) =>
    request<T>("POST", path, body, options),
  put: <T>(path: string, body?: HttpBody, options?: HttpOptions) =>
    request<T>("PUT", path, body, options),
  patch: <T>(path: string, body?: HttpBody, options?: HttpOptions) =>
    request<T>("PATCH", path, body, options),
  delete: <T>(path: string, options?: HttpOptions) =>
    request<T>("DELETE", path, undefined, options),
};

export default http;
