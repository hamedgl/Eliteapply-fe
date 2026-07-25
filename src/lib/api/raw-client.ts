import { productConfig } from "../config/product";
import { normalizeApiError, ApiError } from "./errors";

export type RawFetchOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
};

const correlation = () => crypto.randomUUID();

export async function rawFetch<T = unknown>(
  path: string,
  options: RawFetchOptions = {}
): Promise<{ ok: boolean; status: number; data: T; headers: Headers }> {
  const headers = new Headers(options.headers);
  headers.set("x-correlation-id", correlation());
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set("content-type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${productConfig.apiBaseUrl}${path}`, {
      method: options.method ?? "GET",
      headers,
      credentials: options.credentials ?? "include",
      signal: options.signal,
      cache: "no-store",
      body:
        options.body instanceof FormData
          ? options.body
          : options.body === undefined
          ? undefined: JSON.stringify(options.body),
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

  if (!response.ok) {
    throw await normalizeApiError(response);
  }

  if (response.status === 204) {
    return { ok: true, status: 204, data: undefined as T, headers: response.headers };
  }

  const text = await response.text();
  const data = (text ? JSON.parse(text) : undefined) as T;
  return { ok: true, status: response.status, data, headers: response.headers };
}
