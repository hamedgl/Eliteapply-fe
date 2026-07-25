import { getCsrfToken } from "./csrf";
import { rawFetch } from "../api/raw-client";
import { clearAuthenticatedClientState } from "./auth-cleanup";
import { cancelInFlightRefresh } from "./refresh";
import { useSession } from "./session";

export async function logout(): Promise<{ serverConfirmed: boolean }> {
  cancelInFlightRefresh();

  let csrf = getCsrfToken();
  if (!csrf) {
    try {
      await rawFetch("/auth/csrf", { method: "GET", credentials: "include" });
      csrf = getCsrfToken();
    } catch {}
  }

  let serverConfirmed = false;
  try {
    await rawFetch("/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        "X-CSRF-Token": csrf ?? "",
      },
    });
    serverConfirmed = true;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "csrf_validation_failed"
    ) {
      try {
        await rawFetch("/auth/csrf", { method: "GET", credentials: "include" });
        const newCsrf = getCsrfToken();
        if (newCsrf) {
          await rawFetch("/auth/logout", {
            method: "POST",
            credentials: "include",
            headers: {
              "X-CSRF-Token": newCsrf,
            },
          });
          serverConfirmed = true;
        }
      } catch {}
    }
  } finally {
    clearAuthenticatedClientState("logout");
  }

  return { serverConfirmed };
}

export async function logoutAll(): Promise<{ serverConfirmed: boolean }> {
  cancelInFlightRefresh();

  const accessToken = useSession.getState().accessToken;
  let csrf = getCsrfToken();
  if (!csrf) {
    try {
      await rawFetch("/auth/csrf", { method: "GET", credentials: "include" });
      csrf = getCsrfToken();
    } catch {}
  }

  let serverConfirmed = false;
  try {
    const headers: Record<string, string> = {
      "X-CSRF-Token": csrf ?? "",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    await rawFetch("/auth/logout-all", {
      method: "POST",
      credentials: "include",
      headers,
    });
    serverConfirmed = true;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "csrf_validation_failed"
    ) {
      try {
        await rawFetch("/auth/csrf", { method: "GET", credentials: "include" });
        const newCsrf = getCsrfToken();
        if (newCsrf) {
          const headersRetry: Record<string, string> = {
            "X-CSRF-Token": newCsrf,
          };
          if (accessToken) {
            headersRetry["Authorization"] = `Bearer ${accessToken}`;
          }
          await rawFetch("/auth/logout-all", {
            method: "POST",
            credentials: "include",
            headers: headersRetry,
          });
          serverConfirmed = true;
        }
      } catch {}
    }
  } finally {
    clearAuthenticatedClientState("logout_all");
  }

  return { serverConfirmed };
}
