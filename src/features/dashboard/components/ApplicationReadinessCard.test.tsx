import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import {
  ApplicationReadinessCard,
  calculateDaysUntilDeadline,
  deriveReadinessState,
  normalizeApplicationHref,
  processApplicationReadiness,
  processDashboardReadinessItem,
  selectActiveReadinessApplications,
  sortReadinessItems,
  type ProcessedApplicationItem,
} from "./ApplicationReadinessCard";
import type { Application } from "../../applications/model";
import type { DashboardApplicationItem } from "../../../lib/api/platform";

// Mock track analytics module
vi.mock("../../../lib/analytics/track", () => ({
  track: vi.fn(),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockAppOxford: Application = {
  id: "app-oxford-123",
  title: "University of Oxford",
  application_type: "programme",
  institution_id: null,
  programme_id: null,
  scholarship_id: null,
  stage: "preparing",
  priority: "high",
  intake: null,
  source_url: null,
  notes: null,
  tags: [],
  submitted_at: null,
  pre_archive_stage: null,
  institution_display_name: "University of Oxford",
  programme_display_name: "MSc Computer Science",
  primary_deadline_at: new Date(Date.now() + 8 * 86_400_000).toISOString(),
  readiness_percent: 82,
  readiness: {
    overall_score: 82,
    overall_state: "in_progress",
    missing_required_documents: ["Motivation letter review"],
    blocking_issues: [],
    incomplete_requirements: [],
    unresolved_eligibility_issues: [],
    deadline_state: "upcoming",
    recommended_next_actions: ["Review motivation letter"],
  } as any,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  version: 1,
};

const mockAppErasmus: Application = {
  id: "app-erasmus-456",
  title: "Erasmus Mundus Scholarship",
  application_type: "scholarship",
  institution_id: null,
  programme_id: null,
  scholarship_id: null,
  stage: "preparing",
  priority: "critical",
  intake: null,
  source_url: null,
  notes: null,
  tags: [],
  submitted_at: null,
  pre_archive_stage: null,
  scholarship_display_name: "Erasmus Mundus Scholarship",
  primary_deadline_at: new Date(Date.now() + 14 * 86_400_000).toISOString(),
  readiness_percent: 64,
  readiness: {
    overall_score: 64,
    overall_state: "not_ready",
    missing_required_documents: ["Reference letter", "Transcript"],
    blocking_issues: [],
    incomplete_requirements: [],
    unresolved_eligibility_issues: [],
    deadline_state: "upcoming",
    recommended_next_actions: ["Upload reference letter"],
  } as any,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  version: 1,
};

const mockAppToronto: Application = {
  id: "app-toronto-789",
  title: "University of Toronto",
  application_type: "programme",
  institution_id: null,
  programme_id: null,
  scholarship_id: null,
  stage: "ready_to_submit",
  priority: "normal",
  intake: null,
  source_url: null,
  notes: null,
  tags: [],
  submitted_at: null,
  pre_archive_stage: null,
  institution_display_name: "University of Toronto",
  primary_deadline_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  readiness_percent: 100,
  readiness: {
    overall_score: 100,
    overall_state: "ready",
    missing_required_documents: [],
    blocking_issues: [],
    incomplete_requirements: [],
    unresolved_eligibility_issues: [],
    deadline_state: "none",
    recommended_next_actions: ["Submit application"],
  } as any,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  version: 1,
};

describe("ApplicationReadinessCard - Unit Functions", () => {
  it("normalizes hrefs cleanly and converts tab aliases to valid React Router routes", () => {
    expect(normalizeApplicationHref(null, "123")).toBe("/app/applications/123");
    expect(normalizeApplicationHref("/applications/123", "123")).toBe("/app/applications/123");
    expect(normalizeApplicationHref("/api/v1/applications/123/checklist", "123")).toBe("/app/applications/123/requirements");
    expect(normalizeApplicationHref("/applications/123/docs", "123")).toBe("/app/applications/123/documents");
    expect(normalizeApplicationHref("/applications/123/invalid-tab", "123")).toBe("/app/applications/123");
  });

  it("processes application into a normalized readiness item", () => {
    const fixedNow = new Date("2026-07-01T00:00:00Z");
    const item = processApplicationReadiness(mockAppOxford, fixedNow);
    expect(item).toMatchObject({
      id: "app-oxford-123",
      institutionName: "University of Oxford",
      programmeName: "MSc Computer Science",
      readinessPercentage: 82,
      primaryMissingRequirement: "Motivation letter review",
      missingRequirementsCount: 1,
      nextAction: {
        type: "continue_application",
        label: "Continue application",
        href: "/app/applications/app-oxford-123",
      },
    });
  });

  it("processes DashboardApplicationItem overlay from GET /api/v1/dashboard/readiness", () => {
    const fixedNow = new Date("2026-07-01T00:00:00Z");
    const dashboardItem: DashboardApplicationItem = {
      id: "app-backend-101",
      title: "Imperial College London",
      application_type: "programme",
      institution_id: "inst-1",
      programme_id: "prog-1",
      scholarship_id: null,
      stage: "preparing",
      priority: "high",
      intake: "Fall 2026",
      primary_deadline_at: "2026-07-15T00:00:00Z",
      source_url: null,
      notes: null,
      tags: [],
      version: 1,
      created_at: "2026-06-01T00:00:00Z",
      updated_at: "2026-06-10T00:00:00Z",
      institution_display_name: "Imperial College London",
      programme_display_name: "MSc Advanced Computing",
      readiness_percent: 75,
      readiness_state: "needs_attention",
      primary_missing_requirement: "1 Reference letter missing",
      recommended_action: {
        label: "Resolve 1 item",
        href: "/app/applications/app-backend-101",
      },
    };

    const processed = processDashboardReadinessItem(dashboardItem, fixedNow);
    expect(processed).toMatchObject({
      id: "app-backend-101",
      institutionName: "Imperial College London",
      programmeName: "MSc Advanced Computing",
      readinessPercentage: 75,
      readinessState: "needs_attention",
      primaryMissingRequirement: "1 Reference letter missing",
      nextAction: {
        type: "resolve_items",
        label: "Resolve 1 item",
        href: "/app/applications/app-backend-101",
      },
    });
  });

  it("calculates days until deadline accurately", () => {
    const fixedNow = new Date("2026-07-01T00:00:00Z");
    expect(calculateDaysUntilDeadline("2026-07-09T23:59:59Z", fixedNow)).toBe(8);
    expect(calculateDaysUntilDeadline("2026-06-30T12:00:00Z", fixedNow)).toBe(-1);
    expect(calculateDaysUntilDeadline("2026-07-01T15:00:00Z", fixedNow)).toBe(0);
    expect(calculateDaysUntilDeadline(null, fixedNow)).toBeNull();
  });

  it("derives readinessState correctly based on fallback rules", () => {
    const submittedApp = { ...mockAppOxford, stage: "submitted" };
    expect(deriveReadinessState(submittedApp, 5, 82, 1)).toBe("on_track");

    const hundredPercentApp = { ...mockAppOxford, stage: "preparing" };
    expect(deriveReadinessState(hundredPercentApp, 10, 100, 0)).toBe("ready");

    const overdueApp = { ...mockAppOxford, stage: "preparing" };
    expect(deriveReadinessState(overdueApp, -2, 50, 0)).toBe("overdue");

    const dueSoonApp = { ...mockAppOxford, stage: "preparing" };
    expect(deriveReadinessState(dueSoonApp, 5, 80, 0)).toBe("due_soon");

    const attentionApp = { ...mockAppOxford, stage: "preparing", priority: "critical" as const };
    expect(deriveReadinessState(attentionApp, 15, 60, 2)).toBe("needs_attention");

    const incompleteApp = { ...mockAppOxford, stage: "researching", primary_deadline_at: null };
    expect(deriveReadinessState(incompleteApp, null, 0, 0)).toBe("incomplete_setup");
  });

  it("sorts items by urgency: urgent deadline -> missing critical -> lowest readiness -> ready", () => {
    const item1: ProcessedApplicationItem = {
      id: "1",
      institutionName: "Toronto",
      programmeName: null,
      readinessPercentage: 100,
      deadline: "2026-08-30T00:00:00Z",
      daysUntilDeadline: 40,
      status: "ready_to_submit",
      readinessState: "ready",
      missingRequirementsCount: 0,
      primaryMissingRequirement: null,
      nextAction: { type: "review_submission", label: "Review submission", href: "/app/applications/1" },
    };

    const item2: ProcessedApplicationItem = {
      id: "2",
      institutionName: "Oxford",
      programmeName: "MSc CS",
      readinessPercentage: 82,
      deadline: "2026-07-10T00:00:00Z",
      daysUntilDeadline: 8,
      status: "preparing",
      readinessState: "needs_attention",
      missingRequirementsCount: 1,
      primaryMissingRequirement: "Motivation letter",
      nextAction: { type: "continue_application", label: "Continue application", href: "/app/applications/2" },
    };

    const item3: ProcessedApplicationItem = {
      id: "3",
      institutionName: "Erasmus",
      programmeName: null,
      readinessPercentage: 64,
      deadline: "2026-07-05T00:00:00Z",
      daysUntilDeadline: 3,
      status: "preparing",
      readinessState: "due_soon",
      missingRequirementsCount: 2,
      primaryMissingRequirement: "Reference letter",
      nextAction: { type: "resolve_items", label: "Resolve 2 items", href: "/app/applications/3" },
    };

    const sorted = sortReadinessItems([item1, item2, item3]);
    expect(sorted.map((i) => i.id)).toEqual(["3", "2", "1"]);
  });

  it("filters out submitted applications when unsubmitted ones exist", () => {
    const submittedApp: Application = { ...mockAppOxford, id: "sub-1", stage: "submitted" };
    const activeApps = selectActiveReadinessApplications([submittedApp, mockAppOxford]);
    expect(activeApps.map((a) => a.id)).toEqual([mockAppOxford.id]);
  });
});

describe("ApplicationReadinessCard - Component States", () => {
  it("renders loading skeleton state cleanly without layout shift", () => {
    renderWithProviders(
      <ApplicationReadinessCard isLoading={true} />,
    );

    expect(screen.getByText("Application readiness")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading application readiness…");
  });

  it("renders error state with retry action", () => {
    const handleRetry = vi.fn();
    renderWithProviders(
      <ApplicationReadinessCard isError={true} onRetry={handleRetry} />,
    );

    expect(screen.getByText("Couldn’t load application readiness")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /try again/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when no active applications exist", () => {
    renderWithProviders(
      <ApplicationReadinessCard applications={[]} />,
    );

    expect(screen.getByText("No active applications yet")).toBeInTheDocument();
    expect(
      screen.getByText("Add an application to start tracking readiness."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /add application/i })).toHaveAttribute(
      "href",
      "/app/applications",
    );
  });

  it("renders populated state with up to 3 applications, readiness rings, badges and CTAs", () => {
    renderWithProviders(
      <ApplicationReadinessCard
        applications={[mockAppOxford, mockAppErasmus, mockAppToronto]}
      />,
    );

    expect(screen.getByText("University of Oxford")).toBeInTheDocument();
    expect(screen.getByText("MSc Computer Science")).toBeInTheDocument();
    expect(screen.getByText("82%")).toBeInTheDocument();
    expect(screen.getByText("Missing: Motivation letter review")).toBeInTheDocument();
    expect(screen.getAllByText(/fix issues/i).length).toBeGreaterThan(0);

    expect(screen.getByText("Erasmus Mundus Scholarship")).toBeInTheDocument();
    expect(screen.getByText("64%")).toBeInTheDocument();

    expect(screen.getByText("University of Toronto")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("Ready to submit")).toBeInTheDocument();
    expect(screen.getByText(/review submission/i)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /view all applications/i })).toBeInTheDocument();
  });
});
