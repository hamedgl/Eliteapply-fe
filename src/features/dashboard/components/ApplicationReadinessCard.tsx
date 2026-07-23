import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { track } from "../../../lib/analytics/track";
import { applicationsApi, intelligenceApi } from "../../../lib/api/phase2";
import { platformApi, type DashboardApplicationItem } from "../../../lib/api/platform";
import { queryKeys } from "../../../lib/api/queryKeys";
import type { Application } from "../../applications/model";
import { resolveWorkspaceTab } from "../../applications/ApplicationWorkspace";
import { useApplicationReadiness } from "../../applications/hooks";

export type ReadinessState =
  | "ready"
  | "on_track"
  | "needs_attention"
  | "due_soon"
  | "overdue"
  | "incomplete_setup";

export type NextAction = {
  type: "continue_application" | "resolve_items" | "review_submission";
  label: string;
  href: string;
};

export type ProcessedApplicationItem = {
  id: string;
  institutionName: string;
  programmeName: string | null;
  readinessPercentage: number;
  deadline: string | null;
  daysUntilDeadline: number | null;
  status: string;
  readinessState: ReadinessState;
  missingRequirementsCount: number;
  primaryMissingRequirement: string | null;
  nextAction: NextAction;
};

export type ApplicationReadinessCardProps = {
  readinessItems?: DashboardApplicationItem[];
  applications?: Application[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

/**
 * Calculates days remaining until a deadline (UTC comparison).
 */
export function calculateDaysUntilDeadline(
  deadlineIso: string | null | undefined,
  now = new Date(),
): number | null {
  if (!deadlineIso) return null;
  const deadlineDate = new Date(deadlineIso);
  if (Number.isNaN(deadlineDate.getTime())) return null;
  const dayMs = 86_400_000;
  return Math.ceil(
    (Date.UTC(
      deadlineDate.getUTCFullYear(),
      deadlineDate.getUTCMonth(),
      deadlineDate.getUTCDate(),
    ) -
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) /
      dayMs,
  );
}

/**
 * Derives readiness state using explicit frontend rules when backend readinessState is missing.
 */
export function deriveReadinessState(
  app: Application,
  daysUntilDeadline: number | null,
  readinessPercentage: number,
  missingRequirementsCount: number,
  hasCriticalRequirementMissing = false,
): ReadinessState {
  const isSubmitted =
    app.stage === "submitted" ||
    app.stage === "under_review" ||
    Boolean(app.submitted_at);

  if (isSubmitted) {
    return "on_track";
  }

  if (readinessPercentage >= 100) {
    return "ready";
  }

  if (daysUntilDeadline !== null && daysUntilDeadline < 0) {
    return "overdue";
  }

  if (daysUntilDeadline !== null && daysUntilDeadline <= 7) {
    return "due_soon";
  }

  const readiness = app.readiness as ExtendedReadinessSummary | null | undefined;
  if (
    hasCriticalRequirementMissing ||
    app.priority === "critical" ||
    readiness?.overall_state === "blocked" ||
    readiness?.overall_state === "not_ready" ||
    (readiness?.blocking_issues?.length ?? 0) > 0 ||
    missingRequirementsCount > 0
  ) {
    return "needs_attention";
  }

  if (readinessPercentage === 0 && !app.primary_deadline_at) {
    return "incomplete_setup";
  }

  return "on_track";
}

/**
 * Normalizes an application route to ensure it matches React Router paths and valid tab resources.
 */
export function normalizeApplicationHref(
  rawHref: string | null | undefined,
  applicationId: string,
): string {
  const fallback = `/app/applications/${applicationId}`;
  if (!rawHref) return fallback;

  let href = rawHref.trim();
  if (href.startsWith("/api/v1")) {
    href = href.replace("/api/v1", "");
  }
  if (href.startsWith("/applications/")) {
    href = `/app${href}`;
  }
  if (!href.startsWith("/app/applications/")) {
    return fallback;
  }

  const relativePath = href.replace("/app/applications/", "");
  const parts = relativePath.split("/").filter(Boolean);

  if (parts.length > 1) {
    const rawResource = parts[1];
    const tab = resolveWorkspaceTab(rawResource);
    return tab === "overview"
      ? `/app/applications/${applicationId}`
      : `/app/applications/${applicationId}/${tab}`;
  }

  return `/app/applications/${applicationId}`;
}

/**
 * Processes a DashboardApplicationItem from GET /api/v1/dashboard/readiness.
 */
export function processDashboardReadinessItem(
  item: DashboardApplicationItem,
  now = new Date(),
): ProcessedApplicationItem {
  const daysUntilDeadline = calculateDaysUntilDeadline(
    item.primary_deadline_at,
    now,
  );
  const readinessPercentage = Math.max(
    0,
    Math.min(100, item.readiness_percent ?? item.readiness?.overall_score ?? 0),
  );

  const institutionName =
    item.institution_display_name ||
    item.institution_name ||
    item.title ||
    "Untitled Application";

  const rawProgrammeName =
    item.programme_display_name ||
    item.programme_name ||
    item.scholarship_display_name ||
    item.scholarship_name ||
    (item.application_type && item.application_type !== "institution"
      ? item.title
      : null);

  const programmeName =
    rawProgrammeName && rawProgrammeName !== institutionName
      ? rawProgrammeName
      : null;

  const readinessState = (item.readiness_state ?? "on_track") as ReadinessState;
  const primaryMissingRequirement = item.primary_missing_requirement ?? null;

  const href = normalizeApplicationHref(item.recommended_action?.href, item.id);
  const label = item.recommended_action?.label || "Continue application";
  let actionType: NextAction["type"] = "continue_application";
  if (label.toLowerCase().includes("review")) {
    actionType = "review_submission";
  } else if (
    label.toLowerCase().includes("resolve") ||
    primaryMissingRequirement
  ) {
    actionType = "resolve_items";
  }

  return {
    id: item.id,
    institutionName,
    programmeName,
    readinessPercentage,
    deadline: item.primary_deadline_at ?? null,
    daysUntilDeadline,
    status: item.stage,
    readinessState,
    missingRequirementsCount: primaryMissingRequirement ? 1 : 0,
    primaryMissingRequirement,
    nextAction: {
      type: actionType,
      label,
      href,
    },
  };
}

/**
 * Maps application data into a normalized readiness item for display.
 */
type ExtendedReadinessSummary = {
  overall_score?: number;
  overall_state?: "not_ready" | "in_progress" | "ready" | "blocked";
  missing_required_documents?: string[];
  blocking_issues?: string[];
  incomplete_requirements?: string[];
};

export function processApplicationReadiness(
  app: Application,
  now = new Date(),
): ProcessedApplicationItem {
  const daysUntilDeadline = calculateDaysUntilDeadline(
    app.primary_deadline_at,
    now,
  );
  const readiness = app.readiness as ExtendedReadinessSummary | null | undefined;
  const readinessPercentage = Math.max(
    0,
    Math.min(
      100,
      app.readiness_percent ?? readiness?.overall_score ?? 0,
    ),
  );

  const missingDocs = readiness?.missing_required_documents ?? [];
  const blockingIssues = readiness?.blocking_issues ?? [];
  const incompleteReqs = readiness?.incomplete_requirements ?? [];
  const allMissing = [...blockingIssues, ...missingDocs, ...incompleteReqs];

  const missingRequirementsCount = allMissing.length;
  const primaryMissingRequirement = allMissing[0] ?? null;

  const readinessState = deriveReadinessState(
    app,
    daysUntilDeadline,
    readinessPercentage,
    missingRequirementsCount,
    blockingIssues.length > 0,
  );

  const institutionName =
    app.institution_display_name ||
    app.institution_name ||
    app.title ||
    "Untitled Application";

  const rawProgrammeName =
    app.programme_display_name ||
    app.programme_name ||
    app.scholarship_display_name ||
    app.scholarship_name ||
    (app.application_type && app.application_type !== "institution"
      ? app.title
      : null);

  const programmeName =
    rawProgrammeName && rawProgrammeName !== institutionName
      ? rawProgrammeName
      : null;

  let nextAction: NextAction;
  if (readinessState === "ready") {
    nextAction = {
      type: "review_submission",
      label: "Review submission",
      href: `/app/applications/${app.id}`,
    };
  } else if (missingRequirementsCount > 1) {
    nextAction = {
      type: "resolve_items",
      label: `Resolve ${missingRequirementsCount} items`,
      href: `/app/applications/${app.id}`,
    };
  } else {
    nextAction = {
      type: "continue_application",
      label: "Continue application",
      href: `/app/applications/${app.id}`,
    };
  }

  return {
    id: app.id,
    institutionName,
    programmeName,
    readinessPercentage,
    deadline: app.primary_deadline_at ?? null,
    daysUntilDeadline,
    status: app.stage,
    readinessState,
    missingRequirementsCount,
    primaryMissingRequirement,
    nextAction,
  };
}

/**
 * Sorts processed readiness items based on business priority:
 * 1. Urgent deadline (overdue first, then due_soon sorted by days ascending)
 * 2. Missing critical requirements (needs_attention)
 * 3. Lowest readiness score
 * 4. Ready-to-submit applications
 */
export function sortReadinessItems(
  items: ProcessedApplicationItem[],
): ProcessedApplicationItem[] {
  return [...items].sort((a, b) => {
    const getRank = (item: ProcessedApplicationItem) => {
      if (item.readinessState === "overdue") return 1;
      if (item.readinessState === "due_soon") return 2;
      if (item.readinessState === "needs_attention") return 3;
      if (item.readinessState === "incomplete_setup") return 4;
      if (item.readinessState === "on_track") return 5;
      if (item.readinessState === "ready") return 6;
      return 7;
    };

    const rankA = getRank(a);
    const rankB = getRank(b);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // Tie-breakers:
    // If both have deadlines, nearest deadline first
    if (a.daysUntilDeadline !== null && b.daysUntilDeadline !== null) {
      if (a.daysUntilDeadline !== b.daysUntilDeadline) {
        return a.daysUntilDeadline - b.daysUntilDeadline;
      }
    } else if (a.daysUntilDeadline !== null) {
      return -1;
    } else if (b.daysUntilDeadline !== null) {
      return 1;
    }

    // Lowest readiness percentage first
    if (a.readinessPercentage !== b.readinessPercentage) {
      return a.readinessPercentage - b.readinessPercentage;
    }

    // Alphabetical as stable fallback
    return a.institutionName.localeCompare(b.institutionName);
  });
}

/**
 * Filters out submitted applications unless no active unsubmitted applications exist.
 */
export function selectActiveReadinessApplications(
  apps: Application[],
): Application[] {
  const activeUnsubmitted = apps.filter(
    (app) =>
      app.stage !== "submitted" &&
      app.stage !== "under_review" &&
      app.stage !== "rejected" &&
      app.stage !== "withdrawn" &&
      app.stage !== "expired" &&
      app.stage !== "archived" &&
      !app.submitted_at,
  );

  if (activeUnsubmitted.length > 0) {
    return activeUnsubmitted;
  }

  // Fallback if all are submitted or settled: return unarchived applications
  return apps.filter((app) => app.stage !== "archived");
}

export function ApplicationReadinessCard({
  readinessItems: externalReadinessItems,
  applications: externalApps,
  isLoading: externalIsLoading,
  isError: externalIsError,
  onRetry: externalOnRetry,
}: ApplicationReadinessCardProps) {
  const navigate = useNavigate();

  // Primary Query: GET /api/v1/dashboard/readiness
  const readinessQuery = useQuery({
    queryKey: queryKeys.dashboardReadiness,
    queryFn: () => platformApi.dashboardReadiness(),
    enabled:
      externalReadinessItems === undefined &&
      externalApps === undefined &&
      externalIsLoading === undefined &&
      externalIsError === undefined,
    staleTime: 60_000,
  });

  // Fallback Query: GET /api/v1/applications if readiness endpoint is empty or errors
  const fallbackQuery = useQuery({
    queryKey: queryKeys.applications,
    queryFn: async () => {
      const res = await applicationsApi.list({ limit: 50 });
      return res.items;
    },
    enabled:
      externalReadinessItems === undefined &&
      externalApps === undefined &&
      externalIsLoading === undefined &&
      externalIsError === undefined &&
      (readinessQuery.isError ||
        (readinessQuery.isSuccess &&
          (!readinessQuery.data?.items ||
            readinessQuery.data.items.length === 0))),
    staleTime: 60_000,
  });

  const backendItems = externalReadinessItems ?? readinessQuery.data?.items;
  const apps = externalApps ?? fallbackQuery.data ?? [];

  const isError = Boolean(
    externalIsError ??
      (externalReadinessItems === undefined &&
        externalApps === undefined &&
        (readinessQuery.isError && (fallbackQuery.isError || !fallbackQuery.data))),
  );

  const isLoading = Boolean(
    externalIsLoading ??
      (externalReadinessItems === undefined &&
        externalApps === undefined &&
        !isError &&
        (readinessQuery.isPending ||
          (readinessQuery.isSuccess &&
            (!backendItems || backendItems.length === 0) &&
            fallbackQuery.isPending))),
  );

  const refetch =
    externalOnRetry ??
    (() => {
      void readinessQuery.refetch();
      void fallbackQuery.refetch();
    });

  const processedItems = useMemo(() => {
    if (backendItems && backendItems.length > 0) {
      return backendItems
        .slice(0, 3)
        .map((item) => processDashboardReadinessItem(item));
    }

    if (!apps.length) return [];
    const activeApps = selectActiveReadinessApplications(apps);
    const items = activeApps.map((app) => processApplicationReadiness(app));
    const sorted = sortReadinessItems(items);
    return sorted.slice(0, 3);
  }, [backendItems, apps]);

  const handleViewAllClick = () => {
    void track("dashboard_readiness_view_all_clicked", {
      surface: "dashboard_readiness_card",
    });
  };

  const handleItemClick = (item: ProcessedApplicationItem) => {
    void track("dashboard_readiness_application_clicked", {
      applicationId: item.id,
      readinessState: item.readinessState,
      readinessPercent: item.readinessPercentage,
    });
  };

  return (
    <section
      className="dashboard-surface app-readiness-card"
      aria-labelledby="app-readiness-title"
    >
      <header className="app-readiness-header">
        <h2 id="app-readiness-title">
          <Sparkles className="app-readiness-header-icon" aria-hidden="true" />
          Application readiness
        </h2>
        <Link
          to="/app/applications?view=list&sort=readiness_asc"
          className="app-readiness-view-all"
          onClick={handleViewAllClick}
        >
          View all <ArrowRight aria-hidden="true" />
        </Link>
      </header>

      <div className="app-readiness-body">
        {isLoading ? (
          <div className="app-readiness-skeleton-container" aria-busy="true">
            <p className="sr-only" role="status">
              Loading application readiness…
            </p>
            {[1, 2, 3].map((i) => (
              <div key={i} className="app-readiness-skeleton-row">
                <div className="skeleton app-readiness-skeleton-circle" />
                <div className="app-readiness-skeleton-text">
                  <div className="skeleton app-readiness-skeleton-line short" />
                  <div className="skeleton app-readiness-skeleton-line long" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="app-readiness-error" role="alert">
            <p>Couldn’t load application readiness</p>
            <button
              type="button"
              className="secondary"
              onClick={refetch}
            >
              <RotateCw aria-hidden="true" /> Try again
            </button>
          </div>
        ) : processedItems.length === 0 ? (
          <div className="app-readiness-empty">
            <div className="app-readiness-empty-icon" aria-hidden="true">
              <FolderKanban />
            </div>
            <strong>No active applications yet</strong>
            <p>Add an application to start tracking readiness.</p>
            <Link to="/app/applications" className="primary app-readiness-add-btn">
              Add application <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <ul className="app-readiness-list">
            {processedItems.map((item) => (
              <ApplicationReadinessRow
                key={item.id}
                item={item}
                onItemClick={handleItemClick}
              />
            ))}
          </ul>
        )}
      </div>

      {!isLoading && !isError && processedItems.length > 0 ? (
        <footer className="app-readiness-footer">
          <Link
            to="/app/applications?view=list&sort=readiness_asc"
            className="app-readiness-footer-link"
            onClick={handleViewAllClick}
          >
            View all applications <ArrowRight aria-hidden="true" size={14} />
          </Link>
        </footer>
      ) : null}
    </section>
  );
}

function ApplicationReadinessRow({
  item,
  onItemClick,
}: {
  item: ProcessedApplicationItem;
  onItemClick: (item: ProcessedApplicationItem) => void;
}) {
  const readinessQuery = useApplicationReadiness(item.id, Boolean(item.id));
  const eligibilityQuery = useQuery({
    queryKey: queryKeys.eligibility(item.id),
    queryFn: () => intelligenceApi.currentEligibility(item.id),
    enabled: Boolean(item.id),
    retry: false,
    staleTime: 60_000,
  });

  const readinessData = readinessQuery.data;
  const eligibilityData = eligibilityQuery.data;

  const percentage =
    eligibilityData?.readiness_score !== undefined
      ? Math.max(0, Math.min(100, eligibilityData.readiness_score))
      : readinessData?.readiness_percent !== undefined
        ? readinessData.readiness_percent
        : ((readinessData as any)?.overall_score ?? item.readinessPercentage);

  const missingReq =
    readinessData?.blocking_issues?.[0] ??
    readinessData?.missing_required_documents?.[0] ??
    readinessData?.incomplete_requirements?.[0] ??
    item.primaryMissingRequirement;

  const isSubmitted = item.status === "submitted" || item.status === "under_review";
  const state: ReadinessState = isSubmitted
    ? "on_track"
    : percentage >= 100
      ? "ready"
      : item.daysUntilDeadline !== null && item.daysUntilDeadline < 0
        ? "overdue"
        : item.daysUntilDeadline !== null && item.daysUntilDeadline <= 7
          ? "due_soon"
          : (readinessData?.blocking_issues?.length ||
             readinessData?.missing_required_documents?.length ||
             missingReq)
            ? "needs_attention"
            : "on_track";

  const actionLabel =
    state === "ready"
      ? "Review submission"
      : missingReq
        ? "Fix Issues"
        : item.nextAction.label;

  return (
    <li className="app-readiness-item-wrap">
      <Link
        to={item.nextAction.href}
        className="app-readiness-item"
        onClick={() => onItemClick(item)}
      >
        <CircularReadinessRing percentage={percentage} state={state} />

        <div className="app-readiness-content">
          <div className="app-readiness-title-row">
            <span
              className="app-readiness-institution"
              title={item.institutionName}
            >
              {item.institutionName}
            </span>
            <ReadinessBadge state={state} />
          </div>

          {item.programmeName ? (
            <div
              className="app-readiness-programme"
              title={item.programmeName}
            >
              {item.programmeName}
            </div>
          ) : null}

          <div className="app-readiness-meta-row">
            {item.daysUntilDeadline !== null ? (
              <span className="app-readiness-deadline">
                <CalendarDays aria-hidden="true" size={12} />
                {item.daysUntilDeadline < 0
                  ? `Overdue by ${Math.abs(item.daysUntilDeadline)} day${
                      Math.abs(item.daysUntilDeadline) === 1 ? "" : "s"
                    }`
                  : item.daysUntilDeadline === 0
                  ? "Due today"
                  : `Deadline in ${item.daysUntilDeadline} day${
                      item.daysUntilDeadline === 1 ? "" : "s"
                    }`}
              </span>
            ) : (
              <span className="app-readiness-deadline neutral">
                <CalendarDays aria-hidden="true" size={12} />
                No deadline
              </span>
            )}
          </div>

          <div className="app-readiness-requirement-row">
            {missingReq ? (
              <span className="app-readiness-missing">
                <AlertTriangle aria-hidden="true" size={12} />
                Missing: {missingReq}
              </span>
            ) : percentage >= 100 ? (
              <span className="app-readiness-ready-msg">
                <CheckCircle2 aria-hidden="true" size={12} />
                Ready to submit
              </span>
            ) : (
              <span className="app-readiness-ontrack-msg">
                <CheckCircle2 aria-hidden="true" size={12} />
                Requirements on track
              </span>
            )}
          </div>
        </div>

        <div className="app-readiness-action-cell">
          <span
            className="app-readiness-cta-btn"
            aria-label={`${actionLabel} for ${item.institutionName}`}
          >
            {actionLabel} <ArrowRight aria-hidden="true" size={13} />
          </span>
        </div>
      </Link>
    </li>
  );
}

function CircularReadinessRing({
  percentage,
  state,
}: {
  percentage: number;
  state: ReadinessState;
}) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (percentage / 100) * circumference;

  return (
    <div
      className={`app-readiness-ring-wrap state-${state}`}
      role="progressbar"
      aria-label={`Application readiness: ${percentage} percent`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
    >
      <svg viewBox="0 0 52 52" className="app-readiness-ring-svg" aria-hidden="true">
        <circle className="app-readiness-ring-bg" cx="26" cy="26" r={radius} />
        <circle
          className="app-readiness-ring-val"
          cx="26"
          cy="26"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <span className="app-readiness-ring-text">{percentage}%</span>
    </div>
  );
}

function ReadinessBadge({ state }: { state: ReadinessState }) {
  const config: Record<ReadinessState, { label: string; tone: string }> = {
    ready: { label: "Ready", tone: "ready" },
    due_soon: { label: "Due soon", tone: "due-soon" },
    needs_attention: { label: "Needs attention", tone: "attention" },
    overdue: { label: "Overdue", tone: "overdue" },
    on_track: { label: "On track", tone: "on-track" },
    incomplete_setup: { label: "Incomplete", tone: "incomplete" },
  };

  const { label, tone } = config[state] ?? config.on_track;

  return (
    <span className={`app-readiness-badge tone-${tone}`}>
      {label}
    </span>
  );
}
