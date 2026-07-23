import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckSquare2,
  ChevronRight,
  FileText,
  FolderKanban,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import dashboardFocusIllustration from "../../assets/dashboard-focus-illustration.webp";
import recommendationIllustration from "../../assets/recommendation-illustration.webp";
import { platformApi, safeDashboard } from "../../lib/api/platform";
import { documentsApi, profileApi } from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
import { useSession } from "../../lib/auth/session";
import {
  EventManager,
  type CalendarEvent,
  type CalendarEventTone,
} from "../../components/ui/event-manager";

type Deadline = Record<string, unknown>;
type SetupStatus = "done" | "todo" | "checking" | "unavailable";
type SetupItem = {
  href: string;
  label: string;
  detail: string;
  status: SetupStatus;
};

// Validated categorical order (dataviz skill palette.md) — fixed order, never re-sorted by value.
const STAGE_COLORS = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#4a3aa7",
  "#e34948",
];

function assignStageColors(stages: Record<string, number>) {
  const colors = new Map<string, string>();
  Object.keys(stages).forEach((stage, index) => {
    colors.set(stage, STAGE_COLORS[index % STAGE_COLORS.length]);
  });
  return colors;
}

const recommendationRoutes: Record<
  string,
  { title: string; detail: string; href: string; action: string }
> = {
  complete_academic_profile: {
    title: "Complete your academic profile",
    detail:
      "Add your education and academic history so application requirements can be checked accurately.",
    href: "/app/academic-profile",
    action: "Continue profile",
  },
  add_application: {
    title: "Add your first application",
    detail:
      "Capture the opportunity and deadline, then turn its requirements into a clear plan.",
    href: "/app/applications",
    action: "Add application",
  },
  upload_documents: {
    title: "Organise your supporting documents",
    detail:
      "Keep transcripts, certificates and other evidence ready for the applications that need them.",
    href: "/app/documents",
    action: "Open documents",
  },
};

export function DashboardPage() {
  const user = useSession((state) => state.user);
  const navigate = useNavigate();
  const [showAllSteps, setShowAllSteps] = useState(false);
  const query = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => safeDashboard(await platformApi.dashboard()),
  });
  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: profileApi.get,
  });
  const documentsQuery = useQuery({
    queryKey: queryKeys.documents,
    queryFn: documentsApi.list,
  });

  if (query.isPending) return <DashboardSkeleton />;

  if (query.isError) {
    return (
      <div className="page dashboard-state" role="alert">
        <div className="state-icon" aria-hidden="true">
          <FolderKanban />
        </div>
        <h1>We couldn’t load your workspace</h1>
        <p>
          Your application data is safe. Check your connection, then try loading
          the dashboard again.
        </p>
        <button
          className="primary"
          type="button"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
        >
          {query.isFetching ? "Trying again…" : "Try again"}
        </button>
      </div>
    );
  }

  const dashboard = query.data;
  const deadlineEvents = dashboard.upcoming_deadlines
    .map(toDeadlineEvent)
    .filter((event): event is CalendarEvent => Boolean(event))
    .sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
  const firstDeadline = deadlineEvents[0]
    ? new Date(deadlineEvents[0].startAt)
    : new Date();
  const firstName = user?.full_name?.trim().split(/\s+/)[0];
  const applicationCount = Object.values(
    dashboard.applications_by_stage,
  ).reduce((total, count) => total + Math.max(0, count), 0);
  const recommendation = getRecommendation(dashboard.recommended_next_action);
  const stageColors = assignStageColors(dashboard.applications_by_stage);
  const profile = profileQuery.data;
  const profileStatus = (done: boolean) =>
    getSetupStatus(profileQuery.isPending, profileQuery.isError, done);
  const documentStatus = getSetupStatus(
    documentsQuery.isPending,
    documentsQuery.isError,
    Boolean(documentsQuery.data?.length),
  );
  const setupPages: Array<{
    title: string;
    items: SetupItem[];
  }> = [
    {
      title: "Build your foundation",
      items: [
        {
          label: "Add academic background",
          detail: "Add your education and achievements",
          href: "/app/academic-profile",
          status: profileStatus(hasContent(profile?.sections?.education)),
        },
        {
          label: "Set your study direction",
          detail: "Define your target programs and goals",
          href: "/app/academic-profile",
          status: profileStatus(
            Boolean(
              profile?.applicant_type?.trim() &&
                profile.intended_study_level?.trim() &&
                profile.target_countries?.some((country) => country.trim()),
            ),
          ),
        },
        {
          label: "Add an application",
          detail: "Start your first application",
          href: "/app/applications",
          status: applicationCount > 0 ? "done" : "todo",
        },
      ],
    },
    {
      title: "Strengthen your evidence",
      items: [
        {
          label: "Upload a supporting document",
          detail: "Keep transcripts and certificates ready",
          href: "/app/documents",
          status: documentStatus,
        },
        {
          label: "Add academic interests",
          detail: "Note the fields you want to pursue",
          href: "/app/academic-profile",
          status: profileStatus(
            hasContent(profile?.sections?.academic_interests),
          ),
        },
        {
          label: "Add achievements or research",
          detail: "Add honors, tests or research experience",
          href: "/app/academic-profile",
          status: profileStatus(
            [
              "honors_and_activities",
              "standardized_tests",
              "research_experience",
            ].some((key) => hasContent(profile?.sections?.[key])),
          ),
        },
      ],
    },
    {
      title: "Prepare to apply",
      items: [
        {
          label: "Record an upcoming deadline",
          detail: "Track when each application is due",
          href: "/app/applications",
          status: dashboard.upcoming_deadlines.length > 0 ? "done" : "todo",
        },
        {
          label: "Plan your next application task",
          detail: "Turn requirements into trackable tasks",
          href: "/app/applications",
          status: dashboard.open_tasks > 0 ? "done" : "todo",
        },
        {
          label: "Resolve document gaps",
          detail: "Match documents to what applications need",
          href: "/app/documents",
          status:
            applicationCount > 0 && dashboard.missing_documents === 0
              ? "done"
              : "todo",
        },
      ],
    },
  ];
  const activePhaseIndex = (() => {
    const index = setupPages.findIndex((page) =>
      page.items.some((item) => item.status !== "done"),
    );
    return index === -1 ? setupPages.length - 1 : index;
  })();
  const setupPage = setupPages[activePhaseIndex];
  const allSetupItems = setupPages.flatMap((page) => page.items);
  const totalSetupItems = allSetupItems.length;
  const completedSetupItems = allSetupItems.filter(
    (item) => item.status === "done",
  ).length;
  const profileReadinessPercent =
    totalSetupItems > 0
      ? Math.round((completedSetupItems / totalSetupItems) * 100)
      : dashboard.profile_completion_percent;
  const profileComplete = profileReadinessPercent >= 100;
  const setupProgressPending =
    profileQuery.isPending || documentsQuery.isPending;
  const setupProgressError = profileQuery.isError || documentsQuery.isError;

  return (
    <div className="page dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-context">Application workspace</p>
          <h1>Good morning{firstName ? `, ${firstName}` : ""}</h1>
          <p>
            Keep your next steps, deadlines and supporting materials moving in
            one place.
          </p>
        </div>
        <Link className="primary dashboard-add" to="/app/applications">
          <Plus aria-hidden="true" /> Add application
        </Link>
      </header>

      <section className="dashboard-focus" aria-labelledby="profile-title">
        <ProfileProgressRing percent={profileReadinessPercent} />
        <div className="dashboard-focus-copy">
          <span>Next responsible action</span>
          <h2 id="profile-title">
            {profileComplete
              ? "Your academic profile is ready"
              : "Build your academic profile"}
          </h2>
          <p>
            {profileComplete
              ? "Review it before using the profile across new applications."
              : "Add your education and academic history once, then reuse it across applications."}
          </p>
          <div className="dashboard-focus-actions">
            <Link className="dashboard-focus-primary" to="/app/academic-profile">
              {profileComplete ? "Review profile" : "Continue profile"}
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link className="dashboard-focus-secondary" to="/contact">
              Learn more
            </Link>
          </div>
        </div>
        <div className="dashboard-focus-art" aria-hidden="true">
          <span className="dashboard-focus-art-glow" />
          <img src={dashboardFocusIllustration} alt="" width={280} height={280} loading="lazy" />
        </div>
      </section>

      <div className="dashboard-summary-row">
        <DashboardSurface
          icon={FolderKanban}
          title="Applications overview"
          action={
            <Link to="/app/applications">
              View all <ArrowRight aria-hidden="true" />
            </Link>
          }
        >
          {applicationCount > 0 ? (
            <div className="dashboard-donut-row">
              <div className="dashboard-donut">
                <ApplicationsDonut
                  stages={dashboard.applications_by_stage}
                  total={applicationCount}
                  colors={stageColors}
                />
                <div className="dashboard-donut-copy">
                  <strong>{applicationCount}</strong>
                  <span>Total</span>
                </div>
              </div>
              <ul className="dashboard-legend">
                {Object.entries(dashboard.applications_by_stage)
                  .sort((a, b) => b[1] - a[1])
                  .map(([stage, count]) => (
                    <li key={stage}>
                      <i
                        style={{ background: stageColors.get(stage) }}
                        aria-hidden="true"
                      />
                      <span>{humanize(stage)}</span>
                      <strong>{count}</strong>
                    </li>
                  ))}
              </ul>
            </div>
          ) : (
            <EmptyState
              icon={FolderKanban}
              title="Start with one application"
              detail="Add a scholarship, programme, fellowship or grant. EliteApply will keep its deadline and requirements together."
              href="/app/applications"
              action="Add your first application"
            />
          )}
        </DashboardSurface>

        <section className="dashboard-snapshot">
          <header>
            <h2>Workspace snapshot</h2>
            <span>Live account data</span>
          </header>
          <div className="dashboard-snapshot-grid">
            <StatTile
              icon={FolderKanban}
              label="Applications"
              value={applicationCount}
            />
            <StatTile
              icon={CheckSquare2}
              label="Open tasks"
              value={dashboard.open_tasks}
            />
            <StatTile
              icon={FileText}
              label="Documents to review"
              value={dashboard.missing_documents}
            />
            <StatTile
              icon={CalendarDays}
              label="Upcoming deadlines"
              value={dashboard.upcoming_deadlines.length}
            />
          </div>
        </section>

        <section className="dashboard-recommendation">
          <span className="dashboard-recommendation-label">
            <Sparkles aria-hidden="true" /> Recommended next step
          </span>
          <h2>{recommendation.title}</h2>
          <p>{recommendation.detail}</p>
          <Link className="secondary-action" to={recommendation.href}>
            {recommendation.action} <ArrowRight aria-hidden="true" />
          </Link>
          <img
            className="dashboard-recommendation-art"
            src={recommendationIllustration}
            alt=""
            width={140}
            height={140}
            loading="lazy"
            aria-hidden="true"
          />
        </section>
      </div>

      <div className="dashboard-top-row">
        <DashboardSurface
          icon={CalendarDays}
          title="Upcoming deadlines"
          action={
            dashboard.upcoming_deadlines.length > 0 ? (
              <Link to="/app/reminders?view=calendar">
                Open calendar <ArrowRight aria-hidden="true" />
              </Link>
            ) : null
          }
        >
          {deadlineEvents.length > 0 ? (
            <EventManager
              compact
              events={deadlineEvents}
              initialDate={firstDeadline}
              onEventSelect={(event) => {
                const href = (event.source as { href?: string })?.href;
                if (href) navigate(href);
              }}
            />
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No deadlines to manage yet"
              detail="Deadlines will appear here as soon as you add them to an application."
              href="/app/applications"
              action="Go to applications"
            />
          )}
        </DashboardSurface>

        <section
          className="setup-checklist"
          aria-labelledby="workspace-guide-title"
        >
          <header>
            <h2 id="workspace-guide-title">Workspace guide</h2>
            <span aria-live="polite">
              {setupProgressPending
                ? "Checking progress…"
                : `${completedSetupItems}/${totalSetupItems} complete`}
            </span>
          </header>
          <GuidePhaseProgress
            pages={setupPages}
            activeIndex={activePhaseIndex}
          />
          <div className="setup-page-intro" aria-live="polite">
            <span>
              Phase {activePhaseIndex + 1} of {setupPages.length}
            </span>
            <h3>{setupPage.title}</h3>
          </div>
          {setupPage.items.map((item) => (
            <SetupRow {...item} key={item.label} />
          ))}
          {setupProgressError ? (
            <div className="setup-sync-error" role="alert">
              <p>Some progress could not be checked.</p>
              <button
                type="button"
                onClick={() => {
                  if (profileQuery.isError) void profileQuery.refetch();
                  if (documentsQuery.isError) void documentsQuery.refetch();
                }}
                disabled={
                  profileQuery.isFetching || documentsQuery.isFetching
                }
              >
                {profileQuery.isFetching || documentsQuery.isFetching
                  ? "Checking…"
                  : "Retry progress check"}
              </button>
            </div>
          ) : null}
          <button
            type="button"
            className="setup-view-all"
            onClick={() => setShowAllSteps(true)}
          >
            View all steps <ArrowRight aria-hidden="true" />
          </button>
        </section>
      </div>

      {showAllSteps ? (
        <WorkspaceGuideModal
          pages={setupPages}
          completed={completedSetupItems}
          total={totalSetupItems}
          onClose={() => setShowAllSteps(false)}
        />
      ) : null}
    </div>
  );
}

function GuidePhaseProgress({
  pages,
  activeIndex,
}: {
  pages: Array<{ title: string; items: SetupItem[] }>;
  activeIndex: number;
}) {
  return (
    <div className="guide-progress" role="presentation">
      {pages.map((page, index) => {
        const done = page.items.filter((item) => item.status === "done").length;
        const percent = Math.round((done / page.items.length) * 100);
        return (
          <span
            className={`guide-progress-segment${index <= activeIndex ? " active" : ""}`}
            key={page.title}
          >
            <i style={{ width: `${percent}%` }} />
          </span>
        );
      })}
    </div>
  );
}

function WorkspaceGuideModal({
  pages,
  completed,
  total,
  onClose,
}: {
  pages: Array<{ title: string; items: SetupItem[] }>;
  completed: number;
  total: number;
  onClose: () => void;
}) {
  return (
    <div className="apps-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="apps-dialog"
        role="dialog"
        aria-labelledby="workspace-guide-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="apps-dialog-header">
          <h2 id="workspace-guide-modal-title">Workspace guide</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <p className="apps-dialog-subtext">{completed}/{total} complete</p>
        <div className="apps-dialog-body">
          {pages.map((page, index) => (
            <section className="guide-modal-phase" key={page.title}>
              <span>Phase {index + 1} of {pages.length}</span>
              <h3>{page.title}</h3>
              {page.items.map((item) => (
                <SetupRow {...item} key={item.label} onNavigate={onClose} />
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardSurface({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: ComponentType<{ "aria-hidden"?: boolean }>;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="dashboard-surface">
      <header>
        <h2>
          <Icon aria-hidden={true} /> {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function EmptyState({
  icon: Icon,
  title,
  detail,
  href,
  action,
}: {
  icon: ComponentType<{ "aria-hidden"?: boolean }>;
  title: string;
  detail: string;
  href: string;
  action: string;
}) {
  return (
    <div className="dashboard-empty">
      <span aria-hidden="true">
        <Icon />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
      <Link to={href}>
        {action} <ArrowRight aria-hidden="true" />
      </Link>
    </div>
  );
}

function ApplicationsDonut({
  stages,
  total,
  colors,
}: {
  stages: Record<string, number>;
  total: number;
  colors: Map<string, string>;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let drawn = 0;
  return (
    <svg viewBox="0 0 132 132" width={132} height={132} aria-hidden="true">
      <circle className="donut-track" cx={66} cy={66} r={radius} />
      {Object.entries(stages).map(([stage, count]) => {
        const fraction = total > 0 ? count / total : 0;
        const dash = Math.max(0, fraction * circumference - 2);
        const offset = -drawn;
        drawn += fraction * circumference;
        return (
          <circle
            key={stage}
            className="donut-segment"
            cx={66}
            cy={66}
            r={radius}
            stroke={colors.get(stage)}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
          />
        );
      })}
    </svg>
  );
}

function toDeadlineEvent(
  deadline: Deadline,
  index: number,
): CalendarEvent | null {
  const title =
    readString(deadline, ["title", "application_title", "name"]) ||
    `Application deadline ${index + 1}`;
  const rawDate = readString(deadline, [
    "deadline",
    "deadline_at",
    "due_at",
    "date",
  ]);
  if (!rawDate || Number.isNaN(new Date(rawDate).getTime())) return null;
  const applicationId = readString(deadline, ["application_id", "id"]);
  return {
    id: `dashboard-deadline:${applicationId || index}`,
    title,
    startAt: rawDate,
    kind: "deadline",
    tone: deadlineTone(rawDate),
    allDay: true,
    source: {
      href: applicationId
        ? `/app/applications/${applicationId}`
        : "/app/applications",
    },
  };
}

function ProfileProgressRing({ percent }: { percent: number }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, percent)) / 100);
  return (
    <div
      className="focus-ring"
      role="progressbar"
      aria-label="Academic profile completion"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <svg viewBox="0 0 132 132" width={132} height={132} aria-hidden="true">
        <circle className="focus-ring-track" cx={66} cy={66} r={radius} />
        <circle
          className="focus-ring-value"
          cx={66}
          cy={66}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="focus-ring-copy">
        <span>Next step</span>
        <strong>{percent}%</strong>
        <span>Profile progress</span>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ "aria-hidden"?: boolean }>;
  label: string;
  value: number;
}) {
  return (
    <div className="dashboard-stat-tile">
      <div>
        <strong>{value}</strong>
        <span aria-hidden="true">
          <Icon />
        </span>
      </div>
      <p>{label}</p>
    </div>
  );
}

function SetupRow({
  href,
  label,
  detail,
  status,
  onNavigate,
}: SetupItem & { onNavigate?: () => void }) {
  const statusLabel = {
    done: "Completed",
    todo: "Start",
    checking: "Checking progress",
    unavailable: "Progress unavailable",
  }[status];

  return (
    <Link
      aria-label={`${label}, ${statusLabel}`}
      className={`setup-step ${status}`}
      to={href}
      onClick={onNavigate}
    >
      <span aria-hidden="true">
        {status === "done" ? (
          <Check />
        ) : status === "checking" ? (
          "…"
        ) : status === "unavailable" ? (
          "!"
        ) : null}
      </span>
      <div>
        <strong>{label}</strong>
        <small>{detail}</small>
      </div>
      <em className={status === "done" ? "setup-step-done" : "setup-step-start"}>
        {statusLabel}
      </em>
      <ChevronRight aria-hidden="true" />
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="page dashboard dashboard-loading" aria-busy="true">
      <p className="sr-only" role="status">
        Loading your dashboard…
      </p>
      <div className="skeleton skeleton-heading" />
      <div className="skeleton skeleton-focus" />
      <div className="dashboard-summary-row">
        <div className="skeleton skeleton-panel" />
        <div className="skeleton skeleton-panel" />
        <div className="skeleton skeleton-panel" />
      </div>
      <div className="dashboard-top-row">
        <div className="skeleton skeleton-panel" />
        <div className="skeleton skeleton-rail" />
      </div>
    </div>
  );
}

function getRecommendation(action: string) {
  const key = action.trim().toLowerCase();
  const known = recommendationRoutes[key];
  if (known) return known;

  return {
    title: humanize(action || "Review your application plan"),
    detail:
      "Open your applications to review current requirements and choose the next responsible step.",
    href: "/app/applications",
    action: "Review applications",
  };
}

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function readString(record: Deadline, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function deadlineTone(value: string): CalendarEventTone {
  const days = (new Date(value).getTime() - Date.now()) / 86_400_000;
  if (days < 0) return "red";
  if (days <= 7) return "amber";
  return "violet";
}

function getSetupStatus(
  isPending: boolean,
  isError: boolean,
  done: boolean,
): SetupStatus {
  if (isPending) return "checking";
  if (isError) return "unavailable";
  return done ? "done" : "todo";
}

function hasContent(value: unknown): boolean {
  if (typeof value === "string") return Boolean(value.trim());
  if (Array.isArray(value)) return value.some(hasContent);
  if (value && typeof value === "object")
    return Object.values(value).some(hasContent);
  return typeof value === "number" || value === true;
}
