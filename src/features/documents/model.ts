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
