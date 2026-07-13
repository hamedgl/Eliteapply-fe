import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { App } from "./App";
import { authApi } from "../lib/api/auth";
import { usersApi } from "../lib/api/users";
import { useSession } from "../lib/auth/session";
import { CapabilityProvider } from "../lib/capabilities/provider";

const client = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function Bootstrap() {
  const setTokens = useSession((state) => state.setTokens);
  const setUser = useSession((state) => state.setUser);
  const setInitializing = useSession((state) => state.setInitializing);

  useEffect(() => {
    let active = true;
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
      <App />
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
