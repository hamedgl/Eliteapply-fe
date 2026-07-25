import type { components } from "../../generated/api/schema";
import { apiRequest } from "./client";

export type Dashboard = components["schemas"]["DashboardResponse"];
export type Onboarding = components["schemas"]["OnboardingResponse"];
export type Capability = components["schemas"]["PlatformCapability"];
export type DashboardReadinessResponse = components["schemas"]["DashboardReadinessResponse"];
export type DashboardApplicationItem = components["schemas"]["DashboardApplicationItem"];

export const platformApi = {
  identity: () => apiRequest<Record<string, unknown>>("/platform/identity"),
  capabilities: () => apiRequest<Capability[]>("/platform/capabilities"),
  flag: (key: string) => apiRequest<Record<string, unknown>>(`/feature-flags/${encodeURIComponent(key)}`),
  onboarding: () => apiRequest<Onboarding>("/onboarding"),
  dashboard: () => apiRequest<Dashboard>("/dashboard"),
  dashboardReadiness: () => apiRequest<DashboardReadinessResponse>("/dashboard/readiness"),
};

export type DashboardDeadline = components["schemas"]["DashboardDeadlineItem"];
export type DashboardTaskSummary = components["schemas"]["DashboardTaskSummary"];
export type ProfileCompletionBreakdown = components["schemas"]["ProfileCompletionBreakdown"];

const count = (value: unknown) => (Number.isFinite(value) ? Math.max(0, Number(value)) : 0);

/** A deadline is only usable with a real date; anything else would render as "Invalid Date". */
function safeDeadline(value: unknown): DashboardDeadline | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.due_at !== "string" || Number.isNaN(new Date(v.due_at).getTime()))
    return null;
  return {
    application_id: typeof v.application_id === "string" ? v.application_id : "",
    application_title:
      typeof v.application_title === "string" && v.application_title.trim()
        ? v.application_title
        : "Application deadline",
    due_at: v.due_at,
    kind: (typeof v.kind === "string"
      ? v.kind
      : "application_deadline") as DashboardDeadline["kind"],
    requirement_id: typeof v.requirement_id === "string" ? v.requirement_id : null,
    task_id: typeof v.task_id === "string" ? v.task_id : null,
  };
}

export function safeDashboard(value: unknown): Dashboard {
  const v = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const openTasks = count(v.open_tasks);
  const tasks = (v.tasks ?? {}) as Record<string, unknown>;
  const completion = (v.profile_completion ?? {}) as Record<string, unknown>;
  const percent = Number.isFinite(v.profile_completion_percent) ? Math.max(0, Math.min(100, Number(v.profile_completion_percent))) : 0;
  return {
    applications_by_stage: v.applications_by_stage && typeof v.applications_by_stage === "object" ? v.applications_by_stage as Record<string, number> : {},
    upcoming_deadlines: Array.isArray(v.upcoming_deadlines) ? v.upcoming_deadlines.map(safeDeadline).filter((x): x is DashboardDeadline => x !== null) : [],
    missing_documents: count(v.missing_documents),
    open_tasks: openTasks,
    tasks: {
      total: count(tasks.total),
      // Falls back to the long-standing `open_tasks` so the field is never a lie.
      open: Number.isFinite(tasks.open) ? count(tasks.open) : openTasks,
      completed: count(tasks.completed),
      overdue: count(tasks.overdue),
    },
    profile_completion_percent: percent,
    profile_completion: {
      percent: Number.isFinite(completion.percent) ? Math.max(0, Math.min(100, Number(completion.percent))) : percent,
      sections: Array.isArray(completion.sections)
        ? (completion.sections.filter(
            (section) => section && typeof section === "object" && typeof (section as Record<string, unknown>).key === "string",
          ) as ProfileCompletionBreakdown["sections"])
        : [],
    },
    recommended_next_action: typeof v.recommended_next_action === "string" ? v.recommended_next_action : "Complete your academic profile",
  };
}
