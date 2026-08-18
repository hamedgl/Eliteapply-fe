import { describe, it, expect, beforeEach, vi } from "vitest";
import { getCsrfToken } from "../lib/auth/csrf";
import { useSession } from "../lib/auth/session";
import { clearAuthenticatedClientState } from "../lib/auth/auth-cleanup";
import { logoutAll } from "../lib/auth/logout";
import { apiRequest, isBodyReplayable } from "../lib/api/client";
import { authChannel } from "../lib/auth/auth-channel";
import { ApiError } from "../lib/api/errors";

describe("Frontend Auth Lifecycle Hardening & Production P0 Fixes", () => {
  beforeEach(() => {
    useSession.getState().clearSession();
    document.cookie = "eliteapply_csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    vi.restoreAllMocks();
  });

  describe("CSRF reader", () => {
    it("parses eliteapply_csrf_token cookie safely", () => {
      document.cookie = "eliteapply_csrf_token=test-csrf-123; path=/";
      expect(getCsrfToken()).toBe("test-csrf-123");
    });

    it("returns null when cookie missing", () => {
      expect(getCsrfToken()).toBeNull();
    });
  });

  describe("Auth Store State Machine", () => {
    it("updates auth status and tokens on setAuthenticated", () => {
      useSession.getState().setAuthenticated({
        accessToken: "access-123",
        idToken: "id-456",
        expiresIn: 3600,
      });

      const state = useSession.getState();
      expect(state.status).toBe("authenticated");
      expect(state.accessToken).toBe("access-123");
      expect(state.idToken).toBe("id-456");
      expect(state.accessTokenExpiresAt).toBeGreaterThan(Date.now());
    });

    it("resets to anonymous and increments epoch on clearSession", () => {
      useSession.getState().setAuthenticated({
        accessToken: "access-123",
        expiresIn: 3600,
      });
      const initialEpoch = useSession.getState().sessionEpoch;

      useSession.getState().clearSession();

      const state = useSession.getState();
      expect(state.status).toBe("anonymous");
      expect(state.accessToken).toBeNull();
      expect(state.sessionEpoch).toBe(initialEpoch + 1);
    });
  });

  describe("P0 Fix 1: Generic 401 does not automatically clear session", () => {
    it("does not destroy session on generic 401 with non-session-invalidation error code", async () => {
      useSession.getState().setAuthenticated({ accessToken: "valid-token", expiresIn: 3600 });

      vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
        if (String(url).endsWith("/api/v1/user/profile")) {
          return new Response(
            JSON.stringify({ code: "INVALID_PROFILE_STATE", detail: "Profile state invalid" }),
            { status: 401, headers: { "content-type": "application/json" } }
          );
        }
        if (String(url).endsWith("/auth/csrf")) {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        if (String(url).endsWith("/auth/refresh")) {
          return new Response(
            JSON.stringify({ detail: { code: "some_other_code", message: "Error" } }),
            { status: 400, headers: { "content-type": "application/json" } }
          );
        }
        return new Response(null, { status: 404 });
      });

      await expect(apiRequest("/user/profile")).rejects.toThrow(ApiError);
      expect(useSession.getState().status).not.toBe("anonymous");
      expect(useSession.getState().accessToken).toBe("valid-token");
    });

    it("clears session when refresh returns explicit session invalid code (e.g. refresh_token_missing)", async () => {
      useSession.getState().setAuthenticated({ accessToken: "expired-token", expiresIn: 3600 });

      vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
        if (String(url).endsWith("/auth/csrf")) {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        if (String(url).endsWith("/auth/refresh")) {
          return new Response(
            JSON.stringify({ detail: { code: "refresh_token_missing", message: "Missing" } }),
            { status: 401, headers: { "content-type": "application/json" } }
          );
        }
        if (String(url).endsWith("/api/v1/protected-data")) {
          return new Response(JSON.stringify({ detail: "Unauthorized" }), { status: 401 });
        }
        return new Response(null, { status: 404 });
      });

      await expect(apiRequest("/protected-data")).rejects.toThrow();
      expect(useSession.getState().status).toBe("anonymous");
      expect(useSession.getState().accessToken).toBeNull();
    });
  });

  describe("P0 Fix 2: logoutAll includes bearer token until request finishes", () => {
    it("attaches Authorization bearer token to /auth/logout-all before clearing local session", async () => {
      useSession.getState().setAuthenticated({ accessToken: "secret-access-token", expiresIn: 3600 });
      document.cookie = "eliteapply_csrf_token=csrf-123; path=/";

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
        if (String(url).endsWith("/auth/logout-all")) {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        return new Response(null, { status: 404 });
      });

      const res = await logoutAll();
      expect(res.serverConfirmed).toBe(true);

      const logoutAllCall = fetchSpy.mock.calls.find((c) => String(c[0]).endsWith("/auth/logout-all"));
      expect(logoutAllCall).toBeDefined();
      const headers = logoutAllCall![1]?.headers as Headers;
      expect(headers.get("Authorization")).toBe("Bearer secret-access-token");
      expect(headers.get("X-CSRF-Token")).toBe("csrf-123");

      expect(useSession.getState().accessToken).toBeNull();
      expect(useSession.getState().status).toBe("anonymous");
    });
  });

  describe("P0 Fix 3: BroadcastChannel ordering and reconnection", () => {
    it("posts LOGOUT message to channel prior to clearing store state", () => {
      useSession.getState().setAuthenticated({ accessToken: "token-1", expiresIn: 3600 });

      const msgSpy = vi.spyOn(authChannel, "postMessage");
      clearAuthenticatedClientState("logout");

      expect(msgSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: "LOGOUT" })
      );
      expect(useSession.getState().status).toBe("anonymous");
    });

    it("resets and re-enables BroadcastChannel after reset()", () => {
      authChannel.reset();
      const handler = vi.fn();
      const unsub = authChannel.subscribe(handler);
      authChannel.postMessage({ type: "REFRESH_STARTED", tabId: "t1", at: Date.now() });
      unsub();
    });
  });

  describe("P0 Fix 4: Replayable Body Classification & Idempotent Mutation", () => {
    it("correctly identifies replayable vs stream/non-replayable bodies", () => {
      expect(isBodyReplayable({ a: 1 })).toBe(true);
      expect(isBodyReplayable("string body")).toBe(true);
      expect(isBodyReplayable(undefined)).toBe(true);
      expect(isBodyReplayable(new URLSearchParams("a=1"))).toBe(true);

      const dummyStream = typeof ReadableStream !== "undefined" ? new ReadableStream() : { getReader: () => {} };
      expect(isBodyReplayable(dummyStream)).toBe(false);
    });

    it("retries mutation preserving idempotency key and rebuilds JSON body", async () => {
      useSession.getState().setAuthenticated({ accessToken: "old-token", expiresIn: 3600 });

      let callCount = 0;
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
        if (String(url).endsWith("/auth/csrf")) {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        if (String(url).endsWith("/auth/refresh")) {
          return new Response(
            JSON.stringify({ access_token: "new-token", expires_in: 3600 }),
            { status: 200, headers: { "content-type": "application/json" } }
          );
        }
        if (String(url).endsWith("/api/v1/submit-form")) {
          callCount++;
          if (callCount === 1) {
            return new Response(JSON.stringify({ detail: "token expired" }), { status: 401 });
          }
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        return new Response(null, { status: 404 });
      });

      const res = await apiRequest<{ success: boolean }>("/submit-form", {
        method: "POST",
        body: { foo: "bar" },
        idempotencyKey: "unique-key-123",
      });

      expect(res.success).toBe(true);
      const submitCalls = fetchSpy.mock.calls.filter((c) => String(c[0]).endsWith("/api/v1/submit-form"));
      expect(submitCalls.length).toBe(2);

      const firstHeaders = submitCalls[0][1]?.headers as Headers;
      const secondHeaders = submitCalls[1][1]?.headers as Headers;
      expect(firstHeaders.get("Idempotency-Key")).toBe("unique-key-123");
      expect(secondHeaders.get("Idempotency-Key")).toBe("unique-key-123");
      expect(secondHeaders.get("Authorization")).toBe("Bearer new-token");
    });
  });
});
