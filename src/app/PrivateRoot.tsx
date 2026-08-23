import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { App } from "./App";
import { usersApi } from "../lib/api/users";
import { useSession } from "../lib/auth/session";
import { performTokenRefresh } from "../lib/auth/refresh";
import { onAuthCleanup } from "../lib/auth/auth-cleanup";
import { authChannel } from "../lib/auth/auth-channel";
import { CapabilityProvider } from "../lib/capabilities/provider";
import { EntitlementProvider } from "../lib/billing/provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 120_000,
      gcTime: 1_800_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * The bootstrap profile fetch below isn't a react-query call, so it doesn't get the
 * `retry: 1` every other query in the app has. Without it, a single transient
 * network blip leaves the session "authenticated but profile-less" for the rest of
 * the tab's life — which also means ConsentGate's age/terms gate never gets a
 * chance to run for that session, since it requires a loaded profile.
 */
export async function fetchUserWithRetry() {
  try {
    return await usersApi.me();
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return usersApi.me();
  }
}

function Bootstrap() {
  const setUser = useSession((state) => state.setUser);
  const setInitializing = useSession((state) => state.setInitializing);
  const accessToken = useSession((state) => state.accessToken);
  const hasUser = useSession((state) => state.user !== null);
  const initializing = useSession((state) => state.initializing);

  useEffect(() => {
    const unsubscribeCleanup = onAuthCleanup(() => {
      queryClient.clear();
    });

    const unsubscribeChannel = authChannel.subscribe((msg) => {
      if (msg.type === "LOGOUT" || msg.type === "SESSION_EXPIRED") {
        queryClient.clear();
        useSession.getState().clearSession();
      } else if (msg.type === "REFRESH_COMPLETED") {
        // another tab refreshed successfully, perform soft check if needed
      }
    });

    return () => {
      unsubscribeCleanup();
      unsubscribeChannel();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const pathname = window.location.pathname;
    const isAppPath =
      pathname.startsWith("/app") ||
      pathname.startsWith("/admin") ||
      pathname === "/login" ||
      pathname === "/register";
    let hasSession = false;
    try {
      hasSession = localStorage.getItem("ea_has_session") === "1";
    } catch {}

    if (!hasSession && !isAppPath) {
      setInitializing(false);
      return;
    }

    void (async () => {
      try {
        const refreshRes = await performTokenRefresh();
        if (!active) return;

        if (refreshRes.kind === "success") {
          const user = await fetchUserWithRetry();
          if (active) setUser(user);
        } else if (refreshRes.kind === "invalid_session") {
          useSession.getState().clearSession();
        }
      } catch {
        // ponytail: only drop the session if the refresh never produced a token.
        // A failing /users/me (network, 500) must not log the user out.
        if (!useSession.getState().accessToken) {
          useSession.getState().clearSession();
        }
      } finally {
        if (active) setInitializing(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [setInitializing, setUser]);

  // The mount effect above only runs once, so a login that happens *after* mount
  // (password, Google One Tap, OAuth callback — all of which only set tokens)
  // would leave `user` null until a full page reload. Fetch the profile whenever
  // we hold a token without one.
  useEffect(() => {
    if (initializing || !accessToken || hasUser) return;
    let active = true;
    void (async () => {
      try {
        const user = await fetchUserWithRetry();
        if (active) setUser(user);
      } catch {
        // ponytail: header falls back to "Your account"; the next refresh retries.
      }
    })();
    return () => {
      active = false;
    };
  }, [initializing, accessToken, hasUser, setUser]);

  useEffect(() => {
    const handleFocusOrVisible = () => {
      const state = useSession.getState();
      if (state.status !== "authenticated" || !state.accessTokenExpiresAt) return;

      const skewMs = 60_000;
      if (Date.now() + skewMs >= state.accessTokenExpiresAt) {
        void performTokenRefresh();
      }
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
    };
  }, []);

  return (
    <CapabilityProvider>
      <EntitlementProvider>
        <App />
      </EntitlementProvider>
    </CapabilityProvider>
  );
}

export function PrivateRoot() {
  return (
    <QueryClientProvider client={queryClient}>
      <Bootstrap />
    </QueryClientProvider>
  );
}
