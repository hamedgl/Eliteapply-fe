const SHELL_PREFIXES = [
  "/app",
  "/admin",
  "/share",
  "/collaborator-invitations",
  "/referee",
  "/verify",
];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const AVATAR_PREFIX = "eliteapply/avatars";
const AVATAR_CONTENT_PATH = "/api/avatar/content/";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function matchShellPrefix(pathname) {
  return SHELL_PREFIXES.find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...headers,
    },
  });
}

function keyFromContentUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!url.pathname.startsWith(AVATAR_CONTENT_PATH)) return null;
    return url.pathname
      .slice(AVATAR_CONTENT_PATH.length)
      .split("/")
      .map(decodeURIComponent)
      .join("/");
  } catch {
    return null;
  }
}

function ownedKey(key, prefix, userId) {
  return (
    typeof key === "string" &&
    key.startsWith(`${prefix}/${userId}/`) &&
    !key.includes("..")
  );
}

function detectImageType(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return "image/png";
  if (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}

async function currentUser(request, env) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer "))
    throw new HttpError(401, "Authentication required.");

  const response = await fetch(`${env.API_BASE_URL}/users/me`, {
    headers: {
      authorization,
      "x-correlation-id":
        request.headers.get("x-correlation-id") || crypto.randomUUID(),
    },
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403)
    throw new HttpError(response.status, "Authentication failed.");
  if (!response.ok) throw new HttpError(503, "Profile service is unavailable.");
  return { authorization, profile: await response.json() };
}

async function uploadAvatar(request, env) {
  const { authorization, profile: currentProfile } = await currentUser(
    request,
    env,
  );
  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .toLowerCase();
  const sizeBytes = Number(request.headers.get("content-length"));
  if (!AVATAR_TYPES[contentType])
    throw new HttpError(415, "Upload a JPEG, PNG or WebP image.");
  if (
    !Number.isInteger(sizeBytes) ||
    sizeBytes < 1 ||
    sizeBytes > MAX_AVATAR_BYTES
  )
    throw new HttpError(413, "Image must be under 2 MB.");

  const bytes = new Uint8Array(await request.arrayBuffer());
  const detectedType = detectImageType(bytes.subarray(0, 12));
  if (bytes.length !== sizeBytes || detectedType !== contentType)
    throw new HttpError(
      415,
      "The uploaded file is not a valid supported image.",
    );

  const finalKey = `${AVATAR_PREFIX}/${currentProfile.id}/${crypto.randomUUID()}.${AVATAR_TYPES[contentType]}`;
  await env.AVATARS.put(finalKey, bytes, {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      userId: currentProfile.id,
      finalizedAt: new Date().toISOString(),
    },
  });

  const response = await fetch(`${env.API_BASE_URL}/users/me/avatar/complete`, {
    method: "POST",
    headers: {
      authorization,
      "content-type": "application/json",
      "x-correlation-id":
        request.headers.get("x-correlation-id") || crypto.randomUUID(),
    },
    body: JSON.stringify({ storage_key: finalKey }),
  });
  if (!response.ok) {
    await env.AVATARS.delete(finalKey);
    throw new HttpError(
      response.status >= 500 ? 503 : response.status,
      "The profile photo could not be saved.",
    );
  }

  const previousKey = keyFromContentUrl(currentProfile.avatar_url);
  if (
    previousKey &&
    previousKey !== finalKey &&
    ownedKey(previousKey, AVATAR_PREFIX, currentProfile.id)
  )
    await env.AVATARS.delete(previousKey);

  return new Response(response.body, {
    status: response.status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

async function removeAvatar(request, env) {
  const { authorization, profile } = await currentUser(request, env);
  const key = keyFromContentUrl(profile.avatar_url);
  const response = await fetch(`${env.API_BASE_URL}/users/me/avatar`, {
    method: "DELETE",
    headers: {
      authorization,
      "x-correlation-id":
        request.headers.get("x-correlation-id") || crypto.randomUUID(),
    },
  });
  if (!response.ok)
    throw new HttpError(
      response.status >= 500 ? 503 : response.status,
      "The profile photo could not be removed.",
    );
  if (key && ownedKey(key, AVATAR_PREFIX, profile.id))
    await env.AVATARS.delete(key);
  return new Response(response.body, {
    status: response.status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

async function serveAvatar(request, env, pathname) {
  const key = pathname
    .slice(AVATAR_CONTENT_PATH.length)
    .split("/")
    .map(decodeURIComponent)
    .join("/");
  if (
    !key.startsWith(`${AVATAR_PREFIX}/`) ||
    key.includes("..") ||
    key.length > 1024
  )
    throw new HttpError(404, "Image not found.");

  const object =
    request.method === "HEAD"
      ? await env.AVATARS.head(key)
      : await env.AVATARS.get(key);
  if (!object) throw new HttpError(404, "Image not found.");
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("content-length", String(object.size));
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");
  headers.set("cross-origin-resource-policy", "cross-origin");
  return new Response(request.method === "HEAD" ? null : object.body, {
    headers,
  });
}

async function routeAvatar(request, env, url) {
  if (url.pathname === "/api/avatar" && request.method === "POST")
    return uploadAvatar(request, env);
  if (url.pathname === "/api/avatar" && request.method === "DELETE")
    return removeAvatar(request, env);
  if (
    url.pathname.startsWith(AVATAR_CONTENT_PATH) &&
    (request.method === "GET" || request.method === "HEAD")
  )
    return serveAvatar(request, env, url.pathname);
  throw new HttpError(404, "Not found.");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (
      url.pathname === "/api/avatar" ||
      url.pathname.startsWith("/api/avatar/")
    ) {
      try {
        return await routeAvatar(request, env, url);
      } catch (error) {
        if (error instanceof HttpError)
          return json({ detail: error.message }, error.status);
        console.error("avatar_request_failed", error);
        return json({ detail: "Avatar service is unavailable." }, 500);
      }
    }

    const prefix = matchShellPrefix(url.pathname);
    if (!prefix) return env.ASSETS.fetch(request);
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) return assetResponse;
    return env.ASSETS.fetch(new Request(new URL(`${prefix}/`, url), request));
  },
};
