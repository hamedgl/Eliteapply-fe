import { productConfig } from "../config/product";

export type UploadProgress = {
  loaded: number;
  total?: number;
  percent?: number;
};

type UploadOptions = {
  uploadUrl: string;
  method: string;
  fields?: Record<string, unknown>;
  file: Blob;
  contentType?: string;
  maxSizeBytes: number;
  signal?: AbortSignal;
  onProgress?: (progress: UploadProgress) => void;
};

const absoluteScheme = /^[a-z][a-z\d+.-]*:/i;

export function resolveSafeHttpUrl(value: string) {
  if (!value || value !== value.trim()) throw new Error("The file URL is invalid.");
  const api = new URL(productConfig.apiBaseUrl, window.location.origin);
  let parsed: URL;
  try {
    parsed = new URL(value, `${api.origin}/`);
  } catch {
    throw new Error("The file URL is invalid.");
  }
  const local =
    parsed.hostname === "localhost" ||
    parsed.hostname.endsWith(".localhost") ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "[::1]";
  if (
    parsed.protocol !== "https:" &&
    !(parsed.protocol === "http:" && import.meta.env.DEV && local)
  )
    throw new Error("The file URL uses an unsupported protocol.");
  return absoluteScheme.test(value) ? value : parsed.href;
}

export function redactSignedUrl(value: string) {
  try {
    const parsed = new URL(resolveSafeHttpUrl(value));
    return `${parsed.origin}${parsed.pathname}${parsed.search ? "?[redacted]" : ""}${parsed.hash ? "#[redacted]" : ""}`;
  } catch {
    return "[invalid URL]";
  }
}

export async function uploadToSignedUrl({
  uploadUrl,
  method,
  fields = {},
  file,
  contentType = file.type,
  maxSizeBytes,
  signal,
  onProgress,
}: UploadOptions) {
  if (file.size > maxSizeBytes)
    throw new Error(
      `File exceeds ${Math.max(1, Math.ceil(maxSizeBytes / 1048576))} MB.`,
    );
  if (signal?.aborted)
    throw signal.reason ?? new DOMException("Upload cancelled.", "AbortError");

  const url = resolveSafeHttpUrl(uploadUrl);
  const verb = method.toUpperCase();
  let body: Blob | FormData;
  let header: string | undefined;
  if (verb === "PUT") {
    body = file;
    header = contentType || undefined;
  } else if (verb === "POST") {
    body = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === "string" || value instanceof Blob)
        body.append(key, value);
      else throw new Error("The signed upload fields are invalid.");
    }
    body.append("file", file);
  } else {
    throw new Error("The signed upload method is unsupported.");
  }

  if (onProgress && typeof XMLHttpRequest !== "undefined")
    return uploadWithProgress(url, verb, body, header, signal, onProgress);

  const response = await fetch(url, {
    method: verb,
    body,
    headers: header ? { "content-type": header } : undefined,
    credentials: "omit",
    referrerPolicy: "no-referrer",
    signal,
  });
  if (!response.ok) throw new Error(`Storage upload failed (${response.status}).`);
}

export function openSignedDownload(
  downloadUrl: string,
  options: { target?: "_blank" | "_self"; filename?: string } = {},
) {
  const anchor = document.createElement("a");
  anchor.href = resolveSafeHttpUrl(downloadUrl);
  anchor.target = options.target ?? "_blank";
  anchor.rel = "noopener noreferrer";
  if (options.filename) anchor.download = options.filename;
  anchor.click();
}

export async function downloadSignedFile(
  downloadUrl: string,
  filename = "download",
  options: { signal?: AbortSignal } = {},
) {
  const response = await fetch(resolveSafeHttpUrl(downloadUrl), {
    credentials: "omit",
    referrerPolicy: "no-referrer",
    signal: options.signal,
  });
  if (!response.ok) throw new Error(`File download failed (${response.status}).`);
  const objectUrl = URL.createObjectURL(await response.blob());
  try {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function uploadWithProgress(
  url: string,
  method: string,
  body: Blob | FormData,
  contentType: string | undefined,
  signal: AbortSignal | undefined,
  onProgress: (progress: UploadProgress) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const cleanup = () => signal?.removeEventListener("abort", abort);
    const abort = () => request.abort();
    request.open(method, url);
    if (contentType) request.setRequestHeader("content-type", contentType);
    request.upload.addEventListener("progress", (event) =>
      onProgress({
        loaded: event.loaded,
        total: event.lengthComputable ? event.total : undefined,
        percent:
          event.lengthComputable && event.total
            ? Math.round((event.loaded / event.total) * 100)
            : undefined,
      }),
    );
    request.addEventListener("load", () => {
      cleanup();
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error(`Storage upload failed (${request.status}).`));
    });
    request.addEventListener("error", () => {
      cleanup();
      reject(new Error("Storage upload failed."));
    });
    request.addEventListener("abort", () => {
      cleanup();
      reject(new DOMException("Upload cancelled.", "AbortError"));
    });
    signal?.addEventListener("abort", abort, { once: true });
    request.send(body);
  });
}
