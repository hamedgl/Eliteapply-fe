import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Check,
  ChevronLeft,
  CircleDashed,
  Copy,
  Eye,
  FileText,
  FilePlus2,
  Gauge,
  Link2,
  Loader2,
  MessageCircle,
  Search,
  Sparkles,
  Trash2,
  Unlink,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { writingApi } from "../../lib/api/phase3";
import { applicationsApi } from "../../lib/api/phase2";
import { EntityCombobox } from "../../components/filters/EntityCombobox";
import { ApiError } from "../../lib/api/errors";
import { downloadResponse } from "../../lib/api/download";
import { billingApi } from "../../lib/api/billing";
import { queryKeys } from "../../lib/api/queryKeys";
import { previewDocument } from "../../lib/safeHtml";
import { Select } from "../../components/ui/select";
import { ConfirmationDialog } from "../../components/actions/ConfirmationDialog";
import { OverflowMenu } from "../../components/actions/OverflowMenu";
import {
  academicProfileEducationPath,
  type AcademicProfileNavigationState,
  type WritingGenerationNavigationDraft,
} from "../../lib/navigation";
import {
  academicProfileFieldLabel,
  academicProfileRequirement,
  type AcademicProfileRequirement,
} from "./generationProfileRequirement";
import { TrixField } from "./TrixField";
import { QualityAnalysisDialog } from "./QualityAnalysisDialog";
import { NewWritingDialog } from "./NewWritingDialog";
import { DocumentOutline } from "./DocumentOutline";
import { WritingReviewDrawer } from "./WritingReviewDrawer";
import { StatusBadge } from "../../components/data-display/StatusBadge";
import {
  contentToHtml,
  countText,
  documentFont,
  DEFAULT_FONT,
  FONTS,
  mergeHtml,
  label,
  type FontKey,
} from "./documentHtml";
import type { components } from "../../generated/api/schema";
type S = components["schemas"];
/**
 * The backend caps serialized `content` at 256 KiB and rejects it as a field
 * validation error, so a too-large document must not surface as a bare
 * "Save failed" with no way for the writer to tell what went wrong.
 */
function saveFailureMessage(error: unknown) {
  if (!(error instanceof ApiError)) return "Save failed";
  if (error.code === "CONFLICT") return "Conflict — reload to compare";
  const contentIssue = error.fields.find((field) =>
    field.field.split(".").includes("content"),
  );
  const reason = contentIssue?.message.replace(/^value error,\s*/i, "").trim();
  return reason ? `Save failed — ${reason}` : "Save failed";
}
const DEFAULT_GENERATION_DRAFT: Omit<
  WritingGenerationNavigationDraft,
  "documentId"
> = {
  operation: "generate_outline",
  instruction: "",
};
export function WritingLibrary({
  openCreate = false,
}: {
  openCreate?: boolean;
}) {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [creating, setCreating] = useState(openCreate);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [applicationFilter, setApplicationFilter] = useState("all");
  const [sort, setSort] = useState("updated");
  const [linking, setLinking] = useState<S["WritingDocumentResponse"] | null>(
    null,
  );
  const q = useQuery({
    queryKey: ["writing", { includeArchived }],
    queryFn: () => writingApi.list(undefined, includeArchived),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["writing"] });
  const archive = useMutation({
    mutationFn: (document: NonNullable<typeof q.data>[number]) =>
      writingApi.update(document.id, {
        expected_version: document.version,
        status: document.status === "archived" ? "draft" : "archived",
      }),
    onSuccess: refresh,
  });
  const duplicate = useMutation({
    mutationFn: (document: S["WritingDocumentResponse"]) =>
      writingApi.duplicate(document.id, {
        title_suffix: " (copy)",
        keep_application_link: true,
      }),
    onSuccess: (document) => {
      void refresh();
      nav(`/app/writing/${document.id}`);
    },
  });
  const unlink = useMutation({
    mutationFn: (document: S["WritingDocumentResponse"]) =>
      writingApi.detach(document.id, document.application_id!),
    onSuccess: refresh,
  });
  const documents = q.data ?? [];
  const applications = useMemo(
    () =>
      Array.from(
        new Map(
          documents
            .filter((document) => document.application_id)
            .map((document) => [
              document.application_id!,
              document.application_title ?? "Linked application",
            ]),
        ),
      ).sort((a, b) => a[1].localeCompare(b[1])),
    [documents],
  );
  const documentTypes = useMemo(
    () =>
      [...new Set(documents.map((document) => document.document_type))].sort(),
    [documents],
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return documents
      .filter(
        (document) =>
          (!term ||
            `${document.title} ${document.document_type} ${document.application_title ?? ""}`
              .toLocaleLowerCase()
              .includes(term)) &&
          (statusFilter === "all" || document.status === statusFilter) &&
          (typeFilter === "all" || document.document_type === typeFilter) &&
          (applicationFilter === "all" ||
            (applicationFilter === "unlinked"
              ? !document.application_id
              : document.application_id === applicationFilter)),
      )
      .sort((a, b) =>
        sort === "title"
          ? a.title.localeCompare(b.title)
          : sort === "oldest"
            ? Date.parse(a.updated_at) - Date.parse(b.updated_at)
            : Date.parse(b.updated_at) - Date.parse(a.updated_at),
      );
  }, [applicationFilter, documents, search, sort, statusFilter, typeFilter]);
  const hasFilters =
    Boolean(search) ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    applicationFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setApplicationFilter("all");
  };
  const actionPending =
    archive.isPending || duplicate.isPending || unlink.isPending;
  return (
    <div className="page writing-library">
      <header className="page-heading">
        <div>
          <h1>Writing Studio</h1>
          <p>
            Create, refine and export application writing grounded in your
            evidence.
          </p>
        </div>
        <button
          type="button"
          className="primary"
          onClick={() => setCreating(true)}
        >
          <FilePlus2 aria-hidden="true" />
          New document
        </button>
      </header>
      {!q.isPending && !q.isError && documents.length ? (
        <section className="writing-summary" aria-label="Document summary">
          <div>
            <strong>{documents.length}</strong>
            <span>{includeArchived ? "Documents" : "Active documents"}</span>
          </div>
          <div>
            <strong>
              {
                documents.filter((document) => document.status === "draft")
                  .length
              }
            </strong>
            <span>Drafts in progress</span>
          </div>
          <div>
            <strong>
              {documents.filter((document) => document.application_id).length}
            </strong>
            <span>Linked to applications</span>
          </div>
          <div>
            <strong>
              {
                documents.filter((document) =>
                  ["review", "final"].includes(document.status),
                ).length
              }
            </strong>
            <span>In review or final</span>
          </div>
        </section>
      ) : null}
      <section className="writing-toolbar" aria-label="Filter documents">
        <label className="writing-search">
          <span>Search documents</span>
          <div>
            <Search aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, type or application"
            />
          </div>
        </label>
        <label>
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="review">In review</option>
            <option value="final">Final</option>
            {includeArchived ? (
              <option value="archived">Archived</option>
            ) : null}
          </select>
        </label>
        <label>
          <span>Type</span>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="all">All document types</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {label(type)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Application</span>
          <select
            value={applicationFilter}
            onChange={(event) => setApplicationFilter(event.target.value)}
          >
            <option value="all">All applications</option>
            <option value="unlinked">Not linked</option>
            {applications.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Sort</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="updated">Recently updated</option>
            <option value="oldest">Oldest updated</option>
            <option value="title">Title A–Z</option>
          </select>
        </label>
        <label className="writing-archive-filter">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => {
              setIncludeArchived(event.target.checked);
              if (!event.target.checked && statusFilter === "archived")
                setStatusFilter("all");
            }}
          />
          Show archived
        </label>
      </section>
      {q.isPending ? (
        <div className="writing-document-grid" aria-label="Loading documents">
          {[0, 1, 2].map((item) => (
            <div className="writing-card writing-card-skeleton" key={item} />
          ))}
        </div>
      ) : q.isError ? (
        <div className="vault-empty writing-error-state">
          <AlertTriangle aria-hidden="true" />
          <h2>Documents could not be loaded</h2>
          <p>
            Check your connection and try again. Your saved work is unchanged.
          </p>
          <button type="button" onClick={() => void q.refetch()}>
            Try again
          </button>
        </div>
      ) : filtered.length ? (
        <>
          <div className="writing-results-heading">
            <p>
              Showing <strong>{filtered.length}</strong> of {documents.length}{" "}
              document{documents.length === 1 ? "" : "s"}
            </p>
            {hasFilters ? (
              <button type="button" onClick={clearFilters}>
                Clear filters
              </button>
            ) : null}
          </div>
          <div className="writing-document-grid">
            {filtered.map((document) => {
              const words = countText(contentToHtml(document.content)).words;
              return (
                <article
                  className={`writing-card${document.status === "archived" ? " is-archived" : ""}`}
                  key={document.id}
                >
                  <header>
                    <span className="writing-card-icon">
                      <FileText aria-hidden="true" />
                    </span>
                    <div>
                      <StatusBadge
                        tone={
                          document.status === "final"
                            ? "green"
                            : document.status === "review"
                              ? "amber"
                              : document.status === "archived"
                                ? "grey"
                                : "blue"
                        }
                      >
                        {document.status === "review"
                          ? "In review"
                          : label(document.status)}
                      </StatusBadge>
                      <span className="writing-card-type">
                        {label(document.document_type)}
                      </span>
                    </div>
                    <OverflowMenu
                      label={`More actions for ${document.title}`}
                      items={[
                        {
                          key: "duplicate",
                          label: "Duplicate",
                          icon: Copy,
                          disabled: actionPending,
                          onClick: () => duplicate.mutate(document),
                        },
                        {
                          key: "application",
                          label: document.application_id
                            ? "Change application"
                            : "Link application",
                          icon: Link2,
                          disabled: actionPending,
                          onClick: () => setLinking(document),
                        },
                        ...(document.application_id
                          ? [
                              {
                                key: "unlink",
                                label: "Remove application link",
                                icon: Unlink,
                                disabled: actionPending,
                                onClick: () => unlink.mutate(document),
                              } as const,
                            ]
                          : []),
                        { key: "divider", divider: true },
                        {
                          key: "archive",
                          label:
                            document.status === "archived"
                              ? "Restore"
                              : "Archive",
                          icon:
                            document.status === "archived"
                              ? ArchiveRestore
                              : Archive,
                          disabled: actionPending,
                          onClick: () => archive.mutate(document),
                        },
                      ]}
                    />
                  </header>
                  <div className="writing-card-body">
                    <Link
                      className="writing-card-title"
                      to={`/app/writing/${document.id}`}
                    >
                      {document.title}
                    </Link>
                    <p className="writing-card-meta">
                      {words.toLocaleString()} word{words === 1 ? "" : "s"}
                      <span aria-hidden="true">·</span>
                      Updated{" "}
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                      }).format(new Date(document.updated_at))}
                    </p>
                    {document.application_id ? (
                      <Link
                        className="writing-application-link"
                        to={`/app/applications/${document.application_id}`}
                      >
                        <Link2 aria-hidden="true" />
                        <span>
                          <strong>
                            {document.application_title ?? "Linked application"}
                          </strong>
                          {document.application_stage
                            ? label(document.application_stage)
                            : "Application"}
                        </span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="writing-application-link is-empty"
                        onClick={() => setLinking(document)}
                      >
                        <Link2 aria-hidden="true" />
                        <span>
                          <strong>Link an application</strong>
                          Ground this document in its destination
                        </span>
                      </button>
                    )}
                  </div>
                  <footer>
                    <Link
                      className="primary writing-continue"
                      to={`/app/writing/${document.id}`}
                    >
                      {document.status === "archived"
                        ? "View document"
                        : "Continue writing"}
                    </Link>
                    {document.word_limit ? (
                      <span>
                        {words}/{document.word_limit.toLocaleString()} words
                      </span>
                    ) : (
                      <span>No word limit</span>
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
        </>
      ) : documents.length ? (
        <div className="vault-empty writing-filter-empty">
          <Search aria-hidden="true" />
          <h2>No documents match these filters</h2>
          <p>Try a different search, status, type or application.</p>
          <button type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="vault-empty">
          <FilePlus2 aria-hidden="true" />
          <h2>No writing documents yet</h2>
          <p>Start with a statement, essay, study plan or academic CV.</p>
          <button
            type="button"
            className="primary"
            onClick={() => setCreating(true)}
          >
            Create your first document
          </button>
        </div>
      )}
      {archive.isError || duplicate.isError || unlink.isError ? (
        <p className="form-error" role="alert">
          That document action could not be completed. Refresh and try again.
        </p>
      ) : null}
      {creating ? (
        <NewWritingDialog onClose={() => setCreating(false)} />
      ) : null}
      {linking ? (
        <WritingApplicationDialog
          key={`${linking.id}:${linking.application_id ?? ""}`}
          document={linking}
          onClose={() => setLinking(null)}
          onLinked={() => {
            setLinking(null);
            void refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function WritingApplicationDialog({
  document,
  onClose,
  onLinked,
}: {
  document: S["WritingDocumentResponse"];
  onClose: () => void;
  onLinked: () => void;
}) {
  const [application, setApplication] = useState({
    id: document.application_id ?? "",
    name: document.application_title ?? "",
  });
  const linkApplication = useMutation({
    mutationFn: () => writingApi.attach(document.id, application.id),
    onSuccess: onLinked,
  });
  return (
    <div className="apps-dialog-backdrop" role="presentation" onClick={onClose}>
      <section
        className="apps-dialog writing-link-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="writing-link-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="apps-dialog-header">
          <div>
            <h2 id="writing-link-title">
              {document.application_id
                ? "Change linked application"
                : "Link to an application"}
            </h2>
            <p className="apps-dialog-subtext">
              Connect “{document.title}” so its context appears throughout your
              application workspace.
            </p>
          </div>
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              onClose();
            }}
            onClick={onClose}
            aria-label="Close"
          >
            <X aria-hidden="true" />
          </button>
        </header>
        <form
          className="apps-dialog-body"
          onSubmit={(event) => {
            event.preventDefault();
            linkApplication.mutate();
          }}
        >
          <EntityCombobox
            queryKey={queryKeys.applications}
            search={async (search) =>
              (
                await applicationsApi.list({
                  search,
                  limit: 10,
                })
              ).items.map((application) => ({
                id: application.id,
                name: application.title,
                hint: label(application.stage),
              }))
            }
            label="Application"
            placeholder="Search your applications…"
            value={application.id}
            valueLabel={application.name}
            onChange={(id, name) => setApplication({ id, name })}
          />
          {linkApplication.isError ? (
            <p className="form-error" role="alert">
              This document could not be linked. Try again.
            </p>
          ) : null}
          <div className="dialog-actions">
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                onClose();
              }}
              onClick={onClose}
              disabled={linkApplication.isPending}
            >
              Cancel
            </button>
            <button
              className="primary"
              disabled={
                !application.id ||
                application.id === document.application_id ||
                linkApplication.isPending
              }
            >
              {linkApplication.isPending
                ? "Saving…"
                : document.application_id
                  ? "Change application"
                  : "Link application"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
/** `/app/writing/new` predates the modal; it now opens the same dialog over the library. */
export function NewWriting() {
  return <WritingLibrary openCreate />;
}
/** Save state as a badge: unsaved edits, in-flight save, saved, or the failure reason. */
function SaveState({ dirty, status }: { dirty: boolean; status: string }) {
  if (dirty)
    return (
      <StatusBadge tone="amber" icon={CircleDashed}>
        Unsaved changes
      </StatusBadge>
    );
  if (status.startsWith("Saving"))
    return (
      <StatusBadge tone="blue" icon={Loader2}>
        Saving…
      </StatusBadge>
    );
  if (status === "Saved")
    return (
      <StatusBadge tone="green" icon={Check}>
        Saved
      </StatusBadge>
    );
  return (
    <StatusBadge tone="red" icon={AlertTriangle}>
      {status}
    </StatusBadge>
  );
}
export function WritingEditor() {
  const [attachPick, setAttachPick] = useState({ id: "", name: "" });
  const { id = "" } = useParams(),
    qc = useQueryClient(),
    nav = useNavigate(),
    location = useLocation();
  const q = useQuery({
    queryKey: queryKeys.writingDocument(id),
    queryFn: () => writingApi.get(id),
  });
  const revisions = useQuery({
    queryKey: [...queryKeys.writingDocument(id), "revisions"],
    queryFn: () => writingApi.revisions(id),
  });
  const analyses = useQuery({
    queryKey: [...queryKeys.writingDocument(id), "analyses"],
    queryFn: () => writingApi.analyses(id),
  });
  const runs = useQuery({
    queryKey: queryKeys.generationRuns(id),
    queryFn: () => writingApi.generationRuns(id),
  });
  const entitlements = useQuery({
    queryKey: queryKeys.entitlements,
    queryFn: billingApi.entitlements,
    retry: false,
  });
  const [text, setText] = useState(""),
    [font, setFont] = useState<FontKey>(DEFAULT_FONT),
    [dirty, setDirty] = useState(false),
    [status, setStatus] = useState("Saved"),
    [quality, setQuality] = useState<S["QualityAnalysisResponse"] | null>(null),
    [analyzing, setAnalyzing] = useState(false),
    [analyzeError, setAnalyzeError] = useState(""),
    [activeRunId, setActiveRunId] = useState(""),
    [showPreview, setShowPreview] = useState(false),
    [showReview, setShowReview] = useState(false),
    [generationPending, setGenerationPending] = useState(false),
    [profileRequirement, setProfileRequirement] =
      useState<AcademicProfileRequirement | null>(null),
    [generationDraft, setGenerationDraft] =
      useState<WritingGenerationNavigationDraft>(() =>
        readGenerationDraft(location.state, id),
      );
  const pollStep = useRef(0);
  const previewDialogRef = useRef<HTMLDialogElement>(null);
  const activeRun = useQuery({
    queryKey: ["generation-run", activeRunId],
    queryFn: ({ signal }) => writingApi.generationRun(activeRunId, signal),
    enabled: Boolean(activeRunId),
    refetchInterval: (query) => {
      const run = query.state.data;
      if (!run || isTerminal(run.status) || document.hidden) return false;
      return Math.min(1_000 * 2 ** pollStep.current++, 10_000);
    },
  });
  const preview = useQuery({
    queryKey: [...queryKeys.writingDocument(id), "preview"],
    queryFn: () => writingApi.preview(id),
    enabled: showPreview,
  });
  useEffect(() => {
    const node = previewDialogRef.current;
    if (showPreview && node && !node.open) node.showModal();
  }, [showPreview]);
  useEffect(() => {
    if (q.data) {
      setText(contentToHtml(q.data.content));
      setFont(documentFont(q.data.content));
      setDirty(false);
    }
  }, [q.data?.version]);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    addEventListener("beforeunload", guard);
    return () => removeEventListener("beforeunload", guard);
  }, [dirty]);
  useEffect(() => {
    if (activeRunId || !runs.data) return;
    const resumable = runs.data.find((run) => !isTerminal(run.status));
    if (resumable) setActiveRunId(resumable.id);
  }, [activeRunId, runs.data]);
  useEffect(() => {
    if (!activeRun.data || !isTerminal(activeRun.data.status)) return;
    pollStep.current = 0;
    if (isSuccessful(activeRun.data.status)) {
      void Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.writingDocument(id) }),
        qc.invalidateQueries({
          queryKey: [...queryKeys.writingDocument(id), "revisions"],
        }),
        qc.invalidateQueries({ queryKey: queryKeys.generationRuns(id) }),
        qc.invalidateQueries({ queryKey: queryKeys.usage }),
        qc.invalidateQueries({ queryKey: queryKeys.entitlements }),
      ]);
    }
  }, [activeRun.data?.status, id, qc]);
  const counts = useMemo(() => countText(text), [text]);
  async function save() {
    if (!q.data) return;
    setStatus("Saving…");
    try {
      const next = await writingApi.update(id, {
        expected_version: q.data.version,
        content: mergeHtml(q.data.content, text, font),
        revision_name: "Manual save",
      });
      qc.setQueryData(["writing", id], next);
      setDirty(false);
      setStatus("Saved");
    } catch (x) {
      setStatus(saveFailureMessage(x));
    }
  }
  async function analyze() {
    setAnalyzing(true);
    setAnalyzeError("");
    try {
      setQuality(await writingApi.analyze(id));
      void analyses.refetch();
    } catch {
      setAnalyzeError("The analysis could not be completed. Try again.");
    } finally {
      setAnalyzing(false);
    }
  }
  async function generate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGenerationPending(true);
    try {
      const r = await writingApi.generate(id, {
        mutation_id: crypto.randomUUID(),
        operation:
          generationDraft.operation as S["GenerateWritingRequest"]["operation"],
        instruction: generationDraft.instruction,
        evidence_ids: [],
      });
      pollStep.current = 0;
      setActiveRunId(r.id);
      qc.setQueryData(["generation-run", r.id], r);
      void runs.refetch();
    } catch (error) {
      const requirement = academicProfileRequirement(error);
      if (!requirement) throw error;
      setProfileRequirement(requirement);
    } finally {
      setGenerationPending(false);
    }
  }
  async function retryGeneration(runId: string) {
    setGenerationPending(true);
    try {
      const next = await writingApi.retryGeneration(runId);
      pollStep.current = 0;
      setActiveRunId(next.id);
      qc.setQueryData(["generation-run", next.id], next);
    } catch (error) {
      const requirement = academicProfileRequirement(error);
      if (!requirement) throw error;
      setProfileRequirement(requirement);
    } finally {
      setGenerationPending(false);
    }
  }
  function completeAcademicProfile() {
    if (!profileRequirement) return;
    const state: AcademicProfileNavigationState = {
      returnTo: `${location.pathname}${location.search}${location.hash}`,
      missingFields: profileRequirement.missingFields,
      writingGenerationDraft: generationDraft,
    };
    nav(academicProfileEducationPath(), { state });
  }
  async function download(format: "txt" | "docx" | "pdf") {
    await downloadResponse(
      await writingApi.export(id, format),
      `${q.data?.title ?? "eliteapply"}.${format}`,
    );
  }
  if (q.isPending) return <div className="page">Loading editor…</div>;
  if (!q.data)
    return (
      <div className="page error-state">
        <h1>Document unavailable</h1>
        <p>
          {q.isError
            ? "The document could not be loaded. It may be a temporary connection problem."
            : "This document is not available."}
        </p>
        <div className="detail-actions">
          <button type="button" onClick={() => void q.refetch()}>
            Try again
          </button>
          <Link className="secondary-action" to="/app/writing">
            Back to Writing Studio
          </Link>
        </div>
      </div>
    );
  return (
    <div className="writing-editor">
      <header>
        <div className="writing-identity">
          <Link to="/app/writing">
            <ChevronLeft aria-hidden="true" />
            Writing Studio
          </Link>
          <div className="writing-identity-line">
            <h1>{q.data.title}</h1>
            <SaveState dirty={dirty} status={status} />
          </div>
          <p className="writing-identity-meta">
            {label(q.data.document_type)} · {counts.words} words
          </p>
        </div>
        <div>
          <button onClick={() => setShowPreview((value) => !value)}>
            <Eye />
            Preview
          </button>
          <button onClick={() => setShowReview((value) => !value)}>
            <MessageCircle />
            Review
          </button>
          <button onClick={analyze} disabled={analyzing}>
            <Gauge />
            {analyzing ? "Analyzing…" : "Analyze quality"}
          </button>
          <button onClick={save} disabled={!dirty}>
            Save
          </button>
          <Select
            ariaLabel="Export"
            value=""
            onChange={(value) =>
              value && download(String(value) as "txt" | "docx" | "pdf")
            }
            options={[
              { value: "", label: "Export", disabled: true },
              { value: "txt", label: "TXT" },
              { value: "docx", label: "DOCX" },
              { value: "pdf", label: "PDF" },
            ]}
          />
          <button
            className="icon-only"
            aria-label="Duplicate document"
            onClick={async () => {
              const next = await writingApi.duplicate(id, {
                title_suffix: " (copy)",
                keep_application_link: true,
              });
              nav(`/app/writing/${next.id}`);
            }}
          >
            <Copy />
          </button>
          <button
            className="icon-only"
            aria-label="Delete document"
            onClick={async () => {
              if (
                confirm("Delete this writing document? This cannot be undone.")
              ) {
                await writingApi.remove(id);
                nav("/app/writing");
              }
            }}
          >
            <Trash2 />
          </button>
        </div>
      </header>
      {q.isRefetchError ? (
        <p className="form-error writing-sync-error" role="alert">
          The latest version could not be loaded. Your open document is still
          available; try saving or refreshing again when the connection
          recovers.
        </p>
      ) : null}
      <div className="editor-grid">
        <DocumentOutline
          html={text}
          revisions={revisions.data ?? []}
          onRestore={async (revisionId) => {
            qc.setQueryData(
              queryKeys.writingDocument(id),
              await writingApi.restore(id, revisionId),
            );
            void revisions.refetch();
          }}
        />
        <main>
          <TrixField
            ariaLabel="Document content"
            value={text}
            font={font}
            onChange={(html) => {
              setText(html);
              setDirty(true);
              setStatus("Unsaved");
            }}
            toolbarExtra={
              <Select
                ariaLabel="Typeface"
                value={font}
                onChange={(value) => {
                  setFont(value as FontKey);
                  setDirty(true);
                  setStatus("Unsaved");
                }}
                options={FONTS.map((option) => ({ ...option }))}
              />
            }
          />
          <footer>
            <span>
              Words: {counts.words} · Characters: {counts.chars}
            </span>
            {q.data.word_limit ? (
              <span
                className={counts.words > q.data.word_limit ? "limit-over" : ""}
              >
                Guidance limit: {q.data.word_limit} words
              </span>
            ) : null}
            {q.data.character_limit ? (
              <span
                className={
                  counts.chars > q.data.character_limit ? "limit-over" : ""
                }
              >
                Character limit: {q.data.character_limit}
              </span>
            ) : null}
          </footer>
        </main>
        <aside className="context-rail">
          <h2>Application context</h2>
          <p>
            {q.data.application_id
              ? (q.data.application_title ?? "Linked application") +
                (q.data.application_stage
                  ? ` · ${label(q.data.application_stage)}`
                  : "")
              : "Standalone document"}
          </p>
          {q.data.application_id ? (
            <button
              onClick={async () => {
                const next = await writingApi.detach(
                  id,
                  q.data.application_id!,
                );
                qc.setQueryData(queryKeys.writingDocument(id), next);
              }}
            >
              Detach application
            </button>
          ) : (
            <>
              <EntityCombobox
                queryKey={queryKeys.applications}
                search={async (search) => {
                  const result = await applicationsApi.list({
                    search,
                    limit: 10,
                  });
                  return result.items.map((app) => ({
                    id: app.id,
                    name: app.title,
                    hint: label(app.stage),
                  }));
                }}
                label="Application"
                placeholder="Search your applications…"
                value={attachPick.id}
                valueLabel={attachPick.name}
                onChange={(pickedId, name) =>
                  setAttachPick({ id: pickedId, name })
                }
              />
              <button
                disabled={!attachPick.id}
                onClick={async () => {
                  const next = await writingApi.attach(id, attachPick.id);
                  qc.setQueryData(queryKeys.writingDocument(id), next);
                  setAttachPick({ id: "", name: "" });
                }}
              >
                Attach application
              </button>
            </>
          )}
          <h2>Generate suggestion</h2>
          <form onSubmit={generate}>
            <label>
              <span>Operation</span>
              <Select
                ariaLabel="Operation"
                value={generationDraft.operation}
                onChange={(value) =>
                  setGenerationDraft((current) => ({
                    ...current,
                    operation: String(value),
                  }))
                }
                options={[
                  { value: "generate_outline", label: "Generate outline" },
                  { value: "draft_section", label: "Draft section" },
                  { value: "improve_paragraph", label: "Improve paragraph" },
                  {
                    value: "academic_cv_bullets",
                    label: "Academic CV bullets",
                  },
                ]}
              />
            </label>
            <label>
              <span>Instruction</span>
              <textarea
                name="instruction"
                required
                minLength={2}
                rows={4}
                value={generationDraft.instruction}
                onChange={(event) =>
                  setGenerationDraft((current) => ({
                    ...current,
                    instruction: event.target.value,
                  }))
                }
              />
            </label>
            <button
              className="primary"
              disabled={
                Boolean(
                  entitlements.data &&
                  entitlements.data.ai_tokens_limit -
                    entitlements.data.ai_tokens_used +
                    entitlements.data.purchased_tokens_remaining <=
                    0,
                ) ||
                Boolean(activeRun.data && !isTerminal(activeRun.data.status)) ||
                generationPending
              }
            >
              <Sparkles />
              {generationPending
                ? "Starting generation…"
                : "Generate suggestion"}
            </button>
          </form>
          {activeRun.data ? (
            <GenerationStatus
              run={activeRun.data}
              onCancel={async () => {
                const next = await writingApi.cancelGeneration(
                  activeRun.data!.id,
                );
                qc.setQueryData(["generation-run", next.id], next);
              }}
              onRetry={async () => {
                await retryGeneration(activeRun.data!.id);
              }}
              retrying={generationPending}
            />
          ) : null}
          {entitlements.data &&
          entitlements.data.ai_tokens_limit -
            entitlements.data.ai_tokens_used +
            entitlements.data.purchased_tokens_remaining <=
            0 ? (
            <p className="form-error">
              Generation is unavailable because no AI tokens remain. The server
              will verify entitlement again.
            </p>
          ) : null}
          {analyzeError ? (
            <p className="form-error" role="alert">
              {analyzeError}
            </p>
          ) : null}
          {analyses.data?.items.length ? (
            <details>
              <summary>Analysis history ({analyses.data.items.length})</summary>
              {analyses.data.items.map((item) => (
                <button key={item.id} onClick={() => setQuality(item)}>
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(item.created_at))}
                </button>
              ))}
            </details>
          ) : null}
        </aside>
      </div>
      {showPreview ? (
        <dialog
          ref={previewDialogRef}
          className="writing-preview"
          aria-labelledby="writing-preview-title"
          onCancel={(event) => {
            event.preventDefault();
            setShowPreview(false);
          }}
        >
          <header>
            <div>
              <h2 id="writing-preview-title">Document preview</h2>
              <p>
                {preview.data
                  ? `${preview.data.word_count} words · ${preview.data.character_count} characters`
                  : "Preparing preview…"}
              </p>
            </div>
            <button
              type="button"
              className="writing-preview-close"
              onClick={() => setShowPreview(false)}
            >
              <X aria-hidden="true" />
              <span>Close</span>
            </button>
          </header>
          <div className="writing-preview-canvas">
            {preview.data ? (
              <iframe
                title="Sanitized document preview"
                sandbox=""
                srcDoc={previewDocument(preview.data.html)}
              />
            ) : preview.isError ? (
              <div className="writing-preview-state" role="alert">
                <AlertTriangle aria-hidden="true" />
                <p>We couldn’t prepare this preview.</p>
                <button type="button" onClick={() => void preview.refetch()}>
                  Try again
                </button>
              </div>
            ) : (
              <div className="writing-preview-state" role="status">
                <Loader2
                  className="writing-preview-spinner"
                  aria-hidden="true"
                />
                <p>Preparing your document preview…</p>
              </div>
            )}
          </div>
        </dialog>
      ) : null}
      {showReview ? (
        <WritingReviewDrawer
          documentId={id}
          revisions={revisions.data ?? []}
          onClose={() => setShowReview(false)}
        />
      ) : null}
      {quality ? (
        <QualityAnalysisDialog
          analysis={quality}
          onClose={() => setQuality(null)}
        />
      ) : null}
      {profileRequirement ? (
        <ConfirmationDialog
          title="Complete your Academic Profile"
          confirmLabel="Complete Academic Profile"
          cancelLabel="Not now"
          pending={false}
          danger={false}
          onCancel={() => setProfileRequirement(null)}
          onConfirm={completeAcademicProfile}
        >
          <p>{profileRequirement.detail}</p>
          {profileRequirement.missingFields.length ? (
            <div>
              <strong>Missing information</strong>
              <ul>
                {profileRequirement.missingFields.map((field) => (
                  <li key={field}>{academicProfileFieldLabel(field)}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </ConfirmationDialog>
      ) : null}
    </div>
  );
}

function readGenerationDraft(
  state: unknown,
  documentId: string,
): WritingGenerationNavigationDraft {
  const value =
    state && typeof state === "object"
      ? (state as { writingGenerationDraft?: unknown }).writingGenerationDraft
      : null;
  if (
    value &&
    typeof value === "object" &&
    (value as { documentId?: unknown }).documentId === documentId &&
    typeof (value as { operation?: unknown }).operation === "string" &&
    typeof (value as { instruction?: unknown }).instruction === "string"
  )
    return value as WritingGenerationNavigationDraft;
  return { documentId, ...DEFAULT_GENERATION_DRAFT };
}

function isTerminal(status: string) {
  return [
    "completed",
    "complete",
    "succeeded",
    "success",
    "failed",
    "cancelled",
    "canceled",
  ].includes(status.toLowerCase());
}
function isSuccessful(status: string) {
  return ["completed", "complete", "succeeded", "success"].includes(
    status.toLowerCase(),
  );
}
function GenerationStatus({
  run,
  onCancel,
  onRetry,
  retrying,
}: {
  run: S["GenerationRunResponse"];
  onCancel: () => void;
  onRetry: () => void;
  retrying: boolean;
}) {
  const active = !isTerminal(run.status),
    failed = run.status.toLowerCase() === "failed";
  return (
    <section className="generation-status" aria-live="polite">
      <span className={`status-pill status-${run.status.toLowerCase()}`}>
        {label(run.status)}
      </span>
      <p>
        {run.failure_reason ||
          (active
            ? "Generation is running. Polling pauses while this tab is hidden."
            : "Generation finished.")}
      </p>
      {run.retry_of_id ? (
        <small>Retry of run {run.retry_of_id.slice(0, 8)}</small>
      ) : null}
      {active ? (
        <button type="button" onClick={onCancel}>
          Cancel generation
        </button>
      ) : failed ? (
        <button type="button" onClick={onRetry} disabled={retrying}>
          {retrying ? "Retrying…" : "Retry as a new run"}
        </button>
      ) : null}
    </section>
  );
}
