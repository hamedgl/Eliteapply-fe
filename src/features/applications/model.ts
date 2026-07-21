import type { components } from "../../generated/api/schema";

type S = components["schemas"];
export type Application = S["ApplicationResponse"];

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
