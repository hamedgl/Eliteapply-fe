import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { App } from "./App";
import { authApi } from "../lib/api/auth";
import { usersApi } from "../lib/api/users";
import { useSession } from "../lib/auth/session";
import { CapabilityProvider } from "../lib/capabilities/provider";
import { EntitlementProvider } from "../lib/billing/provider";

const client = new QueryClient({
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
  const setTokens = useSession((state) => state.setTokens);
  const setUser = useSession((state) => state.setUser);
  const setInitializing = useSession((state) => state.setInitializing);

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
        const tokens = await authApi.refresh();
        if (!active) return;
        setTokens(tokens);
        setUser(await usersApi.me());
      } catch {
        useSession.getState().clear();
      } finally {
        if (active) setInitializing(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [setInitializing, setTokens, setUser]);

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
    <QueryClientProvider client={client}>
      <Bootstrap />
    </QueryClientProvider>
  );
}
