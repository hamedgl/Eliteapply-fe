import { productConfig } from "../config/product";
import { sessionSnapshot } from "../auth/session";
import { performTokenRefresh } from "../auth/refresh";
import { clearAuthenticatedClientState } from "../auth/auth-cleanup";
import { INVALID_SESSION_CODES } from "../auth/auth-types";
import { ApiError, normalizeApiError } from "./errors";

export type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  public?: boolean;
  credentials?: RequestCredentials;
  raw?: boolean;
  retry?: boolean;
  idempotencyKey?: string;
};

const NON_REFRESHABLE_PATHS = [
  "/auth/csrf",
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/logout-all",
  "/auth/forgot-password",
  "/auth/reset-password",
];

const correlation = () => crypto.randomUUID();

const MAX_AUTOMATIC_RETRY_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function isBodyReplayable(body: unknown): boolean {
  if (body === undefined || body === null) return true;
  if (typeof body === "string") return true;
  if (body instanceof URLSearchParams) return true;
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return true;
  if (body instanceof FormData) {
    for (const value of body.values()) {
      if (typeof value !== "string" && value instanceof File && value.size > MAX_AUTOMATIC_RETRY_FILE_SIZE) {
        return false;
      }
    }
    return true;
  }
  if (typeof body === "object" && body.constructor === Object) return true;
  if (Array.isArray(body)) return true;

  // Streams, Blob, consumed Request, etc. are NOT generically replayable
  return false;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = sessionSnapshot().accessToken;
  const headers = new Headers(options.headers);
  headers.set("x-correlation-id", correlation());

  if (token && !options.public) {
    headers.set("authorization", `Bearer ${token}`);
  }

  if (options.idempotencyKey) {
    headers.set("Idempotency-Key", options.idempotencyKey);
  }

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set("content-type", "application/json");
  }

  const method = options.method ?? "GET";
  const isSafeMethod = ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
  const bodyReplayable = isBodyReplayable(options.body);
  const canRetry =
    options.retry !== true &&
    bodyReplayable &&
    (isSafeMethod || Boolean(options.idempotencyKey));
  const isAuthEndpoint = NON_REFRESHABLE_PATHS.some((p) => path.startsWith(p));

  let response: Response;
  try {
    response = await fetch(`${productConfig.apiBaseUrl}${path}`, {
      method,
      headers,
      credentials: options.credentials ?? "include",
      signal: options.signal,
      body:
        options.body instanceof FormData
          ? options.body
          : options.body === undefined
          ? undefined
          : typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request cancelled.", 0, "ABORTED");
    }
    throw new ApiError(
      navigator.onLine
        ? "Could not reach EliteApply. Please try again."
        : "You appear to be offline.",
      0,
      navigator.onLine ? "NETWORK_ERROR" : "OFFLINE"
    );
  }

  if (response.status === 401 && !options.public && !isAuthEndpoint) {
    if (canRetry) {
      try {
        const refreshResult = await performTokenRefresh();
        if (refreshResult.kind === "success") {
          return apiRequest<T>(path, { ...options, retry: true });
        }
        if (refreshResult.kind === "invalid_session") {
          clearAuthenticatedClientState("session_expired");
          throw new ApiError("Your session has expired.", 401, "UNAUTHORIZED");
        }
      } catch (err) {
        if (err instanceof ApiError && INVALID_SESSION_CODES.has(err.code)) {
          clearAuthenticatedClientState("session_expired");
          throw err;
        }
      }
    }
  }

  if (!response.ok) {
    const error = await normalizeApiError(response);
    if (error.status === 403 && path.startsWith("/admin/")) {
      window.dispatchEvent(new CustomEvent("admin:forbidden", { detail: error }));
    }
    throw error;
  }

  if (options.raw) return response as unknown as T;
  if (response.status === 204) return undefined as unknown as T;

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
