import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  Copy,
  Download,
  Edit3,
  Trash2,
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
import { ConfirmationDialog } from "../../components/actions/ConfirmationDialog";
import { OverflowMenu } from "../../components/actions/OverflowMenu";
import { StatusBadge } from "../../components/data-display/StatusBadge";
import { Select } from "../../components/ui/select";
import { PageRefreshButton } from "../../components/page/PageHeader";
import { WorkspacePageGuideButton } from "../../components/AppShell";
import { DuplicateApplication } from "./components/ApplicationDialogs";
import {
  deadlineInfo,
  label,
  priorities,
  stages,
  STAGE_TONE,
} from "./model";
import {
  seedApplicationWorkspace,
} from "./applicationQueries";
import type { components } from "../../generated/api/schema";
import {
  ApplicationWorkspaceSkeleton,
  FeedbackToast,
  InlineError,
  PageError,
  readableError,
  TASK_DONE,
  WorkspaceDrawer,
  DrawerActions,
  optional,
  dateValue,
} from "./components/applicationWorkspaceShared";
import { OverviewTab, LinkedResourcesTab } from "./components/OverviewTab";
import { RequirementsTab } from "./components/RequirementsTab";
import { TasksTab } from "./components/TasksTab";
import { DocumentsTab } from "./components/ApplicationDocumentsTab";
import { EligibilityTab, isEligibilityResponse } from "./components/EligibilityTab";
import {
  CollaboratorsTab,
  ReadOnlyCollaboratorWorkspace,
} from "./components/CollaboratorsTab";
import { ActivityTab } from "./components/ActivityTab";
import "../../styles/workspace.css";


type S = components["schemas"];

export type Tab =
  | "overview"
  | "requirements"
  | "tasks"
  | "documents"
  | "linked"
  | "eligibility"
  | "collaborators"
  | "activity";

export const TABS: Tab[] = [
  "overview",
  "requirements",
  "tasks",
  "documents",
  "linked",
  "eligibility",
  "collaborators",
  "activity",
];

export const TAB_ALIASES: Record<string, Tab> = {
  checklist: "requirements",
  checklists: "requirements",
  requirement: "requirements",
  requirements_list: "requirements",
  task: "tasks",
  todo: "tasks",
  todos: "tasks",
  doc: "documents",
  docs: "documents",
  file: "documents",
  files: "documents",
  attachment: "documents",
  attachments: "documents",
  reference: "linked",
  references: "linked",
  writing: "linked",
  stories: "linked",
  interviews: "linked",
  reminders: "linked",
  resources: "linked",
  eligibility_check: "eligibility",
  recommendation: "eligibility",
  recommendations: "eligibility",
  matches: "eligibility",
  collaboration: "collaborators",
  collaborator: "collaborators",
  team: "collaborators",
  members: "collaborators",
  sharing: "collaborators",
  history: "activity",
  timeline: "activity",
  audit: "activity",
  logs: "activity",
  events: "activity",
  details: "overview",
  info: "overview",
  summary: "overview",
  home: "overview",
  main: "overview",
};

export function resolveWorkspaceTab(rawResource?: string | null): Tab {
  if (!rawResource) return "overview";
  const normalized = rawResource.toLowerCase().trim();
  if (TABS.includes(normalized as Tab)) {
    return normalized as Tab;
  }
  if (normalized in TAB_ALIASES) {
    return TAB_ALIASES[normalized];
  }
  return "overview";
}


export function ApplicationWorkspace() {
  const { id = "", resource } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const activeTab: Tab = resolveWorkspaceTab(resource);
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
    queryFn: () => documentsApi.list({ limit: 100 }),
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
  // `application` and `readiness` are required on ApplicationWorkspaceResponse,
  // but a truncated or malformed payload must degrade to this recoverable error
  // rather than throwing past the router into a full-page error boundary.
  if (
    workspace.isError ||
    !workspace.data?.application ||
    !workspace.data?.readiness
  ) {
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
  const documentItems = documents.data?.items ?? [];
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
    linked: w.counts?.linked_resources ?? w.linked_resources?.length ?? 0,
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
          <Link to="/app/applications" className="apps-back-link">
            <ArrowLeft aria-hidden="true" /> Back to applications
          </Link>
          <div className="detail-header-actions">
            <PageRefreshButton
              onRefresh={() => void refreshWorkspace()}
              refreshing={workspace.isFetching}
            />
            <WorkspacePageGuideButton />
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
        {activeTab === "linked" ? (
          <LinkedResourcesTab items={w.linked_resources ?? []} />
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

function slug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "application"
  );
}

