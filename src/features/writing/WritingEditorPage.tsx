import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  CircleDashed,
  Copy,
  Eye,
  Gauge,
  Loader2,
  MessageCircle,
  Sparkles,
  Trash2,
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
import { DocumentOutline } from "./DocumentOutline";
import { WritingReviewDrawer } from "./WritingReviewDrawer";
import { StatusBadge } from "../../components/data-display/StatusBadge";
import { AiNotice, generationProvenance } from "../../components/common/AiNotice";
import { GeneratedPageSkeleton } from "../../components/page/PageSkeleton";
import { WorkspacePageGuideButton } from "../../components/AppShell";
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
    [saving, setSaving] = useState(false),
    [status, setStatus] = useState("Saved"),
    [exporting, setExporting] = useState<"txt" | "docx" | "pdf" | null>(
      null,
    ),
    [exportError, setExportError] = useState(""),
    [duplicating, setDuplicating] = useState(false),
    [duplicateError, setDuplicateError] = useState(""),
    [linking, setLinking] = useState(false),
    [linkError, setLinkError] = useState(""),
    [confirmingDelete, setConfirmingDelete] = useState(false),
    [deleting, setDeleting] = useState(false),
    [deleteError, setDeleteError] = useState(""),
    [quality, setQuality] = useState<S["QualityAnalysisResponse"] | null>(null),
    [analyzing, setAnalyzing] = useState(false),
    [analyzeError, setAnalyzeError] = useState(""),
    [generationError, setGenerationError] = useState(""),
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
  const pendingGeneration = useRef<{
    mutationId: string;
    operation: string;
    instruction: string;
  } | null>(null);
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
  const textRef = useRef(text);
  const fontRef = useRef(font);
  textRef.current = text;
  fontRef.current = font;
  const counts = useMemo(() => countText(text), [text]);
  async function save() {
    if (!q.data) return false;
    const savedText = text;
    const savedFont = font;
    setSaving(true);
    setStatus("Saving…");
    try {
      const next = await writingApi.update(id, {
        expected_version: q.data.version,
        content: mergeHtml(q.data.content, savedText, savedFont),
        revision_name: "Manual save",
      });
      qc.setQueryData(["writing", id], next);
      const fullySaved =
        textRef.current === savedText && fontRef.current === savedFont;
      setDirty(!fullySaved);
      setStatus(fullySaved ? "Saved" : "Unsaved");
      return fullySaved;
    } catch (x) {
      setStatus(saveFailureMessage(x));
      return false;
    } finally {
      setSaving(false);
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
    setGenerationError("");
    // Reuse one mutation_id across retries of the same payload: if the server
    // started (and billed) a run but the response never arrived, minting a
    // fresh UUID on the next click would defeat the backend's idempotency key
    // and could start a duplicate run. Only mint a new one when the request
    // actually changed or the previous attempt is confirmed done.
    const pending = pendingGeneration.current;
    const sameRequest =
      pending &&
      pending.operation === generationDraft.operation &&
      pending.instruction === generationDraft.instruction;
    const mutationId = sameRequest ? pending.mutationId : crypto.randomUUID();
    pendingGeneration.current = {
      mutationId,
      operation: generationDraft.operation,
      instruction: generationDraft.instruction,
    };
    try {
      const r = await writingApi.generate(id, {
        mutation_id: mutationId,
        operation:
          generationDraft.operation as S["GenerateWritingRequest"]["operation"],
        instruction: generationDraft.instruction,
        evidence_ids: [],
      });
      pendingGeneration.current = null;
      pollStep.current = 0;
      setActiveRunId(r.id);
      qc.setQueryData(["generation-run", r.id], r);
      void runs.refetch();
    } catch (error) {
      const requirement = academicProfileRequirement(error);
      if (requirement) setProfileRequirement(requirement);
      else setGenerationError("The generation could not be started. Try again.");
    } finally {
      setGenerationPending(false);
    }
  }
  async function retryGeneration(runId: string) {
    setGenerationPending(true);
    setGenerationError("");
    try {
      const next = await writingApi.retryGeneration(runId);
      pollStep.current = 0;
      setActiveRunId(next.id);
      qc.setQueryData(["generation-run", next.id], next);
    } catch (error) {
      const requirement = academicProfileRequirement(error);
      if (requirement) setProfileRequirement(requirement);
      else setGenerationError("The retry could not be started. Try again.");
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
    setExporting(format);
    setExportError("");
    try {
      if (dirty && !(await save())) {
        setExportError(
          "The latest changes could not be saved, so the export was not downloaded.",
        );
        return;
      }
      await downloadResponse(
        await writingApi.export(id, format),
        `${q.data?.title ?? "eliteapply"}.${format}`,
      );
    } catch {
      setExportError(
        `The ${format.toUpperCase()} export could not be prepared. Try again.`,
      );
    } finally {
      setExporting(null);
    }
  }
  if (q.isPending) return <GeneratedPageSkeleton page="writingEditor" />;
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
          <WorkspacePageGuideButton />
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
          <button onClick={() => void save()} disabled={!dirty || saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          <Select
            ariaLabel="Export"
            value=""
            disabled={Boolean(exporting) || saving}
            onChange={(value) =>
              value &&
              void download(String(value) as "txt" | "docx" | "pdf")
            }
            options={[
              {
                value: "",
                label: exporting
                  ? `Exporting ${exporting.toUpperCase()}…`
                  : "Export",
                disabled: true,
              },
              { value: "txt", label: "TXT" },
              { value: "docx", label: "DOCX" },
              { value: "pdf", label: "PDF" },
            ]}
          />
          <button
            className="icon-only"
            aria-label="Duplicate document"
            disabled={duplicating}
            onClick={async () => {
              setDuplicating(true);
              setDuplicateError("");
              try {
                const next = await writingApi.duplicate(id, {
                  title_suffix: " (copy)",
                  keep_application_link: true,
                });
                nav(`/app/writing/${next.id}`);
              } catch (caught) {
                setDuplicateError(
                  caught instanceof Error
                    ? caught.message
                    : "Could not duplicate this document. Try again shortly.",
                );
                setDuplicating(false);
              }
            }}
          >
            <Copy />
          </button>
          <button
            className="icon-only"
            aria-label="Delete document"
            onClick={() => setConfirmingDelete(true)}
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
      {exportError ? (
        <p className="form-error writing-sync-error" role="alert">
          {exportError}
        </p>
      ) : null}
      {duplicateError ? (
        <p className="form-error writing-sync-error" role="alert">
          {duplicateError}
        </p>
      ) : null}
      {deleteError ? (
        <p className="form-error writing-sync-error" role="alert">
          {deleteError}
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
          {linkError ? (
            <p className="form-error writing-sync-error" role="alert">
              {linkError}
            </p>
          ) : null}
          {q.data.application_id ? (
            <button
              disabled={linking}
              onClick={async () => {
                setLinking(true);
                setLinkError("");
                try {
                  const next = await writingApi.detach(
                    id,
                    q.data.application_id!,
                  );
                  qc.setQueryData(queryKeys.writingDocument(id), next);
                } catch (caught) {
                  setLinkError(
                    caught instanceof Error
                      ? caught.message
                      : "Could not detach the application. Try again shortly.",
                  );
                } finally {
                  setLinking(false);
                }
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
                disabled={!attachPick.id || linking}
                onClick={async () => {
                  setLinking(true);
                  setLinkError("");
                  try {
                    const next = await writingApi.attach(id, attachPick.id);
                    qc.setQueryData(queryKeys.writingDocument(id), next);
                    setAttachPick({ id: "", name: "" });
                  } catch (caught) {
                    setLinkError(
                      caught instanceof Error
                        ? caught.message
                        : "Could not attach the application. Try again shortly.",
                    );
                  } finally {
                    setLinking(false);
                  }
                }}
              >
                Attach application
              </button>
            </>
          )}
          <h2>Generate suggestion</h2>
          <AiNotice>
            Suggestions are written by an AI model from your instruction and
            this document. Saved as a new AI-assisted version you can review,
            edit or restore — check every fact before you submit.
          </AiNotice>
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
                setGenerationError("");
                try {
                  const next = await writingApi.cancelGeneration(
                    activeRun.data!.id,
                  );
                  qc.setQueryData(["generation-run", next.id], next);
                } catch {
                  setGenerationError(
                    "The generation could not be cancelled. It may still be running.",
                  );
                }
              }}
              onRetry={async () => {
                await retryGeneration(activeRun.data!.id);
              }}
              retrying={generationPending}
            />
          ) : null}
          {generationError ? (
            <p className="form-error" role="alert">
              {generationError}
            </p>
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
      {confirmingDelete ? (
        <ConfirmationDialog
          title="Delete this writing document?"
          confirmLabel="Delete document"
          pendingLabel="Deleting…"
          pending={deleting}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={async () => {
            setDeleting(true);
            setDeleteError("");
            try {
              await writingApi.remove(id);
              nav("/app/writing");
            } catch (caught) {
              setDeleteError(
                caught instanceof Error
                  ? caught.message
                  : "Could not delete this document. Try again shortly.",
              );
              setDeleting(false);
              setConfirmingDelete(false);
            }
          }}
        >
          <p>This cannot be undone.</p>
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
    failed = run.status.toLowerCase() === "failed",
    provenance = generationProvenance(run);
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
      {provenance ? (
        <AiNotice compact link={false} provenance={provenance}>
          Generated by an AI model.
        </AiNotice>
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
