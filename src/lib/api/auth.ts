import type { components } from "../../generated/api/schema";
import { apiRequest } from "./client";
import { rawFetch } from "./raw-client";
import { getCsrfToken } from "../auth/csrf";
import { bootstrapCsrf } from "../auth/refresh";
import { logout as logoutAction, logoutAll as logoutAllAction } from "../auth/logout";
import { sessionSnapshot } from "../auth/session";

type S = components["schemas"];

export const authApi = {
  register: (body: S["RegisterRequest"]) =>
    apiRequest<S["RegisterResponse"]>("/auth/register", {
      method: "POST",
      body,
      public: true,
    }),

  confirm: (body: S["ConfirmEmailRequest"]) =>
    apiRequest("/auth/confirm-email", {
      method: "POST",
      body,
      public: true,
    }),

  resend: (body: S["ResendConfirmationRequest"]) =>
    apiRequest("/auth/resend-confirmation", {
      method: "POST",
      body,
      public: true,
    }),

  login: async (body: S["LoginRequest"]) => {
    let csrf = getCsrfToken();
    if (!csrf) {
      csrf = await bootstrapCsrf(true);
    }
    const res = await rawFetch<S["LoginResponse"]>("/auth/login", {
      method: "POST",
      body,
      credentials: "include",
      headers: {
        "X-CSRF-Token": csrf ?? "",
      },
    });
    sessionSnapshot().setTokens(res.data);
    return res.data;
  },

  googleOneTap: async (body: S["GoogleOneTapRequest"]) => {
    let csrf = getCsrfToken();
    if (!csrf) {
      csrf = await bootstrapCsrf(true);
    }
    const res = await rawFetch<S["LoginResponse"]>("/auth/oauth/google/one-tap", {
      method: "POST",
      body,
      credentials: "include",
      headers: {
        "X-CSRF-Token": csrf ?? "",
      },
    });
    sessionSnapshot().setTokens(res.data);
    return res.data;
  },

  forgot: (body: S["ForgotPasswordRequest"]) =>
    apiRequest("/auth/forgot-password", {
      method: "POST",
      body,
      public: true,
    }),

  reset: (body: S["ResetPasswordRequest"]) =>
    apiRequest("/auth/reset-password", {
      method: "POST",
      body,
      public: true,
    }),

  refresh: () => apiRequest<S["LoginResponse"]>("/auth/refresh", { method: "POST", public: true }),

  logout: async () => {
    await logoutAction();
  },

  logoutAll: async () => {
    await logoutAllAction();
  },

  hasPassword: () => apiRequest<S["HasPasswordResponse"]>("/auth/has-password"),

  setPassword: (body: S["SetPasswordRequest"]) =>
    apiRequest("/auth/set-password", { method: "POST", body }),

  changePassword: (body: S["ChangePasswordRequest"]) =>
    apiRequest("/auth/change-password", { method: "POST", body }),
};
