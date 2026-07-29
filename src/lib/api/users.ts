import type { components } from "../../generated/api/schema";
import { performTokenRefresh } from "../auth/refresh";
import { sessionSnapshot } from "../auth/session";
import { apiRequest } from "./client";
import { normalizeApiError } from "./errors";
import { uploadToSignedUrl } from "./signedTransport";

type S = components["schemas"];
type Profile = S["UserProfileResponse"];

type AvatarUploadTarget = {
  storage_key: string;
  upload_url: string;
  upload_method: string;
  upload_fields?: Record<string, unknown>;
  max_size_bytes: number;
};

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
  const target = await avatarRequest<AvatarUploadTarget>(
    "/api/avatar/upload-url",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content_type: file.type,
        size_bytes: file.size,
      }),
    },
  );
  await uploadToSignedUrl({
    uploadUrl: target.upload_url,
    method: target.upload_method,
    fields: target.upload_fields,
    file,
    contentType: file.type,
    maxSizeBytes: target.max_size_bytes,
  });
  return avatarRequest<Profile>("/api/avatar/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      storage_key: target.storage_key,
      size_bytes: file.size,
    }),
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
