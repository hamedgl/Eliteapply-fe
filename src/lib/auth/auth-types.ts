import type { components } from "../../generated/api/schema";

export type AuthenticatedUser = components["schemas"]["UserProfileResponse"];

export type AuthStatus =
  | "uninitialized"
  | "initializing"
  | "authenticated"
  | "anonymous"
  | "refreshing"
  | "degraded";

export type AuthSessionState = {
  status: AuthStatus;
  accessToken: string | null;
  idToken: string | null;
  accessTokenExpiresAt: number | null;
  user: AuthenticatedUser | null;
  sessionEpoch: number;
  lastRefreshAt: number | null;
  degradedReason?: string | null;
};

export type AuthClearReason =
  | "logout"
  | "logout_all"
  | "session_expired"
  | "account_disabled"
  | "security_reset"
  | "unauthorized_error";

export const INVALID_SESSION_CODES = new Set<string>([
  "refresh_token_missing",
  "refresh_token_invalid",
  "refresh_token_expired",
  "refresh_token_reused",
  "session_revoked",
  "session_expired",
  "account_disabled",
  "access_token_revoked",
]);

export type RefreshResult =
  | {
      kind: "success";
      accessToken: string;
      idToken?: string | null;
      expiresIn: number;
    }
  | {
      kind: "invalid_session";
      code: string;
    }
  | {
      kind: "transient_failure";
      status?: number;
      code?: string;
      message?: string;
    };

export type AuthChannelMessage =
  | { type: "REFRESH_STARTED"; tabId: string; at: number }
  | { type: "REFRESH_COMPLETED"; tabId: string; at: number }
  | { type: "REFRESH_FAILED"; tabId: string; at: number; reason: string }
  | { type: "SESSION_EXPIRED"; at: number }
  | { type: "LOGOUT"; at: number };
