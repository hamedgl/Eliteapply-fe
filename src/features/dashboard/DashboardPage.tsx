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
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import dashboardFocusIllustration from "../../assets/dashboard-focus-illustration.webp";
import recommendationIllustration from "../../assets/recommendation-illustration.webp";
import {
  platformApi,
  safeDashboard,
  type DashboardDeadline,
} from "../../lib/api/platform";
import { documentsApi, profileApi } from "../../lib/api/phase2";
import { interviewsApi, referencesApi, writingApi } from "../../lib/api/phase3";
import { queryKeys } from "../../lib/api/queryKeys";
import { useSession } from "../../lib/auth/session";
import {
  EventManager,
  type CalendarEvent,
  type CalendarEventTone,
} from "../../components/ui/event-manager";
import { ApplicationReadinessCard } from "./components/ApplicationReadinessCard";
import { ProgressExplainerDialog } from "./components/ProgressExplainerDialog";
import { readDraft, type SectionKey } from "../profile/model";
import { PageRefreshButton } from "../../components/page/PageHeader";
import { WorkspacePageGuideButton } from "../../components/AppShell";

type Deadline = DashboardDeadline;
type SetupStatus = "done" | "todo" | "checking" | "unavailable";
type SetupItem = {
  href: string;
  label: string;
  detail: string;
  /** The rule that marks this step complete, shown in the progress explainer. */
  explain: string;
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

const STAGE_DESCRIPTIONS: Record<string, string> = {
  researching: "You are still deciding whether this opportunity is worth pursuing.",
  shortlisted: "You saved this opportunity and plan to assess it next.",
  preparing: "You are working on the requirements and supporting material.",
  waiting_for_documents: "Progress is paused until the required documents are ready.",
  waiting_for_reference: "Progress is paused until a referee responds.",
  ready_to_submit: "The application is ready for a final check and submission.",
  submitted: "You sent the application.",
  under_review: "The institution is reviewing the application.",
  interview: "The application has moved to the interview stage.",
  waitlisted: "The institution placed the application on a waitlist.",
  offered: "You received an offer.",
  awarded: "The scholarship, grant or place was awarded.",
  rejected: "The application was not accepted.",
  withdrawn: "You chose to withdraw the application.",
  expired: "The deadline passed before submission.",
  archived: "You moved this application out of the active workspace.",
};

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
  const [showProgressExplainer, setShowProgressExplainer] = useState(false);
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState<number | null>(
    null,
  );
  const [activeDonutStage, setActiveDonutStage] = useState<string | null>(null);
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
  const writingQuery = useQuery({
    queryKey: [...queryKeys.writing, "workspace-guide"],
    queryFn: () => writingApi.list(),
  });
  const referencesQuery = useQuery({
    queryKey: [...queryKeys.references(), "workspace-guide"],
    queryFn: () => referencesApi.list(),
  });
  const interviewsQuery = useQuery({
    queryKey: [...queryKeys.interviews, "workspace-guide"],
    queryFn: () => interviewsApi.list(),
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
  const draft = readDraft(profileQuery.data ?? null);
  /*
   * The server now reports completion per profile section; the locally derived
   * draft stays as the fallback for accounts served by an older backend.
   */
  const serverSections = new Map(
    dashboard.profile_completion.sections.map((section) => [
      section.key,
      section.complete,
    ]),
  );
  const sectionDone = (key: SectionKey, local: boolean) =>
    serverSections.get(key) ?? local;
  const profileStatus = (done: boolean) =>
    getSetupStatus(profileQuery.isPending, profileQuery.isError, done);
  const documentStatus = getSetupStatus(
    documentsQuery.isPending,
    documentsQuery.isError,
    Boolean(documentsQuery.data?.length),
  );
  const hasLinkedDocument = (documentsQuery.data ?? []).some(
    (item) => (item.link_count ?? item.linked_application_ids?.length ?? 0) > 0,
  );
  const writingDocuments = Array.isArray(writingQuery.data)
    ? writingQuery.data
    : [];
  const references = Array.isArray(referencesQuery.data?.items)
    ? referencesQuery.data.items
    : [];
  const interviews = Array.isArray(interviewsQuery.data?.items)
    ? interviewsQuery.data.items
    : [];
  const activeReferences = references.filter(
    (item) => item.status !== "cancelled" && item.status !== "revoked",
  );
  const unfinishedInterview = interviews.find(
    (item) => item.status !== "completed" && item.status !== "cancelled",
  );
  const hasCompletedInterview = interviews.some(
    (item) => item.status === "completed" || Boolean(item.completed_at),
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
          explain:
            "Complete once the education section of your academic profile has at least one entry.",
          href: "/app/academic-profile",
          status: profileStatus(
            sectionDone("education", draft.education.length > 0),
          ),
        },
        {
          label: "Set your study direction",
          detail: "Define your target programs and goals",
          explain:
            "Needs applicant type, intended study level and at least one target country on your profile.",
          href: "/app/academic-profile",
          status: profileStatus(
            sectionDone(
              "goals",
              Boolean(
                draft.applicant_type.trim() &&
                  draft.intended_study_level.trim() &&
                  draft.target_countries.some((country) => country.trim()),
              ),
            ),
          ),
        },
        {
          label: "Add an application",
          detail: "Start your first application",
          explain: "Complete as soon as you track one application.",
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
          explain: "Complete once you have at least one document in Documents.",
          href: "/app/documents",
          status: documentStatus,
        },
        {
          label: "Add academic interests",
          detail: "Note the fields you want to pursue",
          explain:
            "Complete once the academic interests section of your profile has an entry.",
          href: "/app/academic-profile",
          status: profileStatus(
            sectionDone(
              "interests",
              Boolean(
                draft.interests.summary.trim() ||
                  draft.interests.interest_tags.length,
              ),
            ),
          ),
        },
        {
          label: "Add achievements or research",
          detail: "Add honors, tests or research experience",
          explain:
            "Any one of honours and activities, standardised tests or research experience completes this.",
          href: "/app/academic-profile",
          status: profileStatus(
            sectionDone("honors", draft.honors.length > 0) ||
              sectionDone("tests", draft.tests.length > 0) ||
              sectionDone("research", draft.research.length > 0),
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
          explain:
            "Complete while at least one application has a deadline still ahead of it.",
          href: "/app/applications",
          status: dashboard.upcoming_deadlines.length > 0 ? "done" : "todo",
        },
        {
          label: "Plan your next application task",
          detail: "Turn requirements into trackable tasks",
          explain:
            "Complete once you are tracking an application, or have created a task on one — finishing your tasks does not reopen this step.",
          href: "/app/applications",
          status:
            applicationCount > 0 || dashboard.tasks.total > 0 ? "done" : "todo",
        },
        {
          label: "Resolve document gaps",
          detail: "Match documents to what applications need",
          explain:
            "Complete once a document is linked to one of your applications, or no application is missing a required document.",
          href: "/app/documents",
          status: getSetupStatus(
            documentsQuery.isPending,
            documentsQuery.isError,
            hasLinkedDocument ||
              (applicationCount > 0 && dashboard.missing_documents === 0),
          ),
        },
      ],
    },
    {
      title: "Develop your submission",
      items: [
        {
          label: "Draft an application response",
          detail: "Start a statement, essay or study plan",
          explain:
            "Complete once you have at least one active document in Writing Studio.",
          href: writingDocuments.length ? "/app/writing" : "/app/writing/new",
          status: getSetupStatus(
            writingQuery.isPending,
            writingQuery.isError,
            writingDocuments.length > 0,
          ),
        },
        {
          label: "Request a reference",
          detail: "Give your referee time before the deadline",
          explain:
            "Complete while you have at least one reference request that has not been cancelled or revoked.",
          href: activeReferences.length
            ? "/app/references"
            : "/app/references/new",
          status: getSetupStatus(
            referencesQuery.isPending,
            referencesQuery.isError,
            activeReferences.length > 0,
          ),
        },
        {
          label: "Complete an interview practice",
          detail: "Rehearse answers and review your feedback",
          explain:
            "Complete once you finish at least one interview practice session.",
          href: hasCompletedInterview
            ? "/app/interviews"
            : unfinishedInterview
              ? `/app/interviews/${unfinishedInterview.id}`
              : "/app/interviews/new",
          status: getSetupStatus(
            interviewsQuery.isPending,
            interviewsQuery.isError,
            hasCompletedInterview,
          ),
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
  const visiblePhaseIndex = selectedPhaseIndex ?? activePhaseIndex;
  const setupPage = setupPages[visiblePhaseIndex];
  const allSetupItems = setupPages.flatMap((page) => page.items);
  const totalSetupItems = allSetupItems.length;
  const completedSetupItems = allSetupItems.filter(
    (item) => item.status === "done",
  ).length;
  // The ring reports the server's academic-profile score; the guide counts its
  // own steps. Showing the step count as "profile progress" conflated the two.
  const profilePercent = dashboard.profile_completion_percent; // already clamped by safeDashboard
  const profileComplete = profilePercent >= 100;
  const setupProgressPending =
    profileQuery.isPending ||
    documentsQuery.isPending ||
    writingQuery.isPending ||
    referencesQuery.isPending ||
    interviewsQuery.isPending;
  const setupProgressError =
    profileQuery.isError ||
    documentsQuery.isError ||
    writingQuery.isError ||
    referencesQuery.isError ||
    interviewsQuery.isError;

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
        <div className="apps-header-actions">
          <PageRefreshButton
            onRefresh={() =>
              void Promise.all([
                query.refetch(),
                profileQuery.refetch(),
                documentsQuery.refetch(),
                writingQuery.refetch(),
                referencesQuery.refetch(),
                interviewsQuery.refetch(),
              ])
            }
            refreshing={
              query.isFetching ||
              profileQuery.isFetching ||
              documentsQuery.isFetching ||
              writingQuery.isFetching ||
              referencesQuery.isFetching ||
              interviewsQuery.isFetching
            }
          />
          <WorkspacePageGuideButton />
          <Link className="primary dashboard-add" to="/app/applications">
            <Plus aria-hidden="true" /> Add application
          </Link>
        </div>
      </header>

      <section className="dashboard-focus" aria-labelledby="profile-title">
        <ProfileProgressRing percent={profilePercent} />
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
            <button
              type="button"
              className="dashboard-focus-secondary"
              onClick={() => setShowProgressExplainer(true)}
            >
              How is this measured?
            </button>
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
                  activeStage={activeDonutStage}
                  onStageChange={setActiveDonutStage}
                />
                <div className="dashboard-donut-copy">
                  <strong>{applicationCount}</strong>
                  <span>Total</span>
                </div>
              </div>
              <div className="dashboard-stage-panel">
                <ul className="dashboard-legend">
                  {Object.entries(dashboard.applications_by_stage)
                    .sort((a, b) => b[1] - a[1])
                    .map(([stage, count]) => (
                      <li key={stage}>
                        <button
                          type="button"
                          className={
                            activeDonutStage === stage ? "is-active" : undefined
                          }
                          aria-pressed={activeDonutStage === stage}
                          onClick={() => setActiveDonutStage(stage)}
                          onFocus={() => setActiveDonutStage(stage)}
                          onBlur={() => setActiveDonutStage(null)}
                          onMouseEnter={() => setActiveDonutStage(stage)}
                          onMouseLeave={() => setActiveDonutStage(null)}
                        >
                          <i
                            style={{ background: stageColors.get(stage) }}
                            aria-hidden="true"
                          />
                          <span>{humanize(stage)}</span>
                          <strong>{count}</strong>
                        </button>
                      </li>
                    ))}
                </ul>
                <div
                  className={`dashboard-stage-detail ${
                    activeDonutStage ? "is-active" : "is-hint"
                  }`}
                  id="application-stage-detail"
                  role="status"
                  aria-live="polite"
                >
                  {activeDonutStage &&
                  dashboard.applications_by_stage[activeDonutStage] !==
                    undefined ? (
                    <>
                      <div>
                        <i
                          style={{
                            background: stageColors.get(activeDonutStage),
                          }}
                          aria-hidden="true"
                        />
                        <strong>{humanize(activeDonutStage)}</strong>
                        <span>
                          {dashboard.applications_by_stage[activeDonutStage]} of{" "}
                          {applicationCount}
                        </span>
                      </div>
                      <p>{stageDescription(activeDonutStage)}</p>
                    </>
                  ) : (
                    <p>Hover, tap or focus a colour to see what its stage means.</p>
                  )}
                </div>
              </div>
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

        <ApplicationReadinessCard />

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
            activeIndex={visiblePhaseIndex}
          />
          <div className="setup-page-intro">
            <div aria-live="polite">
              <span>
                Phase {visiblePhaseIndex + 1} of {setupPages.length}
              </span>
              <h3>{setupPage.title}</h3>
            </div>
            <div className="setup-page-controls">
              <button
                type="button"
                aria-label="Previous"
                disabled={visiblePhaseIndex === 0}
                onClick={() =>
                  setSelectedPhaseIndex(Math.max(0, visiblePhaseIndex - 1))
                }
              >
                <ChevronRight aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next"
                disabled={visiblePhaseIndex === setupPages.length - 1}
                onClick={() =>
                  setSelectedPhaseIndex(
                    Math.min(setupPages.length - 1, visiblePhaseIndex + 1),
                  )
                }
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
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
                  if (writingQuery.isError) void writingQuery.refetch();
                  if (referencesQuery.isError) void referencesQuery.refetch();
                  if (interviewsQuery.isError) void interviewsQuery.refetch();
                }}
                disabled={
                  profileQuery.isFetching ||
                  documentsQuery.isFetching ||
                  writingQuery.isFetching ||
                  referencesQuery.isFetching ||
                  interviewsQuery.isFetching
                }
              >
                {profileQuery.isFetching ||
                documentsQuery.isFetching ||
                writingQuery.isFetching ||
                referencesQuery.isFetching ||
                interviewsQuery.isFetching
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

      {showProgressExplainer ? (
        <ProgressExplainerDialog
          profilePercent={profilePercent}
          profileSections={dashboard.profile_completion.sections}
          phases={setupPages.map((page) => ({
            title: page.title,
            steps: page.items.map((item) => ({
              label: item.label,
              explain: item.explain,
              done: item.status === "done",
              pending: item.status === "checking",
            })),
          }))}
          onClose={() => setShowProgressExplainer(false)}
        />
      ) : null}

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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="apps-dialog workspace-guide-dialog"
      aria-labelledby="workspace-guide-modal-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
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
    </dialog>
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
  activeStage,
  onStageChange,
}: {
  stages: Record<string, number>;
  total: number;
  colors: Map<string, string>;
  activeStage: string | null;
  onStageChange: (stage: string | null) => void;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let drawn = 0;
  return (
    <svg
      viewBox="0 0 132 132"
      width={132}
      height={132}
      role="group"
      aria-label="Application stages"
    >
      <circle className="donut-track" cx={66} cy={66} r={radius} />
      {Object.entries(stages).map(([stage, count]) => {
        const fraction = total > 0 ? count / total : 0;
        const dash = Math.max(0, fraction * circumference - 2);
        const offset = -drawn;
        drawn += fraction * circumference;
        return (
          <circle
            key={stage}
            className={`donut-segment${
              activeStage === stage
                ? " is-active"
                : activeStage
                  ? " is-muted"
                  : ""
            }`}
            cx={66}
            cy={66}
            r={radius}
            role="button"
            tabIndex={0}
            aria-label={`${humanize(stage)}, ${count} ${
              count === 1 ? "application" : "applications"
            }. ${stageDescription(stage)}`}
            aria-pressed={activeStage === stage}
            aria-describedby="application-stage-detail"
            stroke={colors.get(stage)}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
            onClick={() => onStageChange(stage)}
            onFocus={() => onStageChange(stage)}
            onBlur={() => onStageChange(null)}
            onMouseEnter={() => onStageChange(stage)}
            onMouseLeave={() => onStageChange(null)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onStageChange(stage);
            }}
          />
        );
      })}
    </svg>
  );
}

function stageDescription(stage: string) {
  return (
    STAGE_DESCRIPTIONS[stage] ??
    `These applications are marked as ${humanize(stage).toLocaleLowerCase()}.`
  );
}

const DEADLINE_KIND_LABELS: Record<Deadline["kind"], string> = {
  application_deadline: "Application deadline",
  requirement_due: "Requirement due",
  task_due: "Task due",
  reference_due: "Reference due",
};

function toDeadlineEvent(deadline: Deadline, index: number): CalendarEvent {
  return {
    id: `dashboard-deadline:${deadline.application_id || index}:${deadline.kind}`,
    title: deadline.application_title,
    description: DEADLINE_KIND_LABELS[deadline.kind] ?? "Deadline",
    startAt: deadline.due_at,
    kind: "deadline",
    tone: deadlineTone(deadline.due_at),
    allDay: true,
    source: {
      href: deadline.application_id
        ? `/app/applications/${deadline.application_id}`
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
        <span>Academic profile</span>
        <strong>{percent}%</strong>
        <span>complete</span>
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
