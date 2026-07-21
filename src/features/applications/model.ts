import type { components } from "../../generated/api/schema";

type S = components["schemas"];
export type Application = S["ApplicationResponse"];
export type ApplicationReadinessSummary = S["ApplicationReadinessSummary"];

/** Every stage the system knows about, in pipeline order. */
export const stages = [
  "researching",
  "shortlisted",
  "preparing",
  "waiting_for_documents",
  "waiting_for_reference",
  "ready_to_submit",
  "submitted",
  "under_review",
  "interview",
  "waitlisted",
  "offered",
  "awarded",
  "rejected",
  "withdrawn",
  "expired",
  "archived",
] as const;

/**
 * The five core stages always visible on the board, even when empty.
 * Additional stages appear only when they contain at least one application.
 */
export const PRIMARY_STAGES: ReadonlySet<string> = new Set<string>([
  "researching",
  "preparing",
  "waiting_for_documents",
  "submitted",
  "under_review",
]);

export const priorities = ["low", "normal", "high", "critical"] as const;
export const types = ["programme", "scholarship", "fellowship", "grant"] as const;

/** Stages after which a deadline is historical rather than actionable. */
const SETTLED_STAGES = new Set<string>([
  "submitted",
  "under_review",
  "interview",
  "waitlisted",
  "offered",
  "awarded",
  "rejected",
  "withdrawn",
  "expired",
  "archived",
]);

/** Stages that no longer count toward an "active" application. */
export const INACTIVE_STAGES = new Set<string>([
  "rejected",
  "withdrawn",
  "expired",
  "archived",
]);

export type StageTone =
  | "neutral"
  | "blue"
  | "violet"
  | "teal"
  | "indigo"
  | "amber"
  | "green"
  | "red"
  | "grey";

/** Semantic colour + icon key per stage, used for the stage pill. */
export const STAGE_TONE: Record<string, StageTone> = {
  researching: "neutral",
  shortlisted: "violet",
  preparing: "blue",
  waiting_for_documents: "blue",
  waiting_for_reference: "amber",
  ready_to_submit: "teal",
  submitted: "indigo",
  under_review: "indigo",
  interview: "amber",
  waitlisted: "amber",
  offered: "green",
  awarded: "green",
  rejected: "red",
  withdrawn: "grey",
  expired: "grey",
  archived: "grey",
};

export const label = (value: string) =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (x) => x.toUpperCase());

export const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(new Date(value))
    : "No deadline";

export type DeadlineUrgency =
  | "none"
  | "muted"
  | "neutral"
  | "soon"
  | "warn"
  | "critical";

export type Deadline = {
  primary: string;
  secondary: string | null;
  urgency: DeadlineUrgency;
};

/** Human-friendly deadline text plus an urgency tone for styling. */
export function deadlineInfo(
  value: string | null,
  stage: string,
  now = new Date(),
): Deadline {
  if (!value) return { primary: "Not set", secondary: null, urgency: "none" };
  const primary = formatDate(value);
  if (SETTLED_STAGES.has(stage))
    return { primary, secondary: null, urgency: "muted" };
  const deadline = new Date(value);
  const dayMs = 86_400_000;
  const days = Math.ceil(
    (Date.UTC(
      deadline.getUTCFullYear(),
      deadline.getUTCMonth(),
      deadline.getUTCDate(),
    ) -
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) /
      dayMs,
  );
  if (days < 0)
    return {
      primary,
      secondary: `${Math.abs(days)} day${days === -1 ? "" : "s"} overdue`,
      urgency: "critical",
    };
  if (days === 0)
    return { primary, secondary: "Due today", urgency: "critical" };
  if (days <= 6)
    return { primary, secondary: `Due in ${days} day${days === 1 ? "" : "s"}`, urgency: "warn" };
  if (days <= 14)
    return { primary, secondary: `Due in ${days} days`, urgency: "soon" };
  return { primary, secondary: null, urgency: "neutral" };
}

export function parseBoard(
  value: unknown,
): S["ApplicationBoardResponse"] {
  const v =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const raw =
    v.columns && typeof v.columns === "object"
      ? (v.columns as Record<string, unknown>)
      : {};
  const columns: Record<string, Application[]> = {};
  for (const stage of stages)
    columns[stage] = Array.isArray(raw[stage])
      ? raw[stage].filter(isApplication)
      : [];
  return {
    columns,
    total: Number.isInteger(v.total)
      ? Number(v.total)
      : Object.values(columns).reduce((n, x) => n + x.length, 0),
  };
}

function isApplication(v: unknown): v is Application {
  return Boolean(
    v &&
      typeof v === "object" &&
      typeof (v as Record<string, unknown>).id === "string" &&
      typeof (v as Record<string, unknown>).title === "string" &&
      typeof (v as Record<string, unknown>).version === "number",
  );
}
