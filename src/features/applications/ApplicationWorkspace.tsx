import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Copy,
  Download,
  Edit3,
  FilePlus2,
  FileText,
  Filter,
  History,
  Link2,
  ListChecks,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Unlink,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  applicationsApi,
  documentsApi,
  intelligenceApi,
} from "../../lib/api/phase2";
import { collaborationApi } from "../../lib/api/phase3";
import { queryKeys } from "../../lib/api/queryKeys";
import { newMutationId } from "../../lib/api/mutations";
import { ApiError } from "../../lib/api/errors";
import { ConflictNotice } from "../../components/ConflictNotice";
import { ConfirmationDialog } from "../../components/actions/ConfirmationDialog";
import { OverflowMenu } from "../../components/actions/OverflowMenu";
import { EmptyState } from "../../components/data-display/EmptyState";
import { ProgressBar } from "../../components/data-display/ProgressBar";
import { StatusBadge } from "../../components/data-display/StatusBadge";
import { Select } from "../../components/ui/select";
import { useFocusTrap } from "./hooks";
import { DuplicateApplication } from "./components/ApplicationDialogs";
import {
  deadlineInfo,
  formatDate,
  label,
  priorities,
  stages,
  STAGE_TONE,
} from "./model";
import {
  invalidateApplicationResource,
  seedApplicationWorkspace,
} from "./applicationQueries";
import type { components } from "../../generated/api/schema";
import "../../styles/workspace.css";

type S = components["schemas"];
type Tab =
  | "overview"
  | "requirements"
  | "tasks"
  | "documents"
  | "eligibility"
  | "collaborators"
  | "activity";

const TABS: Tab[] = [
  "overview",
  "requirements",
  "tasks",
  "documents",
  "eligibility",
  "collaborators",
  "activity",
];
const REQUIREMENT_DONE = new Set(["ready", "complete", "submitted", "waived"]);
const TASK_DONE = new Set(["completed", "cancelled"]);

export function ApplicationWorkspace() {
  const { id = "", resource } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const activeTab: Tab =
    resource && TABS.includes(resource as Tab) ? (resource as Tab) : "overview";
  const [editOpen, setEditOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "archive" | "delete" | null
  >(null);
  const [toast, setToast] = useState("");

  const workspace = useQuery({
    queryKey: queryKeys.workspace(id),
    queryFn: async ({ signal }) => {
      const value = await applicationsApi.workspace(id, signal);
      seedApplicationWorkspace(qc, id, value);
      return value;
    },
    enabled: Boolean(id),
  });
  const collaboratorView = useQuery({
    queryKey: queryKeys.collaboratorView(id),
    queryFn: () => collaborationApi.view(id),
    enabled: Boolean(id),
    retry: false,
  });
  const collaboratorCount = useQuery({
    queryKey: queryKeys.collaborators(id),
    queryFn: () => collaborationApi.list(id),
    enabled: collaboratorView.data?.role === "owner",
    retry: false,
  });
  const eligibility = useQuery({
    queryKey: queryKeys.eligibility(id),
    queryFn: () => intelligenceApi.currentEligibility(id),
    enabled: Boolean(workspace.data),
    retry: false,
  });
  const documents = useQuery({
    queryKey: queryKeys.documents,
    queryFn: documentsApi.list,
    enabled: activeTab === "overview" || activeTab === "documents",
  });

  const refreshWorkspace = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.workspace(id) }),
      qc.invalidateQueries({ queryKey: queryKeys.application(id) }),
      qc.invalidateQueries({ queryKey: queryKeys.applications }),
      qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ]);
  const updateApplication = useMutation({
    mutationFn: (body: S["ApplicationUpdate"]) =>
      applicationsApi.update(id, body),
    onSuccess: async () => {
      setEditOpen(false);
      setToast("Application details updated.");
      await refreshWorkspace();
    },
  });
  const submit = useMutation({
    mutationFn: (version: number) =>
      applicationsApi.submit(id, {
        expected_version: version,
        override_incomplete_requirements: false,
      }),
    onSuccess: async () => {
      setToast("Application marked as submitted.");
      await refreshWorkspace();
    },
  });
  const duplicate = useMutation({
    mutationFn: (options: {
      copy_requirements: boolean;
      copy_tasks: boolean;
      title_suffix: string;
    }) =>
      applicationsApi.duplicate(id, {
        mutation_id: newMutationId(),
        ...options,
      }),
    onSuccess: async (copy) => {
      await qc.invalidateQueries({ queryKey: queryKeys.applications });
      navigate(`/app/applications/${copy.id}`);
    },
  });
  const archive = useMutation({
    mutationFn: (version: number) =>
      applicationsApi.archive(id, { expected_version: version }),
    onSuccess: async () => {
      setConfirmAction(null);
      setToast("Application archived.");
      await refreshWorkspace();
    },
  });
  const remove = useMutation({
    mutationFn: () => applicationsApi.remove(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.applications });
      navigate("/app/applications");
    },
  });
  const exportApplication = useMutation({
    mutationFn: () => applicationsApi.export(id),
    onSuccess: (value) => {
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(value, null, 2)], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slug(value.application.title)}-export.json`;
      link.click();
      URL.revokeObjectURL(url);
      setToast("Application export downloaded.");
    },
  });

  if (resource && !TABS.includes(resource as Tab)) {
    return (
      <PageError
        title="Workspace section not found"
        onRetry={() => navigate(`/app/applications/${id}`)}
      />
    );
  }
  if (
    collaboratorView.data?.application &&
    ["viewer", "commenter", "advisor_editor"].includes(
      collaboratorView.data.role,
    )
  ) {
    return <ReadOnlyCollaboratorWorkspace view={collaboratorView.data} />;
  }
  if (workspace.isPending)
    return <ApplicationWorkspaceSkeleton tab={activeTab} />;
  if (workspace.isError || !workspace.data) {
    return (
      <PageError
        title="Application workspace unavailable"
        description="Your saved application data is unchanged. Retry the workspace to continue."
        onRetry={() => void workspace.refetch()}
      />
    );
  }

  const w = workspace.data;
  const readiness = w.readiness;
  const application = w.application;
  const title = richerApplicationTitle(application);
  const provider =
    application.institution_display_name || application.institution_name;
  const opportunity =
    application.programme_display_name ||
    application.programme_name ||
    application.scholarship_display_name ||
    application.scholarship_name;
  const deadline = deadlineInfo(
    application.primary_deadline_at,
    application.stage,
  );
  const blockingCount = readiness.blocking_issues.length;
  const incompleteCount = readiness.incomplete_requirements.length;
  const isReady = readiness.overall_state === "ready" && blockingCount === 0;
  const pendingAction = submit.isPending;
  const documentItems = Array.isArray(documents.data) ? documents.data : [];
  const collaboratorItems = Array.isArray(collaboratorCount.data)
    ? collaboratorCount.data
    : [];
  const eligibilityResult = isEligibilityResponse(eligibility.data)
    ? eligibility.data
    : undefined;
  const primary = recommendedPrimaryAction({
    eligibility: eligibilityResult,
    readiness,
    application,
  });
  const counts: Partial<Record<Tab, number>> = {
    requirements: w.counts?.requirements ?? w.requirements.length,
    tasks:
      w.counts?.open_tasks ??
      w.tasks.filter((item) => !TASK_DONE.has(item.status)).length,
    documents: w.counts?.documents ?? w.document_links.length,
    collaborators: w.counts?.collaborators ?? collaboratorItems.length,
  };
  const openTab = (tab: Tab, additions?: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(additions ?? {}).forEach(([key, value]) =>
      next.set(key, value),
    );
    navigate({
      pathname:
        tab === "overview"
          ? `/app/applications/${id}`
          : `/app/applications/${id}/${tab}`,
      search: next.toString(),
    });
  };
  const runPrimary = () => {
    if (primary.tab) openTab(primary.tab);
    else if (isReady) submit.mutate(application.version);
  };
  const anyHeaderError =
    updateApplication.error ||
    submit.error ||
    duplicate.error ||
    archive.error ||
    exportApplication.error;

  return (
    <div className="page apps-page detail-page">
      <header className="detail-application-header">
        <div className="detail-header-topline">
          <Link to="/app/applications" className="detail-back-link">
            <ArrowLeft aria-hidden="true" /> Back to applications
          </Link>
          <div className="detail-header-actions">
            <button
              type="button"
              className="primary"
              disabled={pendingAction}
              onClick={runPrimary}
              title={
                pendingAction
                  ? "Checking the latest application readiness"
                  : undefined
              }
            >
              {submit.isPending ? "Submitting…" : primary.label}
            </button>
            <OverflowMenu
              label={`More actions for ${title}`}
              items={[
                {
                  key: "edit",
                  label: "Edit application",
                  icon: Edit3,
                  onClick: () => setEditOpen(true),
                },
                {
                  key: "duplicate",
                  label: "Duplicate",
                  icon: Copy,
                  onClick: () => setDuplicateOpen(true),
                },
                {
                  key: "export",
                  label: "Export",
                  icon: Download,
                  disabled: exportApplication.isPending,
                  onClick: () => exportApplication.mutate(),
                },
                {
                  key: "archive",
                  label: "Archive",
                  icon: Archive,
                  disabled: application.stage === "archived",
                  onClick: () => setConfirmAction("archive"),
                },
                { key: "divider", divider: true },
                {
                  key: "delete",
                  label: "Delete",
                  icon: Trash2,
                  danger: true,
                  onClick: () => setConfirmAction("delete"),
                },
              ]}
            />
          </div>
        </div>
        <div className="detail-header-main">
          <div className="detail-title-block">
            <div className="detail-title-line">
              <h1>{title}</h1>
              <StatusBadge tone={STAGE_TONE[application.stage] ?? "neutral"}>
                {label(application.stage)}
              </StatusBadge>
            </div>
            <p>
              {[
                opportunity !== title ? opportunity : null,
                provider,
                label(application.application_type),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <dl className="detail-header-facts">
            <div
              className={`detail-deadline detail-deadline-${deadline.urgency}`}
            >
              <dt>Deadline</dt>
              <dd>{deadline.primary}</dd>
              {deadline.secondary ? <small>{deadline.secondary}</small> : null}
            </div>
            <div>
              <dt>Priority</dt>
              <dd>{label(application.priority)}</dd>
            </div>
            <div>
              <dt>Readiness</dt>
              <dd>
                {readiness.readiness_percent ??
                  application.readiness_percent ??
                  0}
                %
              </dd>
            </div>
          </dl>
        </div>
        {!isReady ? (
          <p className="detail-submit-reason" role="note">
            <AlertCircle aria-hidden="true" />
            {blockingCount
              ? `${blockingCount} blocking ${blockingCount === 1 ? "issue must" : "issues must"} be resolved before submission${incompleteCount ? `, including ${incompleteCount} incomplete ${incompleteCount === 1 ? "requirement" : "requirements"}` : ""}.`
              : "Complete the recommended preparation before submission."}
          </p>
        ) : null}
      </header>

      <ApplicationTabs active={activeTab} counts={counts} onOpen={openTab} />
      {anyHeaderError ? (
        <InlineError message={readableError(anyHeaderError)} />
      ) : null}

      <main
        className="detail-tab-panel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === "overview" ? (
          <OverviewTab
            workspace={w}
            readiness={readiness}
            readinessPending={false}
            eligibility={eligibilityResult}
            onEdit={() => setEditOpen(true)}
            onOpen={openTab}
          />
        ) : null}
        {activeTab === "requirements" ? (
          <RequirementsTab
            applicationId={id}
            items={w.requirements}
            links={w.document_links}
            onOpen={openTab}
            onToast={setToast}
          />
        ) : null}
        {activeTab === "tasks" ? (
          <TasksTab
            applicationId={id}
            items={w.tasks}
            requirements={w.requirements}
            collaborators={collaboratorItems}
            onToast={setToast}
          />
        ) : null}
        {activeTab === "documents" ? (
          <DocumentsTab
            applicationId={id}
            requirements={w.requirements}
            initialLinks={w.document_links}
            documents={documentItems}
            documentsPending={documents.isPending}
            documentsError={documents.isError}
            retryDocuments={() => void documents.refetch()}
            onToast={setToast}
          />
        ) : null}
        {activeTab === "eligibility" ? (
          <EligibilityTab applicationId={id} onToast={setToast} />
        ) : null}
        {activeTab === "collaborators" ? (
          <CollaboratorsTab applicationId={id} onToast={setToast} />
        ) : null}
        {activeTab === "activity" ? <ActivityTab applicationId={id} /> : null}
      </main>

      {editOpen ? (
        <ApplicationEditDrawer
          application={application}
          pending={updateApplication.isPending}
          error={updateApplication.error}
          onClose={() => setEditOpen(false)}
          onSubmit={(patch) =>
            updateApplication.mutate({
              ...patch,
              expected_version: application.version,
            })
          }
        />
      ) : null}
      {duplicateOpen ? (
        <DuplicateApplication
          app={application}
          pending={duplicate.isPending}
          onClose={() => setDuplicateOpen(false)}
          onSubmit={(options) => duplicate.mutate(options)}
        />
      ) : null}
      {confirmAction === "archive" ? (
        <ConfirmationDialog
          title="Archive application?"
          confirmLabel="Archive application"
          pendingLabel="Archiving…"
          pending={archive.isPending}
          danger={false}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => archive.mutate(application.version)}
        >
          <p>
            This removes the application from active views. You can restore its
            stage later.
          </p>
        </ConfirmationDialog>
      ) : null}
      {confirmAction === "delete" ? (
        <ConfirmationDialog
          title="Delete application?"
          confirmLabel="Delete application"
          pendingLabel="Deleting…"
          pending={remove.isPending}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => remove.mutate()}
        >
          <p>
            The application will be removed. Documents in your vault will not be
            deleted.
          </p>
          {remove.error ? (
            <InlineError message={readableError(remove.error)} />
          ) : null}
        </ConfirmationDialog>
      ) : null}
      <FeedbackToast message={toast} onDismiss={() => setToast("")} />
    </div>
  );
}

function ApplicationTabs({
  active,
  counts,
  onOpen,
}: {
  active: Tab;
  counts: Partial<Record<Tab, number>>;
  onOpen: (tab: Tab) => void;
}) {
  return (
    <nav
      className="detail-tabs"
      aria-label="Application workspace"
      role="tablist"
    >
      {TABS.map((tab) => (
        <button
          key={tab}
          id={`tab-${tab}`}
          type="button"
          role="tab"
          aria-selected={active === tab}
          aria-controls={`panel-${tab}`}
          tabIndex={active === tab ? 0 : -1}
          className={active === tab ? "active" : undefined}
          onClick={() => onOpen(tab)}
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            const direction = event.key === "ArrowRight" ? 1 : -1;
            const next =
              TABS[(TABS.indexOf(tab) + direction + TABS.length) % TABS.length];
            onOpen(next);
          }}
        >
          {label(tab)}
          {counts[tab] !== undefined ? <span>{counts[tab]}</span> : null}
        </button>
      ))}
    </nav>
  );
}

function OverviewTab({
  workspace,
  readiness,
  readinessPending,
  eligibility,
  onEdit,
  onOpen,
}: {
  workspace: S["ApplicationWorkspaceResponse"];
  readiness?: S["ApplicationReadinessResponse"];
  readinessPending: boolean;
  eligibility?: S["EligibilityResponse"];
  onEdit: () => void;
  onOpen: (tab: Tab) => void;
}) {
  const { application, requirements, tasks, document_links: links } = workspace;
  const needsAttention = requirements.filter(
    (item) => item.required && !REQUIREMENT_DONE.has(item.status),
  );
  const upcomingTasks = tasks
    .filter((item) => !TASK_DONE.has(item.status))
    .sort(dateSort)
    .slice(0, 4);
  const readyRequirements = requirements.filter((item) =>
    REQUIREMENT_DONE.has(item.status),
  ).length;
  const completedTasks = tasks.filter(
    (item) => item.status === "completed",
  ).length;
  const linkedRequired = new Set(
    links.map((item) => item.requirement_id).filter(Boolean),
  ).size;
  const requiredCount = requirements.filter((item) => item.required).length;
  const nextAction =
    readiness?.recommended_next_actions[0] ?? "Review application details";
  const deadline = deadlineInfo(
    application.primary_deadline_at,
    application.stage,
  );

  return (
    <div className="detail-overview-grid">
      <div className="detail-overview-main">
        <section className="detail-section detail-details-section">
          <SectionHeading
            title="Application details"
            action={
              <button type="button" onClick={onEdit}>
                <Edit3 aria-hidden="true" /> Edit
              </button>
            }
          />
          <dl className="detail-definition-grid">
            <Definition term="Stage" value={label(application.stage)} />
            <Definition term="Priority" value={label(application.priority)} />
            <Definition
              term="Institution or provider"
              value={
                application.institution_display_name ||
                application.institution_name ||
                application.scholarship_display_name ||
                application.scholarship_name ||
                "Not linked"
              }
            />
            <Definition
              term="Programme or scholarship"
              value={
                application.programme_display_name ||
                application.programme_name ||
                application.scholarship_display_name ||
                application.scholarship_name ||
                application.title
              }
            />
            <Definition term="Intake" value={application.intake || "Not set"} />
            <Definition
              term="Deadline"
              value={formatDate(application.primary_deadline_at)}
            />
            <Definition
              term="Source"
              value={
                application.source_url ? (
                  <a
                    href={application.source_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open source
                  </a>
                ) : (
                  "Not added"
                )
              }
            />
            <Definition
              term="Last updated"
              value={formatDateTime(application.updated_at)}
            />
          </dl>
        </section>

        <section className="detail-next-action">
          <div className="detail-next-icon">
            <ChevronRight aria-hidden="true" />
          </div>
          <div>
            <h2>Next recommended action</h2>
            <p>{nextAction}</p>
          </div>
          <button
            className="primary"
            type="button"
            onClick={() =>
              onOpen(needsAttention.length ? "requirements" : "eligibility")
            }
          >
            Open next step
          </button>
        </section>

        <div className="detail-overview-split">
          <section className="detail-section">
            <SectionHeading title="Upcoming deadline" />
            <div
              className={`detail-deadline-block detail-deadline-${deadline.urgency}`}
            >
              <CalendarClock aria-hidden="true" />
              <div>
                <strong>{deadline.primary}</strong>
                <span>
                  {deadline.secondary || "No immediate deadline pressure"}
                </span>
              </div>
            </div>
          </section>
          <section className="detail-section">
            <SectionHeading
              title="Requirements needing attention"
              action={
                <button type="button" onClick={() => onOpen("requirements")}>
                  View all
                </button>
              }
            />
            {needsAttention.length ? (
              <ul className="detail-compact-list">
                {needsAttention.slice(0, 4).map((item) => (
                  <li key={item.id}>
                    <Circle aria-hidden="true" />
                    <span>
                      {item.title}
                      <small>{label(item.status)}</small>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="detail-quiet-success">
                <CheckCircle2 aria-hidden="true" /> Required items are ready.
              </p>
            )}
          </section>
        </div>

        <div className="detail-overview-split">
          <section className="detail-section">
            <SectionHeading
              title="Upcoming tasks"
              action={
                <button type="button" onClick={() => onOpen("tasks")}>
                  View all
                </button>
              }
            />
            {upcomingTasks.length ? (
              <ul className="detail-compact-list">
                {upcomingTasks.map((item) => (
                  <li key={item.id}>
                    <Circle aria-hidden="true" />
                    <span>
                      {item.title}
                      <small>{taskDueLabel(item)}</small>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="detail-muted-copy">You have no open tasks.</p>
            )}
          </section>
          <section className="detail-section">
            <SectionHeading
              title="Recently linked documents"
              action={
                <button type="button" onClick={() => onOpen("documents")}>
                  View all
                </button>
              }
            />
            {links.length ? (
              <ul className="detail-compact-list">
                {links.slice(0, 4).map((item) => (
                  <li key={item.id}>
                    <FileText aria-hidden="true" />
                    <span>
                      {item.document?.display_name || "Linked document"}
                      <small>
                        {item.requirement
                          ? item.requirement.title
                          : "Application-wide"}
                      </small>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="detail-muted-copy">
                No documents are linked to this application.
              </p>
            )}
          </section>
        </div>
      </div>

      <aside className="detail-readiness-panel">
        <div className="detail-readiness-heading">
          <div>
            <h2>Submission readiness</h2>
            <p>
              {readiness
                ? label(readiness.overall_state)
                : "Checking current state"}
            </p>
          </div>
          <strong>{readiness?.readiness_percent ?? 0}%</strong>
        </div>
        <ProgressBar
          percent={readiness?.readiness_percent ?? 0}
          label="Submission readiness"
        />
        {readinessPending ? (
          <ReadinessSkeleton />
        ) : (
          <>
            <dl className="detail-readiness-list">
              <Definition
                term="Requirements complete"
                value={`${readiness?.counts?.requirements_complete ?? readyRequirements} of ${readiness?.counts?.requirements_total ?? requirements.length}`}
              />
              <Definition
                term="Tasks complete"
                value={`${readiness?.counts?.tasks_complete ?? completedTasks} of ${readiness?.counts?.tasks_total ?? tasks.length}`}
              />
              <Definition
                term="Required documents linked"
                value={`${readiness?.counts?.required_documents_linked ?? linkedRequired} of ${readiness?.counts?.required_documents_total ?? requiredCount}`}
              />
              <Definition
                term="Eligibility checks"
                value={
                  eligibility
                    ? `${eligibility.findings.length} reviewed`
                    : "Not analysed"
                }
              />
              <Definition
                term="Blocking issues"
                value={String(readiness?.blocking_issues.length ?? 0)}
              />
            </dl>
            {readiness?.deadline_state === "expired" ? (
              <div className="detail-critical-blocker">
                <AlertCircle aria-hidden="true" />
                <span>
                  <strong>Deadline passed</strong>
                  <small>
                    Update the deadline or review whether this application
                    should remain active.
                  </small>
                </span>
              </div>
            ) : null}
            {readiness?.blocking_issues.length ? (
              <IssueList
                title="Blocking issues"
                items={readiness.blocking_issues}
              />
            ) : null}
            {readiness?.recommended_next_actions.length ? (
              <IssueList
                title="Recommended next steps"
                items={readiness.recommended_next_actions}
              />
            ) : null}
          </>
        )}
      </aside>
    </div>
  );
}

function RequirementsTab({
  applicationId,
  items,
  links,
  onOpen,
  onToast,
}: {
  applicationId: string;
  items: S["RequirementResponse"][];
  links: S["DocumentLinkResponse"][];
  onOpen: (tab: Tab, additions?: Record<string, string>) => void;
  onToast: (message: string) => void;
}) {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [editor, setEditor] = useState<S["RequirementResponse"] | "new" | null>(
    null,
  );
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<S["RequirementResponse"] | null>(
    null,
  );
  const status = params.get("requirementStatus") ?? "";
  const owner = params.get("requirementOwner") ?? "";
  const type = params.get("requirementType") ?? "";
  const setFilter = (key: string, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        value ? next.set(key, value) : next.delete(key);
        return next;
      },
      { replace: true },
    );
  const filtered = items.filter(
    (item) =>
      (!status || item.status === status) &&
      (!owner || item.owner === owner) &&
      (!type || item.requirement_type === type),
  );
  const linkedByRequirement = useMemo(() => {
    const counts = new Map<string, number>();
    links.forEach(
      (link) =>
        link.requirement_id &&
        counts.set(
          link.requirement_id,
          (counts.get(link.requirement_id) ?? 0) + 1,
        ),
    );
    return counts;
  }, [links]);
  const refresh = () =>
    invalidateApplicationResource(qc, applicationId, "requirements");
  const save = useMutation({
    mutationFn: ({
      initial,
      body,
    }: {
      initial?: S["RequirementResponse"];
      body: S["RequirementCreate"] | S["RequirementUpdate"];
    }) =>
      initial
        ? applicationsApi.updateRequirement(applicationId, initial.id, {
            ...(body as S["RequirementUpdate"]),
            expected_version: initial.version,
          })
        : applicationsApi.addRequirement(
            applicationId,
            body as S["RequirementCreate"],
          ),
    onSuccess: async (_, variables) => {
      setEditor(null);
      onToast(
        variables.initial ? "Requirement updated." : "Requirement added.",
      );
      await refresh();
    },
  });
  const bulk = useMutation({
    mutationFn: (rows: S["RequirementCreate"][]) =>
      applicationsApi.addRequirements(applicationId, {
        mutation_id: newMutationId(),
        items: rows,
      }),
    onSuccess: async (_, rows) => {
      setBulkOpen(false);
      onToast(`${rows.length} requirements added.`);
      await refresh();
    },
  });
  const markReady = useMutation({
    mutationFn: (item: S["RequirementResponse"]) =>
      applicationsApi.updateRequirement(applicationId, item.id, {
        status: "complete",
        expected_version: item.version,
      }),
    onSuccess: async () => {
      onToast("Requirement marked complete.");
      await refresh();
    },
  });
  const duplicate = useMutation({
    mutationFn: (item: S["RequirementResponse"]) =>
      applicationsApi.addRequirement(applicationId, {
        requirement_type: item.requirement_type,
        title: `${item.title} (copy)`,
        status: "not_started",
        required: item.required,
        owner: item.owner,
        due_at: item.due_at,
        source_url: item.source_url,
        notes: item.notes,
      }),
    onSuccess: async () => {
      onToast("Requirement duplicated.");
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (item: S["RequirementResponse"]) =>
      applicationsApi.deleteRequirement(applicationId, item.id),
    onSuccess: async () => {
      setDeleteItem(null);
      onToast("Requirement deleted.");
      await refresh();
    },
  });
  const error =
    save.error ||
    bulk.error ||
    markReady.error ||
    duplicate.error ||
    remove.error;
  const completed = items.filter((item) =>
    REQUIREMENT_DONE.has(item.status),
  ).length;
  const blocked = items.filter(
    (item) => item.readiness_state === "blocked",
  ).length;
  const types = [...new Set(items.map((item) => item.requirement_type))].sort();

  return (
    <section className="detail-section detail-resource-section">
      <ResourceHeader
        title="Requirements"
        description="Track every document, form and action needed for a complete submission."
        actions={
          <>
            <button type="button" onClick={() => setBulkOpen(true)}>
              Add multiple
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => setEditor("new")}
            >
              <Plus aria-hidden="true" /> Add requirement
            </button>
          </>
        }
      />
      <div className="detail-summary-chips" aria-label="Requirement summary">
        <SummaryChip label="Complete" value={completed} />
        <SummaryChip label="Needs attention" value={items.length - completed} />
        <SummaryChip
          label="Validation issues"
          value={blocked}
          tone={blocked ? "danger" : undefined}
        />
        <SummaryChip
          label="Required"
          value={items.filter((item) => item.required).length}
        />
      </div>
      <div className="detail-filter-bar">
        <Filter aria-hidden="true" />
        <Select
          value={status}
          onChange={(value) =>
            setFilter("requirementStatus", selectValue(value))
          }
          options={[
            { value: "", label: "All statuses" },
            ...[
              "not_started",
              "in_progress",
              "ready",
              "needs_review",
              "blocked",
              "complete",
              "submitted",
              "waived",
            ].map((value) => ({ value, label: label(value) })),
          ]}
        />
        <Select
          value={owner}
          onChange={(value) =>
            setFilter("requirementOwner", selectValue(value))
          }
          options={[
            { value: "", label: "All owners" },
            ...["student", "recommender", "institution", "advisor"].map(
              (value) => ({ value, label: label(value) }),
            ),
          ]}
        />
        <Select
          value={type}
          onChange={(value) => setFilter("requirementType", selectValue(value))}
          options={[
            { value: "", label: "All types" },
            ...types.map((value) => ({ value, label: label(value) })),
          ]}
        />
      </div>
      {error ? (
        error instanceof ApiError && error.code === "CONFLICT" ? (
          <ConflictNotice onRefresh={() => void refresh()} />
        ) : (
          <InlineError message={readableError(error)} />
        )
      ) : null}
      {filtered.length ? (
        <div className="detail-data-list" role="list">
          {filtered.map((item) => {
            const linked = linkedByRequirement.get(item.id) ?? 0;
            const needsResolution = ["blocked", "needs_review"].includes(
              item.readiness_state,
            );
            return (
              <article
                className="detail-data-row requirement-row"
                key={item.id}
                role="listitem"
              >
                <div className="detail-row-leading">
                  <RequirementStateIcon item={item} />
                </div>
                <div className="detail-row-main">
                  <div className="detail-row-title">
                    <strong>{item.title}</strong>
                    {item.required ? (
                      <StatusBadge tone="neutral">Required</StatusBadge>
                    ) : (
                      <span className="detail-optional">Optional</span>
                    )}
                  </div>
                  <div className="detail-row-meta">
                    <span>{label(item.requirement_type)}</span>
                    <span>{label(item.owner)}</span>
                    <span>{formatDate(item.due_at ?? null)}</span>
                    <span>
                      {linked} linked {linked === 1 ? "document" : "documents"}
                    </span>
                  </div>
                  <div className="detail-row-status">
                    <StatusBadge tone={requirementTone(item.status)}>
                      {label(item.status)}
                    </StatusBadge>
                    <span>{validationLabel(item.validation_state)}</span>
                    {item.related_task ? (
                      <span>Task: {item.related_task.title}</span>
                    ) : null}
                  </div>
                </div>
                <div className="detail-row-actions">
                  {needsResolution ? (
                    <button
                      type="button"
                      className="primary"
                      onClick={() => setEditor(item)}
                    >
                      Resolve issue
                    </button>
                  ) : item.required && linked === 0 ? (
                    <button
                      type="button"
                      className="primary"
                      onClick={() =>
                        onOpen("documents", { requirement: item.id })
                      }
                    >
                      <FilePlus2 aria-hidden="true" /> Add document
                    </button>
                  ) : !REQUIREMENT_DONE.has(item.status) ? (
                    <button
                      type="button"
                      className="primary"
                      disabled={markReady.isPending}
                      onClick={() => markReady.mutate(item)}
                    >
                      Mark complete
                    </button>
                  ) : (
                    <button type="button" onClick={() => setEditor(item)}>
                      Open requirement
                    </button>
                  )}
                  <OverflowMenu
                    label={`More actions for ${item.title}`}
                    items={[
                      {
                        key: "edit",
                        label: "Edit",
                        icon: Edit3,
                        onClick: () => setEditor(item),
                      },
                      {
                        key: "duplicate",
                        label: "Duplicate",
                        icon: Copy,
                        disabled: duplicate.isPending,
                        onClick: () => duplicate.mutate(item),
                      },
                      { key: "divider", divider: true },
                      {
                        key: "delete",
                        label: "Delete",
                        icon: Trash2,
                        danger: true,
                        onClick: () => setDeleteItem(item),
                      },
                    ]}
                  />
                </div>
              </article>
            );
          })}
        </div>
      ) : items.length ? (
        <EmptyState
          icon={Filter}
          heading="No requirements match these filters"
          description="Adjust the status, owner or type filters to see more requirements."
          variant="filtered"
        />
      ) : (
        <EmptyState
          icon={ListChecks}
          heading="No requirements added yet"
          description="Add the documents, forms and actions needed for submission."
          primaryAction={{
            label: "Add requirement",
            onClick: () => setEditor("new"),
          }}
        />
      )}
      {editor ? (
        <RequirementDrawer
          initial={editor === "new" ? undefined : editor}
          pending={save.isPending}
          error={save.error}
          onClose={() => setEditor(null)}
          onSubmit={(body) =>
            save.mutate({
              initial: editor === "new" ? undefined : editor,
              body,
            })
          }
        />
      ) : null}
      {bulkOpen ? (
        <RequirementBulkDrawer
          pending={bulk.isPending}
          error={bulk.error}
          onClose={() => setBulkOpen(false)}
          onSubmit={(rows) => bulk.mutate(rows)}
        />
      ) : null}
      {deleteItem ? (
        <ConfirmationDialog
          title="Delete requirement?"
          confirmLabel="Delete requirement"
          pending={remove.isPending}
          onCancel={() => setDeleteItem(null)}
          onConfirm={() => remove.mutate(deleteItem)}
        >
          <p>
            “{deleteItem.title}” will be removed. Linked documents remain in the
            vault.
          </p>
        </ConfirmationDialog>
      ) : null}
    </section>
  );
}

function TasksTab({
  applicationId,
  items,
  requirements,
  collaborators,
  onToast,
}: {
  applicationId: string;
  items: S["TaskResponse"][];
  requirements: S["RequirementResponse"][];
  collaborators: S["CollaboratorResponse"][];
  onToast: (message: string) => void;
}) {
  const qc = useQueryClient();
  const [editor, setEditor] = useState<S["TaskResponse"] | "new" | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<S["TaskResponse"] | null>(null);
  const refresh = () =>
    invalidateApplicationResource(qc, applicationId, "tasks");
  const save = useMutation({
    mutationFn: ({
      initial,
      body,
    }: {
      initial?: S["TaskResponse"];
      body: S["TaskCreate"] | S["TaskUpdate"];
    }) =>
      initial
        ? applicationsApi.updateTask(applicationId, initial.id, {
            ...(body as S["TaskUpdate"]),
            expected_version: initial.version,
          })
        : applicationsApi.addTask(applicationId, body as S["TaskCreate"]),
    onSuccess: async (_, variables) => {
      setEditor(null);
      onToast(variables.initial ? "Task updated." : "Task added.");
      await refresh();
    },
  });
  const bulk = useMutation({
    mutationFn: (rows: S["TaskCreate"][]) =>
      applicationsApi.addTasks(applicationId, {
        mutation_id: newMutationId(),
        items: rows,
      }),
    onSuccess: async (_, rows) => {
      setBulkOpen(false);
      onToast(`${rows.length} tasks added.`);
      await refresh();
    },
  });
  const toggle = useMutation({
    mutationFn: (item: S["TaskResponse"]) =>
      applicationsApi.updateTask(applicationId, item.id, {
        status: item.status === "completed" ? "open" : "completed",
        expected_version: item.version,
      }),
    onSuccess: async (_, item) => {
      onToast(
        item.status === "completed" ? "Task reopened." : "Task completed.",
      );
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (item: S["TaskResponse"]) =>
      applicationsApi.deleteTask(applicationId, item.id),
    onSuccess: async () => {
      setDeleteItem(null);
      onToast("Task deleted.");
      await refresh();
    },
  });
  const groups = taskGroups(items);
  const error = save.error || bulk.error || toggle.error || remove.error;

  return (
    <section className="detail-section detail-resource-section">
      <ResourceHeader
        title="Tasks"
        description="Plan the work that moves this application toward submission."
        actions={
          <>
            <button type="button" onClick={() => setBulkOpen(true)}>
              Add multiple
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => setEditor("new")}
            >
              <Plus aria-hidden="true" /> Add task
            </button>
          </>
        }
      />
      <div className="detail-summary-chips" aria-label="Task schedule summary">
        {(
          ["overdue", "today", "upcoming", "unscheduled", "completed"] as const
        ).map((group) => (
          <SummaryChip
            key={group}
            label={group === "unscheduled" ? "No due date" : label(group)}
            value={groups[group].length}
            tone={
              group === "overdue" && groups[group].length ? "danger" : undefined
            }
          />
        ))}
      </div>
      {error ? (
        error instanceof ApiError && error.code === "CONFLICT" ? (
          <ConflictNotice onRefresh={() => void refresh()} />
        ) : (
          <InlineError message={readableError(error)} />
        )
      ) : null}
      {items.length ? (
        <div className="detail-task-groups">
          {(
            [
              "overdue",
              "today",
              "upcoming",
              "unscheduled",
              "completed",
            ] as const
          ).map((group) =>
            groups[group].length ? (
              <section key={group} className="detail-task-group">
                <h3>
                  {group === "unscheduled" ? "No due date" : label(group)}{" "}
                  <span>{groups[group].length}</span>
                </h3>
                <div className="detail-data-list">
                  {groups[group].map((item) => (
                    <article className="detail-data-row task-row" key={item.id}>
                      <button
                        type="button"
                        className="detail-task-check"
                        aria-label={
                          item.status === "completed"
                            ? `Reopen ${item.title}`
                            : `Complete ${item.title}`
                        }
                        disabled={toggle.isPending}
                        onClick={() => toggle.mutate(item)}
                      >
                        {item.status === "completed" ? (
                          <Check aria-hidden="true" />
                        ) : (
                          <Circle aria-hidden="true" />
                        )}
                      </button>
                      <div className="detail-row-main">
                        <strong>{item.title}</strong>
                        <div className="detail-row-meta">
                          <span>{taskDueLabel(item)}</span>
                          <span>{label(item.status)}</span>
                          <span>{label(item.priority)}</span>
                          {item.related_requirement ? (
                            <span>{item.related_requirement.title}</span>
                          ) : null}
                          {item.assignee ? (
                            <span>
                              {item.assignee.name || item.assignee.email}
                            </span>
                          ) : null}
                          {item.reminder_status !== "none" ? (
                            <span>Reminder {label(item.reminder_status)}</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="detail-row-actions">
                        <button
                          type="button"
                          onClick={() => toggle.mutate(item)}
                          disabled={toggle.isPending}
                        >
                          {item.status === "completed" ? "Reopen" : "Complete"}
                        </button>
                        <OverflowMenu
                          label={`More actions for ${item.title}`}
                          items={[
                            {
                              key: "edit",
                              label: "Edit",
                              icon: Edit3,
                              onClick: () => setEditor(item),
                            },
                            {
                              key: "reschedule",
                              label: "Reschedule",
                              icon: CalendarClock,
                              onClick: () => setEditor(item),
                            },
                            { key: "divider", divider: true },
                            {
                              key: "delete",
                              label: "Delete",
                              icon: Trash2,
                              danger: true,
                              onClick: () => setDeleteItem(item),
                            },
                          ]}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null,
          )}
        </div>
      ) : (
        <EmptyState
          icon={CheckCircle2}
          heading="You have no open tasks"
          description="Add a task when there is a concrete next step, deadline or follow-up."
          primaryAction={{ label: "Add task", onClick: () => setEditor("new") }}
        />
      )}
      {editor ? (
        <TaskDrawer
          initial={editor === "new" ? undefined : editor}
          requirements={requirements}
          collaborators={collaborators}
          pending={save.isPending}
          error={save.error}
          onClose={() => setEditor(null)}
          onSubmit={(body) =>
            save.mutate({
              initial: editor === "new" ? undefined : editor,
              body,
            })
          }
        />
      ) : null}
      {bulkOpen ? (
        <TaskBulkDrawer
          pending={bulk.isPending}
          error={bulk.error}
          onClose={() => setBulkOpen(false)}
          onSubmit={(rows) => bulk.mutate(rows)}
        />
      ) : null}
      {deleteItem ? (
        <ConfirmationDialog
          title="Delete task?"
          confirmLabel="Delete task"
          pending={remove.isPending}
          onCancel={() => setDeleteItem(null)}
          onConfirm={() => remove.mutate(deleteItem)}
        >
          <p>“{deleteItem.title}” will be removed from this application.</p>
        </ConfirmationDialog>
      ) : null}
    </section>
  );
}

function DocumentsTab({
  applicationId,
  requirements,
  initialLinks,
  documents,
  documentsPending,
  documentsError,
  retryDocuments,
  onToast,
}: {
  applicationId: string;
  requirements: S["RequirementResponse"][];
  initialLinks: S["DocumentLinkResponse"][];
  documents: S["DocumentResponse"][];
  documentsPending: boolean;
  documentsError: boolean;
  retryDocuments: () => void;
  onToast: (message: string) => void;
}) {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const [linkOpen, setLinkOpen] = useState(false);
  const [editItem, setEditItem] = useState<S["DocumentLinkResponse"] | null>(
    null,
  );
  const [unlinkItem, setUnlinkItem] = useState<
    S["DocumentLinkResponse"] | null
  >(null);
  useEffect(() => {
    if (params.get("requirement")) setLinkOpen(true);
  }, [params]);
  const links = useQuery({
    queryKey: queryKeys.applicationDocuments(applicationId),
    queryFn: () => applicationsApi.documentLinks(applicationId),
    initialData: initialLinks,
  });
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({
        queryKey: queryKeys.applicationDocuments(applicationId),
      }),
      qc.invalidateQueries({ queryKey: queryKeys.workspace(applicationId) }),
      qc.invalidateQueries({ queryKey: queryKeys.readiness(applicationId) }),
      qc.invalidateQueries({
        queryKey: queryKeys.applicationHistory(applicationId),
      }),
    ]);
  const link = useMutation({
    mutationFn: (
      body: Pick<S["DocumentLinkCreate"], "document_id" | "requirement_id">,
    ) =>
      applicationsApi.linkDocument(applicationId, {
        ...body,
        mutation_id: newMutationId(),
      }),
    onSuccess: async () => {
      setLinkOpen(false);
      onToast("Document linked.");
      await refresh();
    },
  });
  const changeLink = useMutation({
    mutationFn: ({
      item,
      body,
    }: {
      item: S["DocumentLinkResponse"];
      body: Pick<S["DocumentLinkUpdate"], "document_id" | "requirement_id">;
    }) =>
      applicationsApi.updateDocumentLink(applicationId, item.id, {
        ...body,
        mutation_id: newMutationId(),
        expected_version: item.version,
      }),
    onSuccess: async () => {
      setEditItem(null);
      onToast("Document link updated.");
      await refresh();
    },
  });
  const unlink = useMutation({
    mutationFn: (item: S["DocumentLinkResponse"]) =>
      applicationsApi.unlinkDocument(applicationId, item.id),
    onSuccess: async () => {
      setUnlinkItem(null);
      onToast("Document unlinked. The file remains in your vault.");
      await refresh();
    },
  });
  const documentMap = new Map(documents.map((item) => [item.id, item]));
  const requirementMap = new Map(requirements.map((item) => [item.id, item]));
  const linkedRequirementIds = new Set(
    (links.data ?? []).map((item) => item.requirement_id).filter(Boolean),
  );
  const missing = requirements.filter(
    (item) => item.required && !linkedRequirementIds.has(item.id),
  );
  const linkedDocuments = (links.data ?? []).map((item) => ({
    link: item,
    document: item.document ?? documentMap.get(item.document_id),
  }));
  const processing = linkedDocuments.filter(
    ({ document }) => document?.malware_status === "pending",
  ).length;
  const review = linkedDocuments.filter(
    ({ document }) =>
      document &&
      document.malware_status !== "clean" &&
      document.malware_status !== "pending",
  ).length;

  return (
    <section className="detail-section detail-resource-section">
      <ResourceHeader
        title="Documents"
        description="Connect secure vault documents to the requirements they support."
        actions={
          <>
            <Link className="detail-secondary-link" to="/app/documents">
              Open document vault
            </Link>
            <button
              type="button"
              className="primary"
              onClick={() => setLinkOpen(true)}
            >
              <Link2 aria-hidden="true" /> Link document
            </button>
          </>
        }
      />
      <div className="detail-summary-chips">
        <SummaryChip label="Linked" value={linkedDocuments.length} />
        <SummaryChip
          label="Missing required"
          value={missing.length}
          tone={missing.length ? "danger" : undefined}
        />
        <SummaryChip label="Processing" value={processing} />
        <SummaryChip label="Needs review" value={review} />
      </div>
      {documentsError ? (
        <InlineError
          message="Vault documents could not be loaded."
          onRetry={retryDocuments}
        />
      ) : null}
      {documentsPending ? (
        <ResourceRowsSkeleton />
      ) : linkedDocuments.length ? (
        <div className="detail-data-list">
          {linkedDocuments.map(({ link: item, document }) => (
            <article className="detail-data-row document-row" key={item.id}>
              <div className="detail-file-icon">
                <FileText aria-hidden="true" />
              </div>
              <div className="detail-row-main">
                <div className="detail-row-title">
                  <strong>{document?.display_name || "Linked document"}</strong>
                  <StatusBadge
                    tone={
                      document?.malware_status === "clean"
                        ? "green"
                        : document?.malware_status === "pending"
                          ? "amber"
                          : "red"
                    }
                  >
                    {securityStatus(document?.malware_status)}
                  </StatusBadge>
                </div>
                <div className="detail-row-meta">
                  <span>
                    {document ? label(document.category) : "Document"}
                  </span>
                  <span>
                    {item.requirement_id
                      ? requirementMap.get(item.requirement_id)?.title ||
                        "Linked requirement"
                      : "Application-wide"}
                  </span>
                  <span>Added {formatDate(item.created_at)}</span>
                  <span>
                    {document?.expires_at
                      ? `Expires ${formatDate(document.expires_at)}`
                      : "No expiration"}
                  </span>
                </div>
                <small>Source: Document vault</small>
              </div>
              <div className="detail-row-actions">
                {document ? (
                  <Link to={`/app/documents/${document.id}`}>Preview</Link>
                ) : null}
                <OverflowMenu
                  label={`More actions for ${document?.display_name || "linked document"}`}
                  items={[
                    ...(document
                      ? [
                          {
                            key: "open",
                            label: "Open in document vault",
                            icon: FileText,
                            onClick: () =>
                              location.assign(`/app/documents/${document.id}`),
                          },
                        ]
                      : []),
                    {
                      key: "replace",
                      label: "Replace document",
                      icon: RotateCcw,
                      onClick: () => setEditItem(item),
                    },
                    {
                      key: "requirement",
                      label: "Change requirement",
                      icon: Link2,
                      onClick: () => setEditItem(item),
                    },
                    { key: "divider", divider: true as const },
                    {
                      key: "unlink",
                      label: "Unlink",
                      icon: Unlink,
                      danger: true,
                      onClick: () => setUnlinkItem(item),
                    },
                  ]}
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          heading="No documents are linked to this application"
          description="Link a secure document from your vault to the application or a specific requirement."
          primaryAction={{
            label: "Link document",
            onClick: () => setLinkOpen(true),
          }}
          secondaryAction={
            <Link to="/app/documents?upload=1">Upload document</Link>
          }
        />
      )}
      {missing.length ? (
        <section className="detail-missing-documents">
          <h3>Missing required documents</h3>
          <ul>
            {missing.map((item) => (
              <li key={item.id}>
                <AlertCircle aria-hidden="true" />
                <span>{item.title}</span>
                <button type="button" onClick={() => setLinkOpen(true)}>
                  Link document
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {linkOpen ? (
        <LinkDocumentDrawer
          documents={documents}
          linkedIds={
            new Set((links.data ?? []).map((item) => item.document_id))
          }
          requirements={requirements}
          initialRequirementId={params.get("requirement") ?? ""}
          pending={link.isPending}
          error={link.error}
          onClose={() => setLinkOpen(false)}
          onSubmit={(body) => link.mutate(body)}
        />
      ) : null}
      {editItem ? (
        <LinkDocumentDrawer
          documents={documents}
          linkedIds={
            new Set(
              (links.data ?? [])
                .filter((item) => item.id !== editItem.id)
                .map((item) => item.document_id),
            )
          }
          requirements={requirements}
          initialRequirementId={editItem.requirement_id ?? ""}
          initialDocumentId={editItem.document_id}
          title="Update document link"
          pending={changeLink.isPending}
          error={changeLink.error}
          onClose={() => setEditItem(null)}
          onSubmit={(body) => changeLink.mutate({ item: editItem, body })}
        />
      ) : null}
      {unlinkItem ? (
        <ConfirmationDialog
          title="Unlink document?"
          confirmLabel="Unlink document"
          pending={unlink.isPending}
          onCancel={() => setUnlinkItem(null)}
          onConfirm={() => unlink.mutate(unlinkItem)}
        >
          <p>
            This removes the link only. The document remains secure in your
            vault.
          </p>
          {unlink.error ? (
            <InlineError message={readableError(unlink.error)} />
          ) : null}
        </ConfirmationDialog>
      ) : null}
    </section>
  );
}

function EligibilityTab({
  applicationId,
  onToast,
}: {
  applicationId: string;
  onToast: (message: string) => void;
}) {
  const qc = useQueryClient();
  const current = useQuery({
    queryKey: queryKeys.eligibility(applicationId),
    queryFn: () => intelligenceApi.currentEligibility(applicationId),
    retry: false,
  });
  const history = useQuery({
    queryKey: queryKeys.eligibilityHistory(applicationId),
    queryFn: () => intelligenceApi.eligibilityHistory(applicationId),
  });
  const refresh = useMutation({
    mutationFn: () =>
      intelligenceApi.recalculateEligibility(applicationId, {
        mutation_id: newMutationId(),
      }),
    onSuccess: async (value) => {
      qc.setQueryData(queryKeys.eligibility(applicationId), value);
      onToast("Eligibility analysis refreshed.");
      await Promise.all([
        qc.invalidateQueries({
          queryKey: queryKeys.eligibilityHistory(applicationId),
        }),
        qc.invalidateQueries({ queryKey: queryKeys.readiness(applicationId) }),
      ]);
    },
  });
  if (current.isPending) return <EligibilitySkeleton />;
  if (current.isError || !isEligibilityResponse(current.data))
    return (
      <section className="detail-section">
        <ResourceHeader
          title="Eligibility"
          description="Review evidence used to support application preparation."
          actions={
            <button
              type="button"
              className="primary"
              disabled={refresh.isPending}
              onClick={() => refresh.mutate()}
            >
              <ShieldCheck aria-hidden="true" />{" "}
              {refresh.isPending ? "Analysing…" : "Refresh analysis"}
            </button>
          }
        />
        <EmptyState
          icon={ShieldCheck}
          heading="No eligibility analysis yet"
          description="Refresh the analysis to review available profile and application evidence."
          primaryAction={{
            label: "Refresh analysis",
            onClick: () => refresh.mutate(),
          }}
        />
        {refresh.error ? (
          <InlineError message={readableError(refresh.error)} />
        ) : null}
      </section>
    );
  const result = current.data;
  const historyItems = Array.isArray(history.data?.items)
    ? history.data.items
    : [];
  const findings = result.findings.map(normalizeFinding);
  const status = label(result.overall_status);
  const sources = result.data_sources;
  return (
    <section className="detail-section detail-resource-section eligibility-workspace">
      <ResourceHeader
        title="Eligibility review"
        description="Evidence-based preparation guidance, with the source and reasoning visible for every check."
        actions={
          <button
            type="button"
            className="primary"
            disabled={refresh.isPending}
            onClick={() => refresh.mutate()}
          >
            <RefreshCw aria-hidden="true" />{" "}
            {refresh.isPending ? "Refreshing analysis…" : "Refresh analysis"}
          </button>
        }
      />
      <div className="eligibility-summary-band">
        <div>
          <span>Overall readiness</span>
          <strong>{result.readiness_score}/100</strong>
        </div>
        <div>
          <span>Eligibility status</span>
          <StatusBadge
            tone={
              status === "Meets requirement"
                ? "green"
                : status === "Does not meet"
                  ? "red"
                  : "amber"
            }
          >
            {status}
          </StatusBadge>
        </div>
        <div>
          <span>Last calculated</span>
          <strong>{formatDateTime(result.last_calculated_at)}</strong>
        </div>
      </div>
      <div className="eligibility-layout">
        <div className="eligibility-main">
          <section>
            <h3>Checks and evidence</h3>
            <div className="eligibility-checks">
              {findings.length ? (
                findings.map((item, index) => (
                  <article key={`${item.title}-${index}`}>
                    <div className="eligibility-check-head">
                      <strong>{item.title}</strong>
                      <StatusBadge tone={eligibilityTone(item.status)}>
                        {item.status}
                      </StatusBadge>
                    </div>
                    <dl>
                      <Definition
                        term="Evidence used"
                        value={
                          item.evidence ||
                          "No supporting evidence was available"
                        }
                      />
                      <Definition
                        term="Why this result"
                        value={
                          item.explanation ||
                          "The analysis did not return additional reasoning"
                        }
                      />
                      <Definition
                        term="What to do next"
                        value={item.nextAction}
                      />
                    </dl>
                  </article>
                ))
              ) : (
                <p className="detail-muted-copy">
                  No individual checks were returned.
                </p>
              )}
            </div>
          </section>
          <section>
            <h3>Analysis history</h3>
            {history.isPending ? (
              <ResourceRowsSkeleton />
            ) : historyItems.length ? (
              <div className="eligibility-history-list">
                {historyItems.map((item, index, all) => (
                  <details key={item.id}>
                    <summary>
                      <span>
                        <strong>{item.readiness_score}/100</strong>
                        <small>{formatDateTime(item.created_at)}</small>
                      </span>
                      <span>
                        {item.important_changes[0] ||
                          scoreChange(item, all[index + 1])}
                      </span>
                    </summary>
                    <div className="eligibility-history-details">
                      <Definition
                        term="Trigger"
                        value={label(item.trigger_source)}
                      />
                      {Object.entries(item.readiness_components).map(
                        ([key, value]) => (
                          <Definition
                            key={key}
                            term={label(key)}
                            value={`${String(value)}%`}
                          />
                        ),
                      )}
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <p className="detail-muted-copy">
                Previous analyses will appear here after the next refresh.
              </p>
            )}
          </section>
        </div>
        <aside className="eligibility-aside">
          <section>
            <h3>Data sources used</h3>
            <ul>
              {sources.length ? (
                sources.map((source) => (
                  <li key={`${source.source}-${source.source_id ?? ""}`}>
                    <CheckCircle2 aria-hidden="true" /> {source.label}
                  </li>
                ))
              ) : (
                <li>
                  <AlertCircle aria-hidden="true" /> No confirmed data sources
                  were available
                </li>
              )}
            </ul>
          </section>
          <section>
            <h3>Readiness components</h3>
            {Object.entries(result.readiness_components).map(([key, value]) => (
              <div className="eligibility-component" key={key}>
                <span>{label(key)}</span>
                <ProgressBar percent={Number(value) || 0} />
              </div>
            ))}
          </section>
          {result.risks.length ? (
            <IssueList
              title="Blocking issues and warnings"
              items={result.risks.map(renderFindingValue)}
            />
          ) : null}
          {result.questions.length ? (
            <IssueList
              title="Recommended actions"
              items={result.questions.map(renderFindingValue)}
            />
          ) : null}
        </aside>
      </div>
      <p className="eligibility-disclaimer">
        This analysis supports preparation and does not guarantee admission,
        eligibility or funding.
      </p>
      {refresh.error ? (
        <InlineError message={readableError(refresh.error)} />
      ) : null}
    </section>
  );
}

function CollaboratorsTab({
  applicationId,
  onToast,
}: {
  applicationId: string;
  onToast: (message: string) => void;
}) {
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [revokeItem, setRevokeItem] = useState<
    S["CollaboratorResponse"] | null
  >(null);
  const collaborators = useQuery({
    queryKey: queryKeys.collaborators(applicationId),
    queryFn: () => collaborationApi.list(applicationId),
  });
  const capabilities = useQuery({
    queryKey: queryKeys.collaborationCapabilities(applicationId),
    queryFn: () => collaborationApi.capabilities(applicationId),
    retry: false,
  });
  const refresh = () =>
    qc.invalidateQueries({ queryKey: queryKeys.collaborators(applicationId) });
  const invite = useMutation({
    mutationFn: (body: S["CollaboratorInvite"]) =>
      collaborationApi.invite(applicationId, body),
    onSuccess: async () => {
      setInviteOpen(false);
      onToast("Collaborator invited.");
      await refresh();
    },
  });
  const update = useMutation({
    mutationFn: ({
      item,
      role,
    }: {
      item: S["CollaboratorResponse"];
      role: S["CollaboratorUpdate"]["role"];
    }) => collaborationApi.update(applicationId, item.id, { role }),
    onSuccess: async () => {
      onToast("Collaborator role updated.");
      await refresh();
    },
  });
  const revoke = useMutation({
    mutationFn: (item: S["CollaboratorResponse"]) =>
      collaborationApi.remove(applicationId, item.id),
    onSuccess: async () => {
      setRevokeItem(null);
      onToast("Collaborator access revoked.");
      await refresh();
    },
  });
  const resend = useMutation({
    mutationFn: (item: S["CollaboratorResponse"]) =>
      collaborationApi.resend(applicationId, item.id),
    onSuccess: async () => {
      onToast("Invitation resent.");
      await refresh();
    },
  });
  const copyInvitation = useMutation({
    mutationFn: (item: S["CollaboratorResponse"]) =>
      collaborationApi.invitationLink(applicationId, item.id),
    onSuccess: async (value) => {
      await navigator.clipboard.writeText(value.invitation_url);
      onToast("A refreshed invitation link was copied.");
      await refresh();
    },
  });
  const canManage = capabilities.data?.actions.invite_collaborators === true;
  const roleOptions = capabilities.data?.supported_roles ?? [];
  const collaboratorItems = Array.isArray(collaborators.data)
    ? collaborators.data
    : [];
  const active = collaboratorItems.filter((item) => item.status === "active");
  const pending = collaboratorItems.filter(
    (item) => item.status !== "active" && item.status !== "revoked",
  );
  const error =
    invite.error ||
    update.error ||
    revoke.error ||
    resend.error ||
    copyInvitation.error;
  return (
    <section className="detail-section detail-resource-section collaborators-workspace">
      <ResourceHeader
        title="Collaborators"
        description="Collaborators only receive the access permitted by their role."
        actions={
          <div className="detail-collaborator-actions">
            <StatusBadge tone="blue">
              Your role:{" "}
              {label(capabilities.data?.current_user_role || "owner")}
            </StatusBadge>
            {canManage ? (
              <button
                type="button"
                className="primary"
                onClick={() => setInviteOpen(true)}
              >
                <UserPlus aria-hidden="true" /> Invite collaborator
              </button>
            ) : null}
          </div>
        }
      />
      {collaborators.isPending ? (
        <ResourceRowsSkeleton />
      ) : collaborators.isError ? (
        <InlineError
          message="Collaborators could not be loaded."
          onRetry={() => void collaborators.refetch()}
        />
      ) : (
        <>
          <CollaboratorGroup
            title="Collaborators"
            items={active}
            empty="No active collaborators."
            canManage={canManage}
            capabilities={capabilities.data?.actions}
            roleOptions={roleOptions}
            updatePending={update.isPending}
            onRole={(item, role) => update.mutate({ item, role })}
            onResend={(item) => resend.mutate(item)}
            onCopyInvitation={(item) => copyInvitation.mutate(item)}
            onRevoke={setRevokeItem}
          />
          <CollaboratorGroup
            title="Pending invitations"
            items={pending}
            empty="No pending invitations."
            canManage={canManage}
            capabilities={capabilities.data?.actions}
            roleOptions={roleOptions}
            updatePending={update.isPending}
            onRole={(item, role) => update.mutate({ item, role })}
            onResend={(item) => resend.mutate(item)}
            onCopyInvitation={(item) => copyInvitation.mutate(item)}
            onRevoke={setRevokeItem}
          />
        </>
      )}
      {!collaborators.isPending && !collaboratorItems.length ? (
        <EmptyState
          icon={Users}
          heading="No collaborators have been invited"
          description="Invite a viewer, reviewer or editor when someone needs access to this application."
          primaryAction={
            canManage
              ? {
                  label: "Invite collaborator",
                  onClick: () => setInviteOpen(true),
                }
              : undefined
          }
        />
      ) : null}
      {error ? <InlineError message={readableError(error)} /> : null}
      {inviteOpen ? (
        <InviteCollaboratorDrawer
          roleOptions={roleOptions}
          pending={invite.isPending}
          error={invite.error}
          onClose={() => setInviteOpen(false)}
          onSubmit={(body) => invite.mutate(body)}
        />
      ) : null}
      {revokeItem ? (
        <ConfirmationDialog
          title="Revoke collaborator access?"
          confirmLabel="Revoke access"
          pending={revoke.isPending}
          onCancel={() => setRevokeItem(null)}
          onConfirm={() => revoke.mutate(revokeItem)}
        >
          <p>
            {revokeItem.invited_email} will no longer be able to access this
            application.
          </p>
        </ConfirmationDialog>
      ) : null}
    </section>
  );
}

function ActivityTab({ applicationId }: { applicationId: string }) {
  const [params, setParams] = useSearchParams();
  const filter = params.get("activity") ?? "all";
  const activity = useInfiniteQuery({
    queryKey: queryKeys.applicationActivity(applicationId, filter),
    queryFn: ({ pageParam }) =>
      applicationsApi.activity(
        applicationId,
        filter === "all" ? undefined : filter,
        pageParam,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
  });
  const setFilter = (value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        value === "all" ? next.delete("activity") : next.set("activity", value);
        return next;
      },
      { replace: true },
    );
  const events = activity.data?.pages.flatMap((page) => page.items) ?? [];
  const groups = groupActivity(events);
  return (
    <section className="detail-section detail-resource-section activity-workspace">
      <ResourceHeader
        title="Activity"
        description="A readable record of changes made to this application."
      />
      <div className="detail-filter-bar">
        <Filter aria-hidden="true" />
        <Select
          value={filter}
          onChange={(value) => setFilter(selectValue(value))}
          options={[
            "all",
            "application",
            "requirements",
            "tasks",
            "documents",
            "eligibility",
            "collaborators",
          ].map((value) => ({
            value,
            label:
              value === "all"
                ? "All activity"
                : value === "application"
                  ? "Application updates"
                  : label(value),
          }))}
        />
      </div>
      {activity.isPending ? (
        <ResourceRowsSkeleton />
      ) : activity.isError ? (
        <InlineError
          message="Activity could not be loaded."
          onRetry={() => void activity.refetch()}
        />
      ) : events.length ? (
        <div className="activity-groups">
          {groups.map(([date, items]) => (
            <section key={date}>
              <h3>{date}</h3>
              <ol className="activity-timeline">
                {items.map((event) => {
                  return (
                    <li key={event.id}>
                      <div className="activity-marker">
                        <History aria-hidden="true" />
                      </div>
                      <div>
                        <p>
                          <strong>{event.action}</strong>
                          {event.affected_item ? (
                            <span> · {event.affected_item}</span>
                          ) : null}
                        </p>
                        {event.change_summary ? (
                          <small>{event.change_summary}</small>
                        ) : null}
                        <footer>
                          <span>{event.actor.name}</span>
                          <time dateTime={event.occurred_at}>
                            {formatTime(event.occurred_at)}
                          </time>
                        </footer>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={History}
          heading="Activity will appear as the application changes"
          description="Updates to supported application resources are recorded here."
        />
      )}
      {activity.hasNextPage ? (
        <button
          type="button"
          className="detail-load-more"
          disabled={activity.isFetchingNextPage}
          onClick={() => void activity.fetchNextPage()}
        >
          {activity.isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      ) : null}
    </section>
  );
}

function ApplicationEditDrawer({
  application,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  application: S["ApplicationResponse"];
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (patch: Omit<S["ApplicationUpdate"], "expected_version">) => void;
}) {
  return (
    <WorkspaceDrawer
      title="Edit application"
      description="Update the core application details. Linked opportunities remain unchanged."
      onClose={onClose}
    >
      <form
        className="detail-drawer-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onSubmit({
            title: String(data.get("title") || "").trim(),
            stage: String(data.get("stage")) as S["ApplicationUpdate"]["stage"],
            priority: String(
              data.get("priority"),
            ) as S["ApplicationUpdate"]["priority"],
            intake: optional(data.get("intake")),
            primary_deadline_at: dateValue(data.get("deadline")),
            source_url: optional(data.get("source_url")),
            notes: optional(data.get("notes")),
            tags: String(data.get("tags") || "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          });
        }}
      >
        <label>
          Application name
          <input
            name="title"
            required
            minLength={2}
            defaultValue={application.title}
            autoFocus
          />
        </label>
        <div className="detail-field-pair">
          <label>
            Stage
            <Select
              name="stage"
              defaultValue={application.stage}
              options={stages.map((value) => ({ value, label: label(value) }))}
            />
          </label>
          <label>
            Priority
            <Select
              name="priority"
              defaultValue={application.priority}
              options={priorities.map((value) => ({
                value,
                label: label(value),
              }))}
            />
          </label>
        </div>
        <div className="detail-field-pair">
          <label>
            Intake
            <input name="intake" defaultValue={application.intake ?? ""} />
          </label>
          <label>
            Deadline
            <input
              name="deadline"
              type="date"
              defaultValue={application.primary_deadline_at?.slice(0, 10) ?? ""}
            />
          </label>
        </div>
        <label>
          Source URL
          <input
            name="source_url"
            type="url"
            defaultValue={application.source_url ?? ""}
          />
        </label>
        <label>
          Tags
          <input name="tags" defaultValue={application.tags.join(", ")} />
          <small>Separate tags with commas.</small>
        </label>
        <label>
          Notes
          <textarea
            name="notes"
            rows={6}
            defaultValue={application.notes ?? ""}
          />
        </label>
        {error ? <InlineError message={readableError(error)} /> : null}
        <DrawerActions
          pending={pending}
          submitLabel="Save changes"
          onCancel={onClose}
        />
      </form>
    </WorkspaceDrawer>
  );
}

function RequirementDrawer({
  initial,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  initial?: S["RequirementResponse"];
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (body: S["RequirementCreate"] | S["RequirementUpdate"]) => void;
}) {
  return (
    <WorkspaceDrawer
      title={initial ? "Edit requirement" : "Add requirement"}
      description="Keep the title specific enough to scan quickly."
      onClose={onClose}
    >
      <form
        className="detail-drawer-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          if (initial)
            onSubmit({
              title: String(data.get("title")).trim(),
              status: String(
                data.get("status"),
              ) as S["RequirementUpdate"]["status"],
              required: data.get("required") === "on",
              owner: String(
                data.get("owner"),
              ) as S["RequirementUpdate"]["owner"],
              due_at: dateValue(data.get("due_at")),
              notes: optional(data.get("notes")),
              validation_state: String(
                data.get("validation_state"),
              ) as S["RequirementUpdate"]["validation_state"],
            });
          else
            onSubmit({
              title: String(data.get("title")).trim(),
              requirement_type: String(data.get("requirement_type")).trim(),
              status: String(
                data.get("status"),
              ) as S["RequirementCreate"]["status"],
              required: data.get("required") === "on",
              owner: String(
                data.get("owner"),
              ) as S["RequirementCreate"]["owner"],
              due_at: dateValue(data.get("due_at")),
              source_url: optional(data.get("source_url")),
              notes: optional(data.get("notes")),
            });
        }}
      >
        <label>
          Requirement title
          <input
            name="title"
            required
            minLength={2}
            defaultValue={initial?.title}
            autoFocus
          />
        </label>
        <label>
          Type
          <input
            name="requirement_type"
            required={!initial}
            disabled={Boolean(initial)}
            defaultValue={initial?.requirement_type ?? ""}
          />
        </label>
        <div className="detail-field-pair">
          <label>
            Owner
            <Select
              name="owner"
              defaultValue={initial?.owner ?? "student"}
              options={["student", "recommender", "institution", "advisor"].map(
                (value) => ({ value, label: label(value) }),
              )}
            />
          </label>
          <label>
            Due date
            <input
              name="due_at"
              type="date"
              defaultValue={initial?.due_at?.slice(0, 10) ?? ""}
            />
          </label>
        </div>
        <div className="detail-field-pair">
          <label>
            Status
            <Select
              name="status"
              defaultValue={initial?.status ?? "not_started"}
              options={[
                "not_started",
                "in_progress",
                "ready",
                "needs_review",
                "blocked",
                "complete",
                "submitted",
                "waived",
              ].map((value) => ({ value, label: label(value) }))}
            />
          </label>
          {initial ? (
            <label>
              Verification
              <Select
                name="validation_state"
                defaultValue={initial.validation_state}
                options={[
                  "unverified",
                  "valid",
                  "invalid",
                  "expired",
                  "pending_scan",
                  "pending_review",
                ].map((value) => ({ value, label: validationLabel(value) }))}
              />
            </label>
          ) : (
            <label>
              Source URL
              <input name="source_url" type="url" />
            </label>
          )}
        </div>
        <label className="detail-check-field">
          <input
            name="required"
            type="checkbox"
            defaultChecked={initial?.required ?? true}
          />{" "}
          Required for submission
        </label>
        <label>
          Notes
          <textarea name="notes" rows={5} defaultValue={initial?.notes ?? ""} />
        </label>
        {error ? <InlineError message={readableError(error)} /> : null}
        <DrawerActions
          pending={pending}
          submitLabel={initial ? "Save changes" : "Add requirement"}
          onCancel={onClose}
        />
      </form>
    </WorkspaceDrawer>
  );
}

function RequirementBulkDrawer({
  pending,
  error,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (rows: S["RequirementCreate"][]) => void;
}) {
  const [review, setReview] = useState(false);
  const [rows, setRows] = useState<BulkRequirementRow[]>([
    { title: "", type: "", owner: "student", due: "" },
  ]);
  const valid = rows.filter(
    (row) => row.title.trim().length >= 2 && row.type.trim().length >= 2,
  );
  const payload = valid.map((row) => ({
    title: row.title.trim(),
    requirement_type: row.type.trim(),
    owner: row.owner,
    due_at: dateValue(row.due),
    status: "not_started" as const,
    required: true,
    source_url: null,
    notes: null,
  }));
  return (
    <WorkspaceDrawer
      wide
      title="Add multiple requirements"
      description="Create structured rows, then review them before saving."
      onClose={onClose}
    >
      <div className="detail-drawer-form">
        {review ? (
          <div className="bulk-review">
            <h3>Review {valid.length} requirements</h3>
            {valid.map((row, index) => (
              <article key={`${row.title}-${index}`}>
                <strong>{row.title}</strong>
                <span>
                  {label(row.type)} · {label(row.owner)} ·{" "}
                  {row.due ? formatDate(dateValue(row.due)) : "No due date"}
                </span>
              </article>
            ))}
            <button type="button" onClick={() => setReview(false)}>
              Back to edit
            </button>
          </div>
        ) : (
          <div className="bulk-grid">
            <div className="bulk-grid-head">
              <span>Title</span>
              <span>Type</span>
              <span>Owner</span>
              <span>Due date</span>
              <span />
            </div>
            {rows.map((row, index) => (
              <div className="bulk-grid-row" key={index}>
                <input
                  aria-label={`Requirement ${index + 1} title`}
                  value={row.title}
                  onChange={(event) =>
                    setRows(
                      updateRow(rows, index, { title: event.target.value }),
                    )
                  }
                />
                <input
                  aria-label={`Requirement ${index + 1} type`}
                  value={row.type}
                  onChange={(event) =>
                    setRows(
                      updateRow(rows, index, { type: event.target.value }),
                    )
                  }
                />
                <Select
                  aria-label={`Requirement ${index + 1} owner`}
                  value={row.owner}
                  onChange={(value) =>
                    setRows(
                      updateRow(rows, index, {
                        owner: selectValue(
                          value,
                        ) as BulkRequirementRow["owner"],
                      }),
                    )
                  }
                  options={[
                    "student",
                    "recommender",
                    "institution",
                    "advisor",
                  ].map((value) => ({ value, label: label(value) }))}
                />
                <input
                  aria-label={`Requirement ${index + 1} due date`}
                  type="date"
                  value={row.due}
                  onChange={(event) =>
                    setRows(updateRow(rows, index, { due: event.target.value }))
                  }
                />
                <button
                  type="button"
                  aria-label={`Remove requirement row ${index + 1}`}
                  disabled={rows.length === 1}
                  onClick={() =>
                    setRows(rows.filter((_, rowIndex) => rowIndex !== index))
                  }
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setRows([
                  ...rows,
                  { title: "", type: "", owner: "student", due: "" },
                ])
              }
            >
              <Plus aria-hidden="true" /> Add row
            </button>
          </div>
        )}
        {error ? <InlineError message={readableError(error)} /> : null}
        <div className="apps-drawer-footer detail-inline-footer">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          {review ? (
            <button
              type="button"
              className="primary"
              disabled={pending || !valid.length}
              onClick={() => onSubmit(payload)}
            >
              {pending ? "Adding…" : `Add ${valid.length} requirements`}
            </button>
          ) : (
            <button
              type="button"
              className="primary"
              disabled={!valid.length}
              onClick={() => setReview(true)}
            >
              Review requirements
            </button>
          )}
        </div>
      </div>
    </WorkspaceDrawer>
  );
}

function TaskDrawer({
  initial,
  requirements,
  collaborators,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  initial?: S["TaskResponse"];
  requirements: S["RequirementResponse"][];
  collaborators: S["CollaboratorResponse"][];
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (body: S["TaskCreate"] | S["TaskUpdate"]) => void;
}) {
  return (
    <WorkspaceDrawer
      title={initial ? "Edit task" : "Add task"}
      description="Name the next concrete action and add a due date when it matters."
      onClose={onClose}
    >
      <form
        className="detail-drawer-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onSubmit({
            title: String(data.get("title")).trim(),
            due_at: dateValue(data.get("due_at")),
            requirement_id: optional(data.get("requirement_id")),
            assignee_user_id: optional(data.get("assignee_user_id")),
            priority: String(
              data.get("priority"),
            ) as S["TaskCreate"]["priority"],
            reminder_at: dateTimeValue(data.get("reminder_at")),
            ...(initial
              ? {
                  status: String(
                    data.get("status"),
                  ) as S["TaskUpdate"]["status"],
                }
              : {}),
          });
        }}
      >
        <label>
          Task title
          <input
            name="title"
            required
            minLength={2}
            defaultValue={initial?.title}
            autoFocus
          />
        </label>
        <label>
          Due date
          <input
            name="due_at"
            type="date"
            defaultValue={initial?.due_at?.slice(0, 10) ?? ""}
          />
        </label>
        <label>
          Related requirement <span className="detail-optional">Optional</span>
          <Select
            name="requirement_id"
            defaultValue={initial?.requirement_id ?? ""}
            options={[
              { value: "", label: "No related requirement" },
              ...requirements.map((item) => ({
                value: item.id,
                label: item.title,
              })),
            ]}
          />
        </label>
        <div className="detail-field-pair">
          <label>
            Priority
            <Select
              name="priority"
              defaultValue={initial?.priority ?? "normal"}
              options={["low", "normal", "high", "critical"].map((value) => ({
                value,
                label: label(value),
              }))}
            />
          </label>
          <label>
            Assignee <span className="detail-optional">Optional</span>
            <Select
              name="assignee_user_id"
              defaultValue={initial?.assignee_user_id ?? ""}
              options={[
                { value: "", label: "Unassigned" },
                ...collaborators
                  .filter(
                    (item) =>
                      item.status === "active" && item.collaborator_user_id,
                  )
                  .map((item) => ({
                    value: item.collaborator_user_id as string,
                    label: item.name || item.invited_email,
                  })),
              ]}
            />
          </label>
        </div>
        <label>
          Reminder <span className="detail-optional">Optional</span>
          <input
            name="reminder_at"
            type="datetime-local"
            defaultValue={initial?.reminder_at?.slice(0, 16) ?? ""}
          />
        </label>
        {initial ? (
          <label>
            Status
            <Select
              name="status"
              defaultValue={initial.status}
              options={["open", "in_progress", "completed", "cancelled"].map(
                (value) => ({ value, label: label(value) }),
              )}
            />
          </label>
        ) : null}
        {error ? <InlineError message={readableError(error)} /> : null}
        <DrawerActions
          pending={pending}
          submitLabel={initial ? "Save changes" : "Add task"}
          onCancel={onClose}
        />
      </form>
    </WorkspaceDrawer>
  );
}

function TaskBulkDrawer({
  pending,
  error,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (rows: S["TaskCreate"][]) => void;
}) {
  const [text, setText] = useState("");
  const [review, setReview] = useState(false);
  const rows = parseTasks(text);
  return (
    <WorkspaceDrawer
      title="Add multiple tasks"
      description="Enter one task per line. Add an optional date after a vertical bar."
      onClose={onClose}
    >
      <div className="detail-drawer-form">
        {review ? (
          <div className="bulk-review">
            <h3>Review {rows.length} tasks</h3>
            {rows.map((row, index) => (
              <article key={`${row.title}-${index}`}>
                <strong>{row.title}</strong>
                <span>
                  {row.due_at ? formatDate(row.due_at) : "No due date"}
                </span>
              </article>
            ))}
            <button type="button" onClick={() => setReview(false)}>
              Back to edit
            </button>
          </div>
        ) : (
          <label>
            Tasks
            <textarea
              rows={10}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={
                "Request transcript | 2026-08-15\nReview personal statement"
              }
            />
            <small>
              Dates use YYYY-MM-DD. You will review every task before creation.
            </small>
          </label>
        )}
        {error ? <InlineError message={readableError(error)} /> : null}
        <div className="apps-drawer-footer detail-inline-footer">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          {review ? (
            <button
              type="button"
              className="primary"
              disabled={pending || !rows.length}
              onClick={() => onSubmit(rows)}
            >
              {pending ? "Adding…" : `Add ${rows.length} tasks`}
            </button>
          ) : (
            <button
              type="button"
              className="primary"
              disabled={!rows.length}
              onClick={() => setReview(true)}
            >
              Review tasks
            </button>
          )}
        </div>
      </div>
    </WorkspaceDrawer>
  );
}

function LinkDocumentDrawer({
  documents,
  linkedIds,
  requirements,
  initialRequirementId,
  initialDocumentId = "",
  title = "Link document",
  pending,
  error,
  onClose,
  onSubmit,
}: {
  documents: S["DocumentResponse"][];
  linkedIds: Set<string>;
  requirements: S["RequirementResponse"][];
  initialRequirementId: string;
  initialDocumentId?: string;
  title?: string;
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (
    body: Pick<S["DocumentLinkCreate"], "document_id" | "requirement_id">,
  ) => void;
}) {
  const eligible = documents.filter(
    (document) =>
      !linkedIds.has(document.id) && document.malware_status === "clean",
  );
  return (
    <WorkspaceDrawer
      title={title}
      description="Only documents with a completed security scan are available."
      onClose={onClose}
    >
      {eligible.length ? (
        <form
          className="detail-drawer-form"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            onSubmit({
              document_id: String(data.get("document_id")),
              requirement_id: optional(data.get("requirement_id")),
            });
          }}
        >
          <label>
            Document
            <Select
              name="document_id"
              required
              defaultValue={initialDocumentId}
              placeholder="Choose a document"
              options={eligible.map((document) => ({
                value: document.id,
                label: `${document.display_name} · ${label(document.category)}`,
              }))}
            />
          </label>
          <label>
            Requirement
            <Select
              name="requirement_id"
              defaultValue={initialRequirementId}
              options={[
                { value: "", label: "Whole application" },
                ...requirements.map((item) => ({
                  value: item.id,
                  label: item.title,
                })),
              ]}
            />
          </label>
          <p className="detail-security-note">
            <ShieldCheck aria-hidden="true" /> Security scan complete for
            available documents.
          </p>
          {error ? <InlineError message={readableError(error)} /> : null}
          <DrawerActions
            pending={pending}
            submitLabel={initialDocumentId ? "Update link" : "Link document"}
            onCancel={onClose}
          />
        </form>
      ) : (
        <EmptyState
          icon={FilePlus2}
          heading="No eligible document is available"
          description="Upload a document or review your existing files in the document vault."
          secondaryAction={
            <div className="apps-empty-actions">
              <Link className="primary" to="/app/documents?upload=1">
                Upload document
              </Link>
              <Link to="/app/documents">Open document vault</Link>
            </div>
          }
        />
      )}
    </WorkspaceDrawer>
  );
}

function InviteCollaboratorDrawer({
  roleOptions,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  roleOptions: S["CollaboratorRoleOption"][];
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (body: S["CollaboratorInvite"]) => void;
}) {
  const [role, setRole] = useState<S["CollaboratorInvite"]["role"]>("viewer");
  return (
    <WorkspaceDrawer
      title="Invite collaborator"
      description="Choose the smallest role this person needs."
      onClose={onClose}
    >
      <form
        className="detail-drawer-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({
            email: String(new FormData(event.currentTarget).get("email")),
            role,
            message: optional(new FormData(event.currentTarget).get("message")),
          });
        }}
      >
        <label>
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
          />
        </label>
        <label>
          Role
          <Select
            value={role}
            onChange={(value) =>
              setRole(selectValue(value) as S["CollaboratorInvite"]["role"])
            }
            options={roleOptions.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
          />
        </label>
        <label>
          Message <span className="detail-optional">Optional</span>
          <textarea
            name="message"
            maxLength={1000}
            rows={4}
            placeholder="Add context for your collaborator"
          />
        </label>
        <div className="detail-access-summary">
          <strong>Access summary</strong>
          <p>
            {roleOptions.find((item) => item.value === role)?.description ||
              roleDescription(role)}
          </p>
        </div>
        {error ? <InlineError message={readableError(error)} /> : null}
        <DrawerActions
          pending={pending}
          submitLabel="Send invitation"
          onCancel={onClose}
        />
      </form>
    </WorkspaceDrawer>
  );
}

function WorkspaceDrawer({
  title,
  description,
  wide = false,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLElement>(null);
  useFocusTrap(panel, true);
  return (
    <div
      className="apps-drawer-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={panel}
        className={`apps-drawer detail-drawer${wide ? " apps-drawer-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-drawer-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <header className="apps-drawer-header">
          <div>
            <h2 id="detail-drawer-title">{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label={`Close ${title}`}>
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="apps-drawer-body">{children}</div>
      </section>
    </div>
  );
}

function DrawerActions({
  pending,
  submitLabel,
  onCancel,
}: {
  pending: boolean;
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="apps-drawer-footer detail-inline-footer">
      <button type="button" onClick={onCancel} disabled={pending}>
        Cancel
      </button>
      <button type="submit" className="primary" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}

function CollaboratorGroup({
  title,
  items,
  empty,
  canManage,
  capabilities,
  roleOptions,
  updatePending,
  onRole,
  onResend,
  onCopyInvitation,
  onRevoke,
}: {
  title: string;
  items: S["CollaboratorResponse"][];
  empty: string;
  canManage: boolean;
  capabilities?: { [key: string]: boolean };
  roleOptions: S["CollaboratorRoleOption"][];
  updatePending: boolean;
  onRole: (
    item: S["CollaboratorResponse"],
    role: S["CollaboratorUpdate"]["role"],
  ) => void;
  onResend: (item: S["CollaboratorResponse"]) => void;
  onCopyInvitation: (item: S["CollaboratorResponse"]) => void;
  onRevoke: (item: S["CollaboratorResponse"]) => void;
}) {
  return (
    <section className="collaborator-group">
      <h3>
        {title} <span>{items.length}</span>
      </h3>
      {items.length ? (
        <div className="detail-data-list">
          {items.map((item) => (
            <article className="detail-data-row collaborator-row" key={item.id}>
              <div className="detail-avatar" aria-hidden="true">
                {(item.name || item.invited_email).slice(0, 1).toUpperCase()}
              </div>
              <div className="detail-row-main">
                <strong>{item.name || item.invited_email}</strong>
                {item.name ? <small>{item.invited_email}</small> : null}
                <div className="detail-row-meta">
                  <span>{label(item.status)}</span>
                  <span>
                    {item.last_activity_at
                      ? `Active ${formatDate(item.last_activity_at)}`
                      : `Invited ${formatDate(item.created_at)}`}
                  </span>
                  <span>
                    {item.access_scope?.join(" · ") || "Application workspace"}
                  </span>
                </div>
              </div>
              <div className="detail-row-actions">
                <Select
                  aria-label={`Role for ${item.invited_email}`}
                  value={item.role}
                  disabled={
                    !canManage ||
                    capabilities?.change_roles !== true ||
                    updatePending
                  }
                  onChange={(value) =>
                    onRole(
                      item,
                      selectValue(value) as S["CollaboratorUpdate"]["role"],
                    )
                  }
                  options={roleOptions.map((role) => ({
                    value: role.value,
                    label: role.label,
                  }))}
                />
                {canManage ? (
                  <OverflowMenu
                    label={`More actions for ${item.invited_email}`}
                    items={[
                      ...(item.status === "invited" &&
                      capabilities?.resend_invitations
                        ? [
                            {
                              key: "resend",
                              label: "Resend invite",
                              icon: RefreshCw,
                              onClick: () => onResend(item),
                            },
                          ]
                        : []),
                      ...(item.status === "invited" &&
                      capabilities?.copy_invitation_links
                        ? [
                            {
                              key: "copy",
                              label: "Copy invitation",
                              icon: Copy,
                              onClick: () => onCopyInvitation(item),
                            },
                          ]
                        : []),
                      {
                        key: "revoke",
                        label: "Revoke access",
                        icon: Trash2,
                        danger: true,
                        disabled: capabilities?.revoke_access !== true,
                        onClick: () => onRevoke(item),
                      },
                    ]}
                  />
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="detail-muted-copy">{empty}</p>
      )}
    </section>
  );
}

function ReadOnlyCollaboratorWorkspace({
  view,
}: {
  view: S["CollaboratorViewResponse"];
}) {
  return (
    <div className="page apps-page detail-page">
      <header className="detail-application-header">
        <Link to="/app/applications" className="detail-back-link">
          <ArrowLeft aria-hidden="true" /> Back to applications
        </Link>
        <div className="detail-title-line">
          <h1>{view.application.title}</h1>
          <StatusBadge tone="blue">{label(view.role)}</StatusBadge>
        </div>
        <p>
          {roleDescription(view.role)} Application content is read-only until
          backend-supported editor permissions are available.
        </p>
      </header>
      <div className="detail-overview-split">
        <section className="detail-section">
          <SectionHeading title="Requirements" />
          {view.requirements.length ? (
            <ul className="detail-compact-list">
              {view.requirements.map((item) => (
                <li key={item.id}>
                  <RequirementStateIcon item={item} />
                  <span>
                    {item.title}
                    <small>{label(item.status)}</small>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="detail-muted-copy">No requirements are available.</p>
          )}
        </section>
        <section className="detail-section">
          <SectionHeading title="Tasks" />
          {view.tasks.length ? (
            <ul className="detail-compact-list">
              {view.tasks.map((item) => (
                <li key={item.id}>
                  <Circle aria-hidden="true" />
                  <span>
                    {item.title}
                    <small>{label(item.status)}</small>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="detail-muted-copy">No tasks are available.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function ResourceHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="detail-resource-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {actions ? (
        <div className="detail-resource-actions">{actions}</div>
      ) : null}
    </header>
  );
}
function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="detail-section-heading">
      <h2>{title}</h2>
      {action}
    </header>
  );
}
function Definition({ term, value }: { term: string; value: ReactNode }) {
  return (
    <div>
      <dt>{term}</dt>
      <dd>{value}</dd>
    </div>
  );
}
function SummaryChip({
  label: text,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "danger";
}) {
  return (
    <span className={tone === "danger" ? "detail-chip-danger" : undefined}>
      {text} <strong>{value}</strong>
    </span>
  );
}
function IssueList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="detail-issue-list">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="detail-inline-error" role="alert">
      <AlertCircle aria-hidden="true" />
      <p>{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
function FeedbackToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);
  return message ? (
    <div className="detail-toast" role="status">
      <CheckCircle2 aria-hidden="true" />
      {message}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <X aria-hidden="true" />
      </button>
    </div>
  ) : null;
}

function ApplicationWorkspaceSkeleton({ tab }: { tab: Tab }) {
  return (
    <div
      className="page apps-page detail-page"
      aria-busy="true"
      aria-label={`Loading ${tab}`}
    >
      <div className="detail-skeleton-header">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="detail-skeleton-tabs">
        {TABS.map((item) => (
          <div className="skeleton" key={item} />
        ))}
      </div>
      <div className="detail-skeleton-layout">
        <div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="skeleton detail-skeleton-row" key={index} />
          ))}
        </div>
        <div className="skeleton detail-skeleton-aside" />
      </div>
    </div>
  );
}
function ResourceRowsSkeleton() {
  return (
    <div
      className="detail-rows-skeleton"
      aria-busy="true"
      aria-label="Loading items"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="skeleton" key={index} />
      ))}
    </div>
  );
}
function EligibilitySkeleton() {
  return (
    <section
      className="detail-section"
      aria-busy="true"
      aria-label="Loading eligibility analysis"
    >
      <div className="skeleton detail-skeleton-row" />
      <div className="detail-skeleton-layout">
        <ResourceRowsSkeleton />
        <div className="skeleton detail-skeleton-aside" />
      </div>
    </section>
  );
}
function ReadinessSkeleton() {
  return (
    <div
      className="detail-rows-skeleton"
      aria-busy="true"
      aria-label="Checking readiness"
    >
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}
function PageError({
  title,
  description = "Open a valid application workspace and try again.",
  onRetry,
}: {
  title: string;
  description?: string;
  onRetry: () => void;
}) {
  return (
    <div className="page apps-page">
      <section className="detail-page-error">
        <AlertCircle aria-hidden="true" />
        <h1>{title}</h1>
        <p>{description}</p>
        <button type="button" className="primary" onClick={onRetry}>
          Try again
        </button>
        <Link to="/app/applications">Back to applications</Link>
      </section>
    </div>
  );
}

type BulkRequirementRow = {
  title: string;
  type: string;
  owner: "student" | "recommender" | "institution" | "advisor";
  due: string;
};
type NormalFinding = {
  title: string;
  status: string;
  evidence: string;
  explanation: string;
  nextAction: string;
};

function recommendedPrimaryAction({
  eligibility,
  readiness,
  application,
}: {
  eligibility?: S["EligibilityResponse"];
  readiness?: S["ApplicationReadinessResponse"];
  application: S["ApplicationResponse"];
}) {
  if (!eligibility)
    return { label: "Review eligibility", tab: "eligibility" as Tab };
  if (readiness?.deadline_state === "expired")
    return { label: "Resolve blocking issue", tab: "overview" as Tab };
  if (
    readiness?.blocking_issues.length ||
    readiness?.incomplete_requirements.length
  )
    return { label: "Complete requirements", tab: "requirements" as Tab };
  if (readiness?.overall_state === "ready" && application.stage !== "submitted")
    return { label: "Mark submitted", tab: undefined };
  return { label: "Review eligibility", tab: "eligibility" as Tab };
}
function richerApplicationTitle(application: S["ApplicationResponse"]) {
  const generic = new Set([
    "monitoring",
    "application",
    "new application",
    "untitled application",
  ]);
  if (!generic.has(application.title.trim().toLowerCase()))
    return application.title;
  return (
    application.programme_display_name ||
    application.programme_name ||
    application.scholarship_display_name ||
    application.scholarship_name ||
    application.title
  );
}
function requirementTone(
  status: string,
): "neutral" | "blue" | "green" | "amber" | "red" {
  return REQUIREMENT_DONE.has(status)
    ? "green"
    : status === "blocked"
      ? "red"
      : status === "needs_review"
        ? "amber"
        : status === "in_progress"
          ? "blue"
          : "neutral";
}
function eligibilityTone(
  status: string,
): "green" | "blue" | "amber" | "red" | "grey" {
  return status === "Meets requirement"
    ? "green"
    : status === "Likely meets"
      ? "blue"
      : status === "Does not meet"
        ? "red"
        : status === "Unknown"
          ? "grey"
          : "amber";
}
function RequirementStateIcon({ item }: { item: S["RequirementResponse"] }) {
  return item.readiness_state === "ready" ? (
    <CheckCircle2 aria-hidden="true" />
  ) : item.readiness_state === "blocked" ? (
    <AlertCircle aria-hidden="true" />
  ) : (
    <Circle aria-hidden="true" />
  );
}
function validationLabel(value: string) {
  const names: Record<string, string> = {
    valid: "Verified",
    unverified: "Not verified",
    invalid: "Verification failed",
    expired: "Evidence expired",
    pending_scan: "Security scan in progress",
    pending_review: "Needs review",
  };
  return names[value] || label(value);
}
function securityStatus(value?: string) {
  if (value === "clean") return "Security scan complete";
  if (value === "pending") return "Security scan in progress";
  if (!value) return "Status unavailable";
  return "Document needs review";
}
function roleDescription(role: string) {
  return (
    (
      {
        viewer: "Can view allowed application content",
        commenter: "Can comment or review",
        advisor_editor: "Can edit permitted content",
        owner: "Full control",
      } as Record<string, string>
    )[role] || "Access is limited by role"
  );
}
function taskDueLabel(task: S["TaskResponse"]) {
  const group = taskGroup(task);
  if (group === "today") return "Due today";
  if (group === "overdue")
    return `${formatDate(task.due_at ?? null)} · Overdue`;
  if (group === "unscheduled") return "No due date";
  return formatDate(task.due_at ?? null);
}
function taskGroup(
  task: S["TaskResponse"],
): "overdue" | "today" | "upcoming" | "unscheduled" | "completed" {
  if (TASK_DONE.has(task.status)) return "completed";
  if (!task.due_at) return "unscheduled";
  const due = new Date(task.due_at);
  const now = new Date();
  const dueDay = Date.UTC(
    due.getUTCFullYear(),
    due.getUTCMonth(),
    due.getUTCDate(),
  );
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return dueDay < today ? "overdue" : dueDay === today ? "today" : "upcoming";
}
function taskGroups(items: S["TaskResponse"][]) {
  const groups = {
    overdue: [] as S["TaskResponse"][],
    today: [] as S["TaskResponse"][],
    upcoming: [] as S["TaskResponse"][],
    unscheduled: [] as S["TaskResponse"][],
    completed: [] as S["TaskResponse"][],
  };
  [...items]
    .sort(dateSort)
    .forEach((item) => groups[taskGroup(item)].push(item));
  return groups;
}
function dateSort(
  a: { due_at?: string | null },
  b: { due_at?: string | null },
) {
  return (
    (a.due_at ? Date.parse(a.due_at) : Number.MAX_SAFE_INTEGER) -
    (b.due_at ? Date.parse(b.due_at) : Number.MAX_SAFE_INTEGER)
  );
}
function isEligibilityResponse(
  value: S["EligibilityResponse"] | undefined,
): value is S["EligibilityResponse"] {
  return Boolean(
    value &&
      Array.isArray(value.findings) &&
      Array.isArray(value.risks) &&
      Array.isArray(value.questions) &&
      value.readiness_components &&
      typeof value.readiness_components === "object",
  );
}
function normalizeFinding(value: unknown): NormalFinding {
  const raw =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const certainty = String(raw.certainty || raw.status || "unknown");
  const statuses: Record<string, string> = {
    met: "Meets requirement",
    meets_requirement: "Meets requirement",
    possibly_met: "Likely meets",
    likely_meets: "Likely meets",
    needs_review: "Needs review",
    missing_evidence: "Missing evidence",
    unmet: "Does not meet",
    does_not_meet: "Does not meet",
    unknown: "Unknown",
  };
  const status = statuses[certainty] || "Unknown";
  const evidence = Array.isArray(raw.evidence)
    ? raw.evidence
        .map((item) =>
          item && typeof item === "object"
            ? String((item as Record<string, unknown>).summary || "")
            : "",
        )
        .filter(Boolean)
        .join("; ")
    : typeof raw.evidence === "string"
      ? raw.evidence
      : "";
  return {
    title: String(
      raw.checked || raw.criterion || raw.title || "Eligibility criterion",
    ),
    status,
    evidence,
    explanation: String(raw.reason || raw.explanation || ""),
    nextAction:
      typeof raw.recommended_action === "string"
        ? raw.recommended_action
        : status === "Meets requirement"
          ? "Keep this evidence current."
          : status === "Likely meets"
            ? "Confirm the matched evidence before submission."
            : status === "Does not meet"
              ? "Review this criterion before proceeding."
              : "Add or verify supporting information.",
  };
}
function eligibilityStatus(findings: NormalFinding[]) {
  if (findings.some((item) => item.status === "Does not meet"))
    return "Does not meet";
  if (
    findings.some((item) =>
      ["Needs review", "Missing evidence"].includes(item.status),
    )
  )
    return "Needs review";
  if (
    findings.length &&
    findings.every((item) =>
      ["Meets requirement", "Likely meets"].includes(item.status),
    )
  )
    return "Meets requirement";
  return "Unknown";
}
function scoreChange(
  current: S["EligibilityResponse"],
  previous?: S["EligibilityResponse"],
) {
  if (!previous) return "Baseline";
  const change = current.readiness_score - previous.readiness_score;
  return change === 0
    ? "No score change"
    : `${change > 0 ? "+" : ""}${change} points`;
}
function groupActivity(events: S["ActivityEventResponse"][]) {
  const groups = new Map<string, S["ActivityEventResponse"][]>();
  events.forEach((event) => {
    const date = new Intl.DateTimeFormat(undefined, {
      dateStyle: "long",
    }).format(new Date(event.occurred_at));
    groups.set(date, [...(groups.get(date) ?? []), event]);
  });
  return [...groups.entries()];
}
function parseTasks(text: string): S["TaskCreate"][] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const [rawTitle, rawDate] = line.split("|").map((value) => value.trim());
      if (rawTitle.length < 2) return [];
      const validDate =
        rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
          ? dateValue(rawDate)
          : null;
      return [{ title: rawTitle, due_at: validDate, priority: "normal" }];
    });
}
function updateRow<T>(rows: T[], index: number, patch: Partial<T>) {
  return rows.map((row, rowIndex) =>
    rowIndex === index ? { ...row, ...patch } : row,
  );
}
function renderFindingValue(value: unknown) {
  return typeof value === "string"
    ? value
    : value && typeof value === "object"
      ? Object.values(value as Record<string, unknown>)
          .filter((item) => typeof item === "string")
          .join(" · ") || "Review available evidence"
      : "Review available evidence";
}
function readableError(error: unknown) {
  if (error instanceof ApiError)
    return error.message || "The change could not be saved.";
  if (error instanceof Error) return error.message;
  return "The change could not be saved. Your previous data is unchanged.";
}
function selectValue(value: unknown) {
  return typeof value === "string"
    ? value
    : value && typeof value === "object" && "target" in value
      ? String((value as { target?: { value?: unknown } }).target?.value ?? "")
      : "";
}
function dateValue(value: FormDataEntryValue | null) {
  const text = String(value || "");
  return text ? new Date(`${text}T12:00:00Z`).toISOString() : null;
}
function dateTimeValue(value: FormDataEntryValue | null) {
  const text = String(value || "");
  return text ? new Date(text).toISOString() : null;
}
function optional(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}
function formatDateTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not available";
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(
    new Date(value),
  );
}
function slug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "application"
  );
}
