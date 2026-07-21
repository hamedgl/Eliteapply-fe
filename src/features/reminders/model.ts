import type { components } from "../../generated/api/schema";

type S = components["schemas"];
export type Reminder = S["ReminderResponse"];

/** The only aggregate types the backend accepts. */
export const aggregateTypes = [
  "custom",
  "application",
  "requirement",
  "task",
  "reference",
  "interview",
] as const;

export const aggregateLabel: Record<(typeof aggregateTypes)[number], string> = {
  custom: "General",
  application: "Application",
  requirement: "Requirement",
  task: "Task",
  reference: "Reference",
  interview: "Interview",
};

/** Recurrence values the backend accepts — no "custom" option exists. */
export const recurrenceOptions = ["none", "daily", "weekly", "monthly"] as const;

export type RelativeUrgency = "overdue" | "today" | "soon" | "later";

export function relativeSchedule(scheduledAt: string, timezone: string, now = new Date()) {
  const date = new Date(scheduledAt);
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60_000);
  const dateText = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date);

  let urgency: RelativeUrgency;
  let relative: string;
  if (diffMinutes < 0) {
    urgency = "overdue";
    const hours = Math.abs(diffMinutes) / 60;
    relative =
      hours < 24
        ? `Overdue by ${Math.max(1, Math.round(hours))}h`
        : `Overdue by ${Math.round(hours / 24)}d`;
  } else if (diffMinutes < 60 * 24) {
    urgency = "today";
    relative = diffMinutes < 60 ? `In ${Math.max(1, diffMinutes)} min` : `Today, ${dateText.split(",").pop()?.trim()}`;
  } else if (diffMinutes < 60 * 24 * 7) {
    urgency = "soon";
    relative = `In ${Math.round(diffMinutes / (60 * 24))}d`;
  } else {
    urgency = "later";
    relative = dateText;
  }
  return { dateText, relative, urgency };
}

/** Offsets a deadline backwards by a preset amount, for "remind me N before" quick-fill. */
export function offsetBefore(deadlineIso: string, preset: "on" | "1d" | "3d" | "1w") {
  const date = new Date(deadlineIso);
  const days = preset === "on" ? 0 : preset === "1d" ? 1 : preset === "3d" ? 3 : 7;
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}
