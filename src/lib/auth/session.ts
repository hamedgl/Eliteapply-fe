import { create } from "zustand";
import type { components } from "../../generated/api/schema";
import type { AuthSessionState, AuthenticatedUser } from "./auth-types";

type LoginResponse = components["schemas"]["LoginResponse"];

type AuthActions = {
  setAuthenticated: (params: {
    accessToken: string;
    idToken?: string | null;
    expiresIn: number;
    user?: AuthenticatedUser | null;
  }) => void;
  setRefreshing: () => void;
  setAnonymous: () => void;
  setDegraded: (reason?: string) => void;
  clearSession: () => void;
  incrementSessionEpoch: () => number;
  setUser: (user: AuthenticatedUser | null) => void;
  setInitializing: (initializing: boolean) => void;
  setTokens: (response: LoginResponse) => void;
  clear: () => void;
};

export type AuthStore = AuthSessionState & AuthActions;

export const useSession = create<AuthStore>((set, get) => ({
  status: "uninitialized",
  accessToken: null,
  idToken: null,
  accessTokenExpiresAt: null,
  user: null,
  sessionEpoch: 0,
  lastRefreshAt: null,
  degradedReason: null,
  initializing: true,

  setAuthenticated: ({ accessToken, idToken = null, expiresIn, user = null }) => {
    try {
      localStorage.setItem("ea_has_session", "1");
    } catch {}
    set((state) => ({
      status: "authenticated",
      accessToken,
      idToken: idToken ?? null,
      accessTokenExpiresAt: Date.now() + expiresIn * 1000,
      user: user ?? state.user,
      lastRefreshAt: Date.now(),
      degradedReason: null,
      initializing: false,
    }));
  },

  setRefreshing: () => {
    set((state) => ({
      status: state.status === "authenticated" ? "refreshing" : state.status,
    }));
  },

  setAnonymous: () => {
    try {
      localStorage.removeItem("ea_has_session");
    } catch {}
    set({
      status: "anonymous",
      accessToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      user: null,
      degradedReason: null,
      initializing: false,
    });
  },

  setDegraded: (reason) => {
    set({
      status: "degraded",
      degradedReason: reason ?? "Network connection degraded",
      initializing: false,
    });
  },

  clearSession: () => {
    try {
      localStorage.removeItem("ea_has_session");
    } catch {}
    set((state) => ({
      status: "anonymous",
      accessToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      user: null,
      sessionEpoch: state.sessionEpoch + 1,
      degradedReason: null,
      initializing: false,
    }));
  },

  incrementSessionEpoch: () => {
    const nextEpoch = get().sessionEpoch + 1;
    set({ sessionEpoch: nextEpoch });
    return nextEpoch;
  },

  setUser: (user) => set({ user }),

  setInitializing: (initializing) => {
    set((state) => {
      if (initializing) {
        return { status: "initializing", initializing: true };
      }
      const nextStatus =
        state.status === "initializing" || state.status === "uninitialized"
          ? state.accessToken
            ? "authenticated"
            : "anonymous"
          : state.status;
      return { status: nextStatus, initializing: false };
    });
  },

  setTokens: (x: LoginResponse) => {
    get().setAuthenticated({
      accessToken: x.access_token,
      idToken: x.id_token ?? null,
      expiresIn: x.expires_in,
    });
  },

  clear: () => {
    get().clearSession();
  },
}));

export const sessionSnapshot = () => useSession.getState();
