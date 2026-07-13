import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import type { components } from "../../generated/api/schema";
import { useSession } from "../auth/session";
import { billingApi } from "../api/billing";
import { queryKeys } from "../api/queryKeys";

type Entitlements = components["schemas"]["EntitlementResponse"];
const EntitlementContext = createContext<UseQueryResult<Entitlements> | null>(
  null,
);

export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const authenticated = useSession((state) => Boolean(state.accessToken));
  const query = useQuery({
    queryKey: queryKeys.entitlements,
    queryFn: billingApi.entitlements,
    enabled: authenticated,
  });
  return (
    <EntitlementContext.Provider value={query}>
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlements() {
  const value = useContext(EntitlementContext);
  if (!value) throw new Error("useEntitlements requires EntitlementProvider");
  return value;
}

