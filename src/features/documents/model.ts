import type { components } from "../../generated/api/schema";

type S = components["schemas"];
export type AcademicDocument = S["DocumentResponse"];

/** Categories the backend actually accepts (untyped string field — do not invent new ones). */
export const documentCategories = [
  "transcript",
  "degree_certificate",
  "test_score",
  "identity",
  "portfolio",
  "other",
] as const;

/** MIME types the signed-upload endpoint accepts, keyed by file extension. */
export const acceptedUploadTypes = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
} as const;

export const uploadAccept = ".pdf,.docx,.jpg,.jpeg,.png";

/**
 * `DocumentCreate.size_bytes` caps at 26214400 in openapi.json. The signed-upload
 * response also returns `max_size_bytes`, but only after a round-trip — checking
 * here lets a bulk queue reject oversized files before wasting N uploads.
 */
export const maxUploadBytes = 26_214_400;

/**
 * Browsers report an empty or wrong `type` for some files (notably .docx from
 * Explorer/Finder), which made otherwise-valid uploads fail. Fall back to the
 * extension and re-wrap the File so the rest of the pipeline sees a real MIME.
 */
export function normalizeUploadFile(file: File): File | null {
  const accepted: readonly string[] = Object.values(acceptedUploadTypes);
  if (accepted.includes(file.type)) return file;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const resolved = (acceptedUploadTypes as Record<string, string>)[extension];
  if (!resolved) return null;
  return new File([file], file.name, {
    type: resolved,
    lastModified: file.lastModified,
  });
}

export const formatBytes = (bytes: number) =>
  bytes < 1_048_576
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1_048_576).toFixed(1)} MB`;

export type ScanTone = "green" | "amber" | "red" | "neutral";

/** Maps the real malware_status vocabulary (clean/pending/scanning/rejected/failed) to a tone + plain-language label. */
export function scanStatus(malwareStatus: string): { tone: ScanTone; text: string } {
  const value = malwareStatus.toLowerCase();
  if (value === "clean") return { tone: "green", text: "Security scan complete" };
  if (value === "pending" || value === "scanning")
    return { tone: "amber", text: "Security scan in progress" };
  if (value === "rejected" || value === "failed")
    return { tone: "red", text: "Upload blocked" };
  return { tone: "neutral", text: malwareStatus };
}

export type ExpiryUrgency = "none" | "neutral" | "soon" | "warn" | "critical";

export function expiryInfo(value: string | null | undefined, now = new Date()) {
  if (!value) return { text: "Not set", urgency: "none" as ExpiryUrgency };
  const expires = new Date(value);
  const days = Math.round(
    (Date.UTC(expires.getUTCFullYear(), expires.getUTCMonth(), expires.getUTCDate()) -
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) /
      86_400_000,
  );
  const dateText = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(expires);
  if (days < 0)
    return {
      text: `Expired ${Math.abs(days)} day${days === -1 ? "" : "s"} ago`,
      urgency: "critical" as ExpiryUrgency,
    };
  if (days === 0) return { text: "Expires today", urgency: "critical" as ExpiryUrgency };
  if (days <= 30)
    return { text: `Expires in ${days} days`, urgency: "warn" as ExpiryUrgency };
  if (days <= 90)
    return { text: `Expires ${dateText}`, urgency: "soon" as ExpiryUrgency };
  return { text: `Expires ${dateText}`, urgency: "neutral" as ExpiryUrgency };
}
