import type { components } from "../../generated/api/schema";
import type { BadgeTone } from "../../components/data-display/StatusBadge";

type S = components["schemas"];
export type Reference = S["AcademicReferenceResponse"];
export type ReferenceEvent = S["ReferenceEventResponse"];

/**
 * Real status enum (confirmed in openapi.json). Note: the value is `invited`,
 * not `pending` — the backend never used `pending`. `opened` is not a status;
 * it only ever appears as the `invitation.opened` event in the timeline.
 */
export const referenceStatuses = ["invited", "approved", "declined", "expired", "cancelled", "revoked"] as const;
export type ReferenceStatus = (typeof referenceStatuses)[number];

export const terminalReferenceStatuses: ReadonlySet<string> = new Set([
  "approved",
  "declined",
  "expired",
  "cancelled",
  "revoked",
]);

export const referenceModes = ["referee_direct", "student_draft", "existing_upload"] as const;

export const referenceTypes = ["academic", "professional", "personal", "other"] as const;
export type ReferenceType = (typeof referenceTypes)[number];
const REFERENCE_TYPE_LABEL: Record<ReferenceType, string> = {
  academic: "Academic",
  professional: "Professional",
  personal: "Personal",
  other: "Other",
};
export function referenceTypeLabel(value: string) {
  return REFERENCE_TYPE_LABEL[value as ReferenceType] ?? value;
}

export const verificationLevels = ["unverified", "email_verified", "domain_verified", "document_verified"] as const;
const VERIFICATION_LEVEL_META: Record<(typeof verificationLevels)[number], { label: string; tone: BadgeTone }> = {
  unverified: { label: "Unverified", tone: "neutral" },
  email_verified: { label: "Email verified", tone: "blue" },
  domain_verified: { label: "Institution domain verified", tone: "teal" },
  document_verified: { label: "Document verified", tone: "green" },
};
export function verificationLevelMeta(level: string) {
  return VERIFICATION_LEVEL_META[level as (typeof verificationLevels)[number]] ?? { label: level, tone: "neutral" as BadgeTone };
}

const STATUS_META: Record<ReferenceStatus, { label: string; tone: BadgeTone }> = {
  invited: { label: "Invited", tone: "blue" },
  approved: { label: "Completed", tone: "green" },
  declined: { label: "Declined", tone: "red" },
  expired: { label: "Expired", tone: "amber" },
  cancelled: { label: "Cancelled", tone: "grey" },
  revoked: { label: "Revoked", tone: "grey" },
};

export function statusMeta(status: string) {
  return STATUS_META[status as ReferenceStatus] ?? { label: status, tone: "neutral" as BadgeTone };
}

const MODE_LABEL: Record<string, string> = {
  referee_direct: "Referee writes directly",
  student_draft: "Student draft",
  existing_upload: "Existing upload",
};

export function methodLabel(mode: string) {
  return MODE_LABEL[mode] ?? mode;
}

/** Every application this reference is linked to (original + attached), deduplicated. */
export function linkedApplicationIds(reference: Reference): string[] {
  return reference.application_ids?.length ? [...new Set(reference.application_ids)] : [reference.application_id];
}

/** Recommended next action per spec — one contextual action, not a list of technical metadata. */
export function nextAction(reference: Reference): string {
  switch (reference.status) {
    case "invited":
      return "Send reminder";
    case "approved":
      return reference.confidential ? "No action required" : "Review reference";
    case "declined":
      return "Replace referee";
    case "expired":
      return "Resend invitation";
    default:
      return "No action required";
  }
}

export type Visibility = "student_authored" | "referee_confidential" | "uploaded_document";

/** Derived from the real `mode`/`confidential` fields — never invents a verification level. */
export function describeVisibility(reference: Reference): { kind: Visibility; label: string; description: string } {
  if (reference.mode === "existing_upload") {
    return {
      kind: "uploaded_document",
      label: "Uploaded official reference",
      description: "An existing document was attached instead of a new letter being written.",
    };
  }
  if (reference.confidential) {
    return {
      kind: "referee_confidential",
      label: "Confidential reference",
      description:
        "The final reference content is visible only to authorised recipients and is not shown to the student.",
    };
  }
  return {
    kind: "student_authored",
    label: "Student can review",
    description: "The student authored or can view this reference's content directly.",
  };
}

function daysFromNow(value: string, now = new Date()) {
  const target = new Date(value);
  const dayMs = 86_400_000;
  return Math.ceil(
    (Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate()) -
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) /
      dayMs,
  );
}

/** "Sent 2 days ago" / "Due in 3 days" / "3 days overdue" style copy for the list row. */
export function describeElapsed(createdAt: string, now = new Date()) {
  const days = -daysFromNow(createdAt, now);
  if (days <= 0) return "Sent today";
  if (days === 1) return "Sent 1 day ago";
  return `Sent ${days} days ago`;
}

export function describeDue(expiresAt: string, now = new Date()) {
  const days = daysFromNow(expiresAt, now);
  if (days < 0) return { text: `${Math.abs(days)} day${days === -1 ? "" : "s"} overdue`, urgent: true };
  if (days === 0) return { text: "Due today", urgent: true };
  if (days <= 3) return { text: `Due in ${days} day${days === 1 ? "" : "s"}`, urgent: true };
  return { text: `Due in ${days} days`, urgent: false };
}

export type ReferenceFilters = {
  search: string;
  status: string;
  mode: string;
  referenceType: string;
  applicationId: string;
  applicationName: string;
  institution: string;
  role: string;
  visibility: string;
  requestedFrom: string;
  requestedTo: string;
  dueFrom: string;
  dueTo: string;
  includeRevoked: boolean;
};

export const emptyReferenceFilters: ReferenceFilters = {
  search: "",
  status: "",
  mode: "",
  referenceType: "",
  applicationId: "",
  applicationName: "",
  institution: "",
  role: "",
  visibility: "",
  requestedFrom: "",
  requestedTo: "",
  dueFrom: "",
  dueTo: "",
  includeRevoked: true,
};

/**
 * The list endpoint only accepts `status` + `cursor` server-side, so every
 * other filter is applied client-side over whatever pages are already
 * loaded.
 */
export function applyReferenceFilters(items: Reference[], filters: ReferenceFilters): Reference[] {
  const search = filters.search.trim().toLowerCase();
  return items.filter((item) => {
    if (!filters.includeRevoked && item.status === "revoked") return false;
    if (filters.status && !filters.status.split(",").includes(item.status)) return false;
    if (filters.mode && item.mode !== filters.mode) return false;
    if (filters.referenceType && item.reference_type !== filters.referenceType) return false;
    if (filters.applicationId && !linkedApplicationIds(item).includes(filters.applicationId)) return false;
    if (filters.institution && !(item.institution ?? "").toLowerCase().includes(filters.institution.toLowerCase()))
      return false;
    if (filters.role && item.referee_role !== filters.role) return false;
    if (filters.visibility && describeVisibility(item).kind !== filters.visibility) return false;
    if (filters.requestedFrom && item.created_at < filters.requestedFrom) return false;
    if (filters.requestedTo && item.created_at > `${filters.requestedTo}T23:59:59`) return false;
    if (filters.dueFrom && item.expires_at < filters.dueFrom) return false;
    if (filters.dueTo && item.expires_at > `${filters.dueTo}T23:59:59`) return false;
    if (
      search &&
      !`${item.referee_name} ${item.referee_role} ${item.institution ?? ""}`.toLowerCase().includes(search)
    )
      return false;
    return true;
  });
}

export type FilterChip = { key: string; text: string };

export function buildReferenceFilterChips(filters: ReferenceFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  if (filters.status)
    chips.push({
      key: "status",
      text: `Status: ${filters.status
        .split(",")
        .map((value) => statusMeta(value).label)
        .join(" or ")}`,
    });
  if (filters.mode) chips.push({ key: "mode", text: `Method: ${methodLabel(filters.mode)}` });
  if (filters.referenceType)
    chips.push({ key: "referenceType", text: `Type: ${referenceTypeLabel(filters.referenceType)}` });
  if (filters.applicationId) chips.push({ key: "applicationId", text: `Application: ${filters.applicationName}` });
  if (filters.institution) chips.push({ key: "institution", text: `Institution: ${filters.institution}` });
  if (filters.role) chips.push({ key: "role", text: `Role: ${filters.role}` });
  if (filters.visibility)
    chips.push({
      key: "visibility",
      text: `Privacy: ${
        filters.visibility === "student_authored"
          ? "Student can review"
          : filters.visibility === "referee_confidential"
            ? "Confidential"
            : "Uploaded document"
      }`,
    });
  if (filters.requestedFrom) chips.push({ key: "requestedFrom", text: `Requested after ${filters.requestedFrom}` });
  if (filters.requestedTo) chips.push({ key: "requestedTo", text: `Requested before ${filters.requestedTo}` });
  if (filters.dueFrom) chips.push({ key: "dueFrom", text: `Due after ${filters.dueFrom}` });
  if (filters.dueTo) chips.push({ key: "dueTo", text: `Due before ${filters.dueTo}` });
  if (!filters.includeRevoked) chips.push({ key: "includeRevoked", text: "Excluding revoked" });
  return chips;
}
