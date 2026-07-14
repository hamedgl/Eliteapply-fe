import { openSignedDownload } from "./signedTransport";

export async function downloadResponse(response: Response, fallbackName: string) {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const disposition = response.headers.get("content-disposition") ?? "";
  const filename =
    disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1] ??
    disposition.match(/filename="?([^";]+)"?/i)?.[1] ??
    fallbackName;

  if (contentType.includes("application/json")) {
    const text = await response.text();
    const payload = JSON.parse(text) as Record<string, unknown>;
    const url = payload.download_url ?? payload.signed_url ?? payload.url;
    if (typeof url === "string") return openSignedDownload(url);
    return saveBlob(new Blob([text], { type: contentType }), filename);
  }

  if (contentType.startsWith("text/")) {
    const text = (await response.text()).trim();
    if (/^(https?:\/\/|\/)/i.test(text)) return openSignedDownload(text);
    return saveBlob(new Blob([text], { type: contentType }), filename);
  }

  return saveBlob(await response.blob(), filename);
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = decodeURIComponent(filename);
  anchor.click();
  URL.revokeObjectURL(url);
}
