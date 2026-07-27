import type { components } from "../../generated/api/schema";
import type { BadgeTone } from "../../components/data-display/StatusBadge";

type S = components["schemas"];
export type Interview = S["AcademicInterviewResponse"];
export type InterviewTurn = S["InterviewTurnResponse"];
export type InterviewReport = S["InterviewReportResponse"];
export type InterviewType = S["AcademicInterviewCreate"]["interview_type"];
export type InterviewMode = NonNullable<S["AcademicInterviewCreate"]["mode"]>;

export const interviewTypes: { value: InterviewType; label: string; hint: string }[] = [
  { value: "undergraduate", label: "Undergraduate", hint: "First-degree admissions interview." },
  { value: "graduate", label: "Graduate", hint: "Master's or taught-postgraduate admissions." },
  { value: "mba", label: "MBA", hint: "Business school admissions and leadership focus." },
  { value: "phd_supervisor", label: "PhD supervisor", hint: "Research fit with a prospective supervisor." },
  { value: "scholarship_panel", label: "Scholarship panel", hint: "Funding panel with several interviewers." },
  { value: "research_fellowship", label: "Research fellowship", hint: "Fellowship or grant selection." },
  { value: "visa_credibility", label: "Visa credibility", hint: "Study-intent and credibility questions." },
  { value: "custom", label: "Custom", hint: "General practice across mixed question types." },
];

export const interviewModes: { value: InterviewMode; label: string; hint: string }[] = [
  { value: "chat", label: "Chat", hint: "Conversational turns, one question at a time." },
  { value: "written", label: "Written", hint: "Longer, considered written responses." },
  { value: "voice", label: "Voice", hint: "Record spoken answers; they are transcribed for feedback." },
];

const typeLabels = new Map(interviewTypes.map((item) => [item.value as string, item.label]));
const modeLabels = new Map(interviewModes.map((item) => [item.value as string, item.label]));

/** Server sends free-form strings here, so unknown values degrade to a readable form. */
export const interviewTypeLabel = (value: string) =>
  typeLabels.get(value) ?? value.replaceAll("_", " ");
export const interviewModeLabel = (value: string) =>
  modeLabels.get(value) ?? value.replaceAll("_", " ");

export const statusLabels: Record<string, string> = {
  ready: "Ready to start",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};
export const statusLabel = (value: string) =>
  statusLabels[value] ?? value.replaceAll("_", " ");

export const statusTone = (value: string): BadgeTone =>
  value === "completed" ? "green" : value === "cancelled" ? "grey" : value === "ready" ? "blue" : "violet";

export const isActive = (status: string) => !["completed", "cancelled"].includes(status);

/**
 * Questions are `unknown` in the schema (the service owns their shape). Returns
 * null rather than a placeholder: a missing question means "nothing left to
 * answer", and inventing prompt text hid exactly that state.
 */
export function questionText(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const text = record.question ?? record.prompt;
    if (typeof text === "string" && text.trim()) return text.trim();
  }
  return null;
}

export function questionCategory(value: unknown): string | null {
  if (value && typeof value === "object") {
    const category = (value as Record<string, unknown>).category;
    if (typeof category === "string" && category.trim())
      return category.replaceAll("_", " ");
  }
  return null;
}

/** The current question, or null once every question has been answered. */
export const currentQuestion = (interview: Interview) =>
  questionText(interview.current_question ?? interview.questions[interview.current_question_index]);

export const answeredCount = (interview: Interview) =>
  Math.min(interview.current_question_index, interview.questions.length);

export const questionTotal = (interview: Interview) => interview.questions.length;

export function progressPercent(interview: Interview) {
  const total = questionTotal(interview);
  if (!total) return interview.status === "completed" ? 100 : 0;
  return Math.round((answeredCount(interview) / total) * 100);
}

export const scoreCategoryLabels: Record<string, string> = {
  clarity: "Clarity",
  specificity: "Specificity",
  evidence: "Evidence",
  academic_motivation: "Academic motivation",
  programme_fit: "Programme fit",
  reflection: "Reflection",
  consistency: "Consistency",
};
/**
 * Also used for feedback list items: the AI evaluator returns sentences there
 * while the rule-based fallback returns score-category keys, and both read
 * correctly through this (unknown strings pass through unchanged).
 */
export const scoreCategoryLabel = (key: string) =>
  scoreCategoryLabels[key] ?? key.replaceAll("_", " ");

export const scoreTone = (score: number): BadgeTone =>
  score >= 75 ? "green" : score >= 55 ? "amber" : "red";

export type FeedbackBlock =
  | { kind: "list"; key: string; label: string; items: string[] }
  | { kind: "text"; key: string; label: string; text: string };

/**
 * Feedback is an open object. These keys are ordered deliberately; `disclaimer`
 * and `evaluation_source` are dropped because the disclaimer already sits in the
 * page header and repeating it under every answer was pure noise.
 */
const FEEDBACK_ORDER = ["strong_points", "improvements", "structure", "example_upgrade"];
const FEEDBACK_HIDDEN = new Set(["disclaimer", "evaluation_source"]);
const FEEDBACK_LABELS: Record<string, string> = {
  strong_points: "What worked",
  improvements: "What to improve",
  structure: "Structure",
  example_upgrade: "A stronger version",
};

const toText = (value: unknown) =>
  typeof value === "string"
    ? value.trim()
    : typeof value === "number" || typeof value === "boolean"
      ? String(value)
      : "";

export function feedbackBlocks(feedback: unknown): FeedbackBlock[] {
  if (!feedback || typeof feedback !== "object" || Array.isArray(feedback)) return [];
  const entries = Object.entries(feedback as Record<string, unknown>).filter(
    ([key]) => !FEEDBACK_HIDDEN.has(key),
  );
  entries.sort(([a], [b]) => {
    const rankA = FEEDBACK_ORDER.indexOf(a);
    const rankB = FEEDBACK_ORDER.indexOf(b);
    return (rankA < 0 ? FEEDBACK_ORDER.length : rankA) - (rankB < 0 ? FEEDBACK_ORDER.length : rankB);
  });
  const blocks: FeedbackBlock[] = [];
  for (const [key, value] of entries) {
    const label = FEEDBACK_LABELS[key] ?? key.replaceAll("_", " ");
    if (Array.isArray(value)) {
      const items = value.map(toText).filter(Boolean);
      if (items.length) blocks.push({ kind: "list", key, label, items });
      continue;
    }
    const text = toText(value);
    if (text) blocks.push({ kind: "text", key, label, text });
  }
  return blocks;
}

export type ContradictionWarning = { type: string; claim: string; reason: string };

export function warningList(value: unknown[]): ContradictionWarning[] {
  return value.flatMap((item) => {
    if (typeof item === "string")
      return [{ type: "unsupported", claim: item, reason: "" }];
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const claim = toText(record.claim);
    if (!claim) return [];
    const reason = toText(record.reason);
    return [
      {
        type: toText(record.type) || "unsupported",
        claim,
        // The rule-based evaluator emits machine codes here
        // (`not_found_in_submitted_context`) that just restate the type in
        // snake_case. Only the AI path's prose explanation adds anything.
        reason: reason.includes(" ") ? reason : "",
      },
    ];
  });
}

export const relativeTime = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diffMs / 60_000);
  const format = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (Math.abs(minutes) < 60) return format.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return format.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return format.format(-days, "day");
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
};
