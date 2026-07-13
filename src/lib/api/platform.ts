import type { components } from "../../generated/api/schema";
import { apiRequest } from "./client";

export type Dashboard = components["schemas"]["DashboardResponse"];
export type Onboarding = components["schemas"]["OnboardingResponse"];
export type Capability = components["schemas"]["PlatformCapability"];

export const platformApi = {
  identity: () => apiRequest<Record<string, unknown>>("/platform/identity"),
  capabilities: () => apiRequest<Capability[]>("/platform/capabilities"),
  flag: (key: string) => apiRequest<Record<string, unknown>>(`/feature-flags/${encodeURIComponent(key)}`),
  onboarding: () => apiRequest<Onboarding>("/onboarding"),
  dashboard: () => apiRequest<Dashboard>("/dashboard"),
};

export function safeDashboard(value: unknown): Dashboard {
  const v = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    applications_by_stage: v.applications_by_stage && typeof v.applications_by_stage === "object" ? v.applications_by_stage as Record<string, number> : {},
    upcoming_deadlines: Array.isArray(v.upcoming_deadlines) ? v.upcoming_deadlines.filter(x => x && typeof x === "object") as Record<string, unknown>[] : [],
    missing_documents: Number.isFinite(v.missing_documents) ? Number(v.missing_documents) : 0,
    open_tasks: Number.isFinite(v.open_tasks) ? Number(v.open_tasks) : 0,
    profile_completion_percent: Number.isFinite(v.profile_completion_percent) ? Math.max(0, Math.min(100, Number(v.profile_completion_percent))) : 0,
    recommended_next_action: typeof v.recommended_next_action === "string" ? v.recommended_next_action : "Complete your academic profile",
  };
}
