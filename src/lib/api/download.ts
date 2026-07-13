export async function downloadResponse(response: Response, fallbackName: string) {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const disposition = response.headers.get("content-disposition") ?? "";
  const filename =
    disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1] ??
    disposition.match(/filename="?([^";]+)"?/i)?.[1] ??
    fallbackName;

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as Record<string, unknown>;
    const url = payload.download_url ?? payload.signed_url ?? payload.url;
    if (typeof url === "string") return openDownloadUrl(url);
    throw new Error("The download response did not include a file or signed URL.");
  }

  if (contentType.startsWith("text/")) {
    const text = (await response.text()).trim();
    if (/^https?:\/\//i.test(text)) return openDownloadUrl(text);
    return saveBlob(new Blob([text], { type: contentType }), filename);
  }

  return saveBlob(await response.blob(), filename);
}

function openDownloadUrl(value: string) {
  const url = new URL(value, window.location.origin);
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error("The download URL uses an unsupported protocol.");
  window.location.assign(url.href);
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = decodeURIComponent(filename);
  anchor.click();
  URL.revokeObjectURL(url);
}

