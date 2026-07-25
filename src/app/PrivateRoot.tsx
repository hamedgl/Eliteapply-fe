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

function Bootstrap() {
  const setAuthenticated = useSession((state) => state.setAuthenticated);
  const setUser = useSession((state) => state.setUser);
  const setInitializing = useSession((state) => state.setInitializing);

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
          const user = await usersApi.me();
          if (active) setUser(user);
        } else if (refreshRes.kind === "invalid_session") {
          useSession.getState().clearSession();
        }
      } catch {
        useSession.getState().clearSession();
      } finally {
        if (active) setInitializing(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [setInitializing, setUser]);

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
