import { env } from "@/config/env";
import type { ApiResponse } from "@/types/api";
import { isValidationIssueList, type ValidationIssue } from "@/lib/validation";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ValidationIssue[];

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.details = isValidationIssueList(details) ? details : undefined;
  }
}

type RequestOptions = {
  retry?: boolean;
  headers?: Record<string, string>;
  cache?: RequestCache;
};

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${env.apiUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

function looksLikeHtml(response: Response, text: string) {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("text/html") || text.trimStart().startsWith("<!");
}

function invalidResponseMessage(response: Response, text: string) {
  if (looksLikeHtml(response, text)) {
    return `The server sent a web page instead of an upload result (HTTP ${response.status})`;
  }
  return response.ok ? "The server sent an unexpected response" : `Upload failed (${response.status})`;
}

async function readPayload<T>(response: Response): Promise<ApiResponse<T>> {
  const text = await response.text();
  if (!text) {
    return {
      success: false,
      error: { code: "EMPTY_RESPONSE", message: "Empty response" },
    };
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: {
        code: "INVALID_RESPONSE",
        message: invalidResponseMessage(response, text),
      },
    };
  }
}

const AUTH_NO_REFRESH = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/providers",
]);

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const retry = options.retry ?? true;
  const response = await fetch(`${env.apiUrl}${path}`, {
    method,
    credentials: "include",
    cache: options.cache,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && retry && !AUTH_NO_REFRESH.has(path)) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(method, path, body, { ...options, retry: false });
    }
  }

  const payload = await readPayload<T>(response);

  if (!response.ok || payload.success === false) {
    const error = payload.success === false ? payload.error : undefined;
    throw new ApiRequestError(
      error?.message ?? "Request failed",
      response.status,
      error?.code ?? "REQUEST_FAILED",
      error?.details,
    );
  }

  return payload.data;
}

export function apiGet<T>(path: string, options?: Omit<RequestOptions, "retry">): Promise<T> {
  return request<T>("GET", path, undefined, options);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

export function apiPut<T>(
  path: string,
  body?: unknown,
  options?: Omit<RequestOptions, "retry">,
): Promise<T> {
  return request<T>("PUT", path, body, options);
}

export function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: Omit<RequestOptions, "retry">,
): Promise<T> {
  return request<T>("PATCH", path, body, options);
}

export async function apiUpload<T>(
  path: string,
  file: File,
  options: { retry?: boolean } = {},
): Promise<T> {
  const retry = options.retry ?? true;
  const body = new FormData();
  body.append("file", file);
  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      method: "POST",
      credentials: "include",
      redirect: "manual",
      body,
    });
  } catch {
    throw new ApiRequestError("Could not reach the API", 0, "NETWORK_ERROR");
  }

  if (response.status >= 300 && response.status < 400) {
    throw new ApiRequestError("Upload was redirected away from the API", response.status, "INVALID_RESPONSE");
  }

  const route = path.split("?")[0] ?? path;
  if (response.status === 401 && retry && !AUTH_NO_REFRESH.has(route)) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiUpload<T>(path, file, { retry: false });
    }
  }

  const payload = await readPayload<T>(response);
  if (!response.ok || payload.success === false) {
    const error = payload.success === false ? payload.error : undefined;
    throw new ApiRequestError(
      error?.message ?? "Upload failed",
      response.status,
      error?.code ?? "REQUEST_FAILED",
      error?.details,
    );
  }

  return payload.data;
}
