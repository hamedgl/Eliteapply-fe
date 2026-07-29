import type { components } from "../../generated/api/schema";
import { performTokenRefresh } from "../auth/refresh";
import { sessionSnapshot } from "../auth/session";
import { apiRequest } from "./client";
import { normalizeApiError } from "./errors";

type S = components["schemas"];
type Profile = S["UserProfileResponse"];

const correlation = () => crypto.randomUUID();

async function avatarRequest<T>(
  path: string,
  options: RequestInit,
  retried = false,
) {
  const token = sessionSnapshot().accessToken;
  const headers = new Headers(options.headers);
  headers.set("x-correlation-id", correlation());
  if (token) headers.set("authorization", `Bearer ${token}`);
  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (response.status === 401 && !retried) {
    const refresh = await performTokenRefresh();
    if (refresh.kind === "success")
      return avatarRequest<T>(path, options, true);
  }
  if (!response.ok) throw await normalizeApiError(response);
  return (await response.json()) as T;
}

async function uploadAvatar(file: File): Promise<Profile> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Upload a JPEG, PNG or WebP image.");
  if (!file.size || file.size > 2 * 1024 * 1024)
    throw new Error("Image must be under 2 MB.");
  return avatarRequest<Profile>("/api/avatar", {
    method: "POST",
    headers: { "content-type": file.type },
    body: file,
  });
}

export const usersApi = {
  me: () => apiRequest<Profile>("/users/me"),
  update: (body: S["UpdateProfileRequest"]) =>
    apiRequest<Profile>("/users/me", { method: "PUT", body }),
  consent: (body: S["UpdateConsentRequest"]) =>
    apiRequest<Profile>("/users/me/consent", { method: "POST", body }),
  avatar: uploadAvatar,
  removeAvatar: () =>
    avatarRequest<Profile>("/api/avatar", { method: "DELETE" }),
  export: () => apiRequest<Response>("/users/me/export", { raw: true }),
  requestDelete: () =>
    apiRequest("/users/me/delete-request", { method: "POST" }),
  confirmDelete: (body: S["ConfirmDeleteAccountRequest"]) =>
    apiRequest("/users/me", { method: "DELETE", body }),
};
