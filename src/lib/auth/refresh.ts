import { INVALID_SESSION_CODES } from "./auth-types";
import { getCsrfToken } from "./csrf";
import { rawFetch } from "../api/raw-client";
import { ApiError } from "../api/errors";
import { authChannel } from "./auth-channel";
import { useSession } from "./session";
import type { RefreshResult } from "./auth-types";
import type { components } from "../../generated/api/schema";

type LoginResponse = components["schemas"]["LoginResponse"];

let refreshPromise: Promise<RefreshResult> | null = null;
let activeAbortController: AbortController | null = null;

export async function bootstrapCsrf(force = false): Promise<string | null> {
  let token = getCsrfToken();
  if (token && !force) return token;

  try {
    await rawFetch("/auth/csrf", {
      method: "GET",
      credentials: "include",
    });
    return getCsrfToken();
  } catch (err) {
    return null;
  }
}

export function cancelInFlightRefresh() {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
  refreshPromise = null;
}

export async function performTokenRefresh(): Promise<RefreshResult> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const sessionState = useSession.getState();
  const startedEpoch = sessionState.sessionEpoch;
  sessionState.setRefreshing();

  activeAbortController = new AbortController();
  const signal = activeAbortController.signal;

  authChannel.postMessage({
    type: "REFRESH_STARTED",
    tabId: authChannel.tabId,
    at: Date.now(),
  });

  refreshPromise = (async (): Promise<RefreshResult> => {
    let csrf = getCsrfToken();
    if (!csrf) {
      csrf = await bootstrapCsrf(true);
    }

    try {
      const res = await rawFetch<LoginResponse>("/auth/refresh", {
        method: "POST",
        credentials: "include",
        signal,
        headers: {
          "X-CSRF-Token": csrf ?? "",
        },
      });

      if (useSession.getState().sessionEpoch !== startedEpoch) {
        return {
          kind: "transient_failure",
          code: "STALE_SESSION_EPOCH",
          message: "Session epoch changed during refresh",
        };
      }

      const tokens = res.data;
      useSession.getState().setAuthenticated({
        accessToken: tokens.access_token,
        idToken: tokens.id_token ?? null,
        expiresIn: tokens.expires_in,
      });

      authChannel.postMessage({
        type: "REFRESH_COMPLETED",
        tabId: authChannel.tabId,
        at: Date.now(),
      });

      return {
        kind: "success",
        accessToken: tokens.access_token,
        idToken: tokens.id_token ?? null,
        expiresIn: tokens.expires_in,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "ABORTED") {
          return {
            kind: "transient_failure",
            code: "ABORTED",
            message: "Refresh aborted",
          };
        }

        if (error.code === "csrf_validation_failed") {
          const newCsrf = await bootstrapCsrf(true);
          if (newCsrf) {
            try {
              const retryRes = await rawFetch<LoginResponse>("/auth/refresh", {
                method: "POST",
                credentials: "include",
                signal,
                headers: {
                  "X-CSRF-Token": newCsrf,
                },
              });

              if (useSession.getState().sessionEpoch !== startedEpoch) {
                return {
                  kind: "transient_failure",
                  code: "STALE_SESSION_EPOCH",
                };
              }

              const tokens = retryRes.data;
              useSession.getState().setAuthenticated({
                accessToken: tokens.access_token,
                idToken: tokens.id_token ?? null,
                expiresIn: tokens.expires_in,
              });

              authChannel.postMessage({
                type: "REFRESH_COMPLETED",
                tabId: authChannel.tabId,
                at: Date.now(),
              });

              return {
                kind: "success",
                accessToken: tokens.access_token,
                idToken: tokens.id_token ?? null,
                expiresIn: tokens.expires_in,
              };
            } catch (retryErr) {
              if (retryErr instanceof ApiError) {
                if (INVALID_SESSION_CODES.has(retryErr.code)) {
                  return { kind: "invalid_session", code: retryErr.code };
                }
                return {
                  kind: "transient_failure",
                  status: retryErr.status,
                  code: retryErr.code,
                  message: retryErr.message,
                };
              }
            }
          }
        }

        if (INVALID_SESSION_CODES.has(error.code)) {
          authChannel.postMessage({
            type: "REFRESH_FAILED",
            tabId: authChannel.tabId,
            at: Date.now(),
            reason: error.code,
          });
          return { kind: "invalid_session", code: error.code };
        }

        return {
          kind: "transient_failure",
          status: error.status,
          code: error.code,
          message: error.message,
        };
      }

      return {
        kind: "transient_failure",
        message: "Unknown error during refresh",
      };
    }
  })().finally(() => {
    refreshPromise = null;
    activeAbortController = null;
  });

  return refreshPromise;
}
