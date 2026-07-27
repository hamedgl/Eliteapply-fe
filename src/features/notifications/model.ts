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

const DAY_LABEL = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

/** Heading a notification belongs under: Today, Yesterday, or its date. */
export function dayBucket(iso: string, now = new Date()) {
  const date = new Date(iso);
  // Compare local midnights, not raw timestamps, or an item from yesterday
  // morning is less than 24h old and reads as "Today". Rounding absorbs the
  // ±1h a DST boundary puts between the two midnights.
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return DAY_LABEL.format(date);
}

/** Groups an already-sorted (newest first) list into day buckets, order preserved. */
export function groupByDay<T extends { created_at: string }>(items: T[], now = new Date()) {
  const buckets: { label: string; items: T[] }[] = [];
  for (const item of items) {
    const label = dayBucket(item.created_at, now);
    const last = buckets.at(-1);
    if (last?.label === label) last.items.push(item);
    else buckets.push({ label, items: [item] });
  }
  return buckets;
}
