import type { BadgeTone } from "../../components/data-display/StatusBadge";

/** Mirrors the backend's `NotificationCategory` literal (app/schemas/notifications.py). */
export const notificationCategories = [
  "application",
  "reference",
  "writing",
  "import",
  "interview",
  "billing",
  "security",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  application: "Applications",
  reference: "References",
  writing: "Writing Studio",
  import: "Opportunity imports",
  interview: "Interview practice",
  billing: "Billing & plan",
  security: "Account & security",
};

const CATEGORY_TONES: Record<string, BadgeTone> = {
  application: "blue",
  reference: "violet",
  writing: "indigo",
  import: "teal",
  interview: "amber",
  billing: "green",
  security: "red",
};

export function categoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? "General";
}

export function categoryTone(category: string): BadgeTone {
  return CATEGORY_TONES[category] ?? "grey";
}

const RELATIVE = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

/** "3 hours ago" style relative time — falls back to "just now" under a minute. */
export function relativeTime(iso: string, now = new Date()) {
  const seconds = (now.getTime() - new Date(iso).getTime()) / 1000;
  for (const [unit, secondsInUnit] of UNITS) {
    if (Math.abs(seconds) >= secondsInUnit) {
      return RELATIVE.format(-Math.round(seconds / secondsInUnit), unit);
    }
  }
  return "Just now";
}
