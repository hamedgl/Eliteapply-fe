import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CheckSquare2,
  FileText,
  FolderKanban,
  GraduationCap,
  Plus,
} from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { platformApi, safeDashboard } from "../../lib/api/platform";
import { documentsApi, profileApi } from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
import { useSession } from "../../lib/auth/session";

type Deadline = Record<string, unknown>;
type SetupStatus = "done" | "todo" | "checking" | "unavailable";
type SetupItem = {
  href: string;
  label: string;
  status: SetupStatus;
};

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
  const [guidePage, setGuidePage] = useState(0);
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
  const firstName = user?.full_name?.trim().split(/\s+/)[0];
  const applicationCount = Object.values(
    dashboard.applications_by_stage,
  ).reduce((total, count) => total + Math.max(0, count), 0);
  const recommendation = getRecommendation(dashboard.recommended_next_action);
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
    detail: string;
    items: SetupItem[];
  }> = [
    {
      title: "Build your foundation",
      detail: "Set the reusable information every application needs.",
      items: [
        {
          label: "Add academic background",
          href: "/app/academic-profile",
          status: profileStatus(hasContent(profile?.sections?.education)),
        },
        {
          label: "Set your study direction",
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
          href: "/app/applications",
          status: applicationCount > 0 ? "done" : "todo",
        },
      ],
    },
    {
      title: "Strengthen your evidence",
      detail: "Gather the material that supports your academic story.",
      items: [
        {
          label: "Upload a supporting document",
          href: "/app/documents",
          status: documentStatus,
        },
        {
          label: "Add academic interests",
          href: "/app/academic-profile",
          status: profileStatus(
            hasContent(profile?.sections?.academic_interests),
          ),
        },
        {
          label: "Add achievements or research",
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
      detail: "Turn each opportunity into a complete, trackable plan.",
      items: [
        {
          label: "Record an upcoming deadline",
          href: "/app/applications",
          status: dashboard.upcoming_deadlines.length > 0 ? "done" : "todo",
        },
        {
          label: "Plan your next application task",
          href: "/app/applications",
          status: dashboard.open_tasks > 0 ? "done" : "todo",
        },
        {
          label: "Resolve document gaps",
          href: "/app/documents",
          status:
            applicationCount > 0 && dashboard.missing_documents === 0
              ? "done"
              : "todo",
        },
      ],
    },
  ];
  const setupPage = setupPages[guidePage];
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
        <div className="dashboard-focus-icon" aria-hidden="true">
          {profileComplete ? <CheckCircle2 /> : <GraduationCap />}
        </div>
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
          <Link to="/app/academic-profile">
            {profileComplete ? "Review profile" : "Continue profile"}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className="profile-readiness">
          <div>
            <span>Profile readiness</span>
            <strong>{profileReadinessPercent}%</strong>
          </div>
          <span
            className="profile-progress-bar"
            role="progressbar"
            aria-label="Academic profile completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={profileReadinessPercent}
          >
            <i style={{ width: `${profileReadinessPercent}%` }} />
          </span>
        </div>
      </section>

      <div className="dashboard-layout">
        <div className="dashboard-main-column">
          <DashboardSurface
            icon={FolderKanban}
            title="Applications"
            action={
              <Link to="/app/applications">
                View all <ArrowRight aria-hidden="true" />
              </Link>
            }
          >
            {applicationCount > 0 ? (
              <ApplicationStages
                stages={dashboard.applications_by_stage}
                total={applicationCount}
              />
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

          <DashboardSurface
            icon={CalendarDays}
            title="Upcoming deadlines"
            action={
              dashboard.upcoming_deadlines.length > 0 ? (
                <Link to="/app/applications">
                  View applications <ArrowRight aria-hidden="true" />
                </Link>
              ) : null
            }
          >
            {dashboard.upcoming_deadlines.length > 0 ? (
              <ul className="deadline-list">
                {dashboard.upcoming_deadlines
                  .slice(0, 4)
                  .map((deadline, index) => (
                    <DeadlineRow
                      deadline={deadline}
                      index={index}
                      key={index}
                    />
                  ))}
              </ul>
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
        </div>

        <aside className="dashboard-rail" aria-label="Workspace summary">
          <section className="dashboard-snapshot">
            <header>
              <h2>Workspace snapshot</h2>
              <span>Live account data</span>
            </header>
            <StatRow
              icon={FolderKanban}
              label="Applications"
              value={applicationCount}
            />
            <StatRow
              icon={CheckSquare2}
              label="Open tasks"
              value={dashboard.open_tasks}
            />
            <StatRow
              icon={FileText}
              label="Documents to review"
              value={dashboard.missing_documents}
              success={dashboard.missing_documents === 0}
            />
          </section>

          <section className="dashboard-recommendation">
            <span>Recommended next step</span>
            <h2>{recommendation.title}</h2>
            <p>{recommendation.detail}</p>
            <Link className="secondary-action" to={recommendation.href}>
              {recommendation.action} <ArrowRight aria-hidden="true" />
            </Link>
          </section>

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
            <div className="setup-page-intro" aria-live="polite">
              <span>
                Page {guidePage + 1} of {setupPages.length}
              </span>
              <h3>{setupPage.title}</h3>
              <p>{setupPage.detail}</p>
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
            <nav
              className="setup-pagination"
              aria-label="Workspace guide pages"
            >
              <button
                type="button"
                onClick={() => setGuidePage((page) => page - 1)}
                disabled={guidePage === 0}
              >
                Previous
              </button>
              <span aria-hidden="true">
                {setupPages.map((page, index) => (
                  <i
                    className={index === guidePage ? "active" : ""}
                    key={page.title}
                  />
                ))}
              </span>
              <button
                type="button"
                onClick={() => setGuidePage((page) => page + 1)}
                disabled={guidePage === setupPages.length - 1}
              >
                Next
              </button>
            </nav>
          </section>
        </aside>
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

function ApplicationStages({
  stages,
  total,
}: {
  stages: Record<string, number>;
  total: number;
}) {
  return (
    <ul className="stage-list">
      {Object.entries(stages).map(([stage, count]) => (
        <li key={stage}>
          <div>
            <span>{humanize(stage)}</span>
            <strong>{count}</strong>
          </div>
          <span aria-hidden="true">
            <i style={{ width: `${Math.max(4, (count / total) * 100)}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function DeadlineRow({
  deadline,
  index,
}: {
  deadline: Deadline;
  index: number;
}) {
  const title =
    readString(deadline, ["title", "application_title", "name"]) ||
    `Application deadline ${index + 1}`;
  const rawDate = readString(deadline, [
    "deadline",
    "deadline_at",
    "due_at",
    "date",
  ]);
  const parsedDate = rawDate ? new Date(rawDate) : null;
  const date =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
          parsedDate,
        )
      : "Date not provided";

  return (
    <li>
      <span aria-hidden="true">
        <CalendarDays />
      </span>
      <div>
        <strong>{title}</strong>
        <time dateTime={rawDate || undefined}>{date}</time>
      </div>
    </li>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
  success = false,
}: {
  icon: ComponentType<{ "aria-hidden"?: boolean }>;
  label: string;
  value: number;
  success?: boolean;
}) {
  return (
    <div className="dashboard-stat">
      <span className={success ? "success" : ""} aria-hidden="true">
        {success ? <Check /> : <Icon />}
      </span>
      <div>
        <span>{label}</span>
        {success ? <small>Nothing needs attention</small> : null}
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function SetupRow({ href, label, status }: SetupItem) {
  const statusLabel = {
    done: "Complete",
    todo: "To do",
    checking: "Checking progress",
    unavailable: "Progress unavailable",
  }[status];

  return (
    <Link aria-label={`${label}, ${statusLabel}`} className={status} to={href}>
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
        <small>{statusLabel}</small>
      </div>
      <ArrowRight aria-hidden="true" />
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
      <div className="dashboard-layout">
        <div className="dashboard-main-column">
          <div className="skeleton skeleton-panel" />
          <div className="skeleton skeleton-panel" />
        </div>
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
