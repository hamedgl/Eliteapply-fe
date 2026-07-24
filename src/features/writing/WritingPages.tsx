import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  Eye,
  FilePlus2,
  History,
  MessageCircle,
  Share2,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { writingApi } from "../../lib/api/phase3";
import { ApiError } from "../../lib/api/errors";
import { downloadResponse } from "../../lib/api/download";
import { billingApi } from "../../lib/api/billing";
import { queryKeys } from "../../lib/api/queryKeys";
import { previewDocument } from "../../lib/safeHtml";
import { usePromptDialog } from "../../components/PromptDialog";
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
import {
  contentToHtml,
  countText,
  documentFont,
  DEFAULT_FONT,
  FONTS,
  mergeHtml,
  type FontKey,
} from "./documentHtml";
import type { components } from "../../generated/api/schema";
type S = components["schemas"];
const types = [
  "academic_cv",
  "motivation_letter",
  "statement_of_purpose",
  "personal_statement",
  "letter_of_intent",
  "scholarship_essay",
  "study_plan",
  "research_interest",
  "short_answer",
  "custom_essay",
] as const;
const label = (x: string) =>
  x.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
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
export function WritingLibrary() {
  const qc = useQueryClient();
  const [includeArchived, setIncludeArchived] = useState(false);
  const q = useQuery({
    queryKey: ["writing", { includeArchived }],
    queryFn: () => writingApi.list(undefined, includeArchived),
  });
  const archive = useMutation({
    mutationFn: (document: NonNullable<typeof q.data>[number]) =>
      writingApi.update(document.id, {
        expected_version: document.version,
        status: document.status === "archived" ? "draft" : "archived",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["writing"] }),
  });
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
        <Link className="primary" to="/app/writing/new">
          <FilePlus2 />
          New document
        </Link>
      </header>
      <label className="writing-archive-filter">
        <input
          type="checkbox"
          checked={includeArchived}
          onChange={(event) => setIncludeArchived(event.target.checked)}
        />
        Include archived documents
      </label>
      {q.isPending ? (
        <p>Loading documents…</p>
      ) : q.data?.length ? (
        <div className="writing-list">
          {q.data.map((d) => (
            <article key={d.id}>
              <Link to={`/app/writing/${d.id}`}>
                <strong>{d.title}</strong>
                <span>
                  {label(d.document_type)} · {label(d.status)}
                </span>
                <time>
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: "medium",
                  }).format(new Date(d.updated_at))}
                </time>
              </Link>
              <button
                type="button"
                disabled={archive.isPending}
                onClick={() => archive.mutate(d)}
              >
                {d.status === "archived" ? "Restore" : "Archive"}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="vault-empty">
          <h2>No writing documents yet</h2>
          <p>Start with a statement, essay, study plan or academic CV.</p>
        </div>
      )}
      {archive.isError ? (
        <p className="form-error" role="alert">
          The document status could not be updated.
        </p>
      ) : null}
    </div>
  );
}
export function NewWriting() {
  const nav = useNavigate(),
    qc = useQueryClient(),
    [error, setError] = useState(""),
    [documentType, setDocumentType] =
      useState<(typeof types)[number]>("motivation_letter"),
    [applicationType, setApplicationType] = useState("programme"),
    [templateId, setTemplateId] = useState("");
  const templates = useQuery({
    queryKey: ["writing-templates", documentType, applicationType],
    queryFn: () => writingApi.templates(documentType, applicationType),
  });
  const template = useQuery({
    queryKey: ["writing-template", templateId],
    queryFn: () => writingApi.template(templateId),
    enabled: Boolean(templateId),
  });
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const x = await writingApi.create({
        title: String(d.title),
        document_type: documentType,
        cv_mode:
          documentType === "academic_cv"
            ? (d.cv_mode as S["WritingDocumentCreate"]["cv_mode"])
            : null,
        prompt_text: String(d.prompt_text) || null,
        word_limit: d.word_limit ? Number(d.word_limit) : null,
        character_limit: d.character_limit ? Number(d.character_limit) : null,
        template_id: templateId || null,
        content: { text: "" },
        target_requirements: {},
        evidence_map: {},
        theme: {},
      });
      qc.setQueryData(queryKeys.writingDocument(x.id), x);
      for (const includeArchived of [false, true])
        qc.setQueryData<S["WritingDocumentResponse"][]>(
          ["writing", { includeArchived }],
          (current) => [
            x,
            ...(current ?? []).filter((item) => item.id !== x.id),
          ],
        );
      nav(`/app/writing/${x.id}`);
    } catch (x) {
      setError(x instanceof Error ? x.message : "Could not create document.");
    }
  }
  return (
    <div className="page">
      <h1>New writing document</h1>
      <form className="settings-form" onSubmit={submit}>
        <label>
          <span>Title</span>
          <input
            name="title"
            required
            minLength={2}
            placeholder="e.g. Statement of Purpose — Oxford MSc"
          />
        </label>
        <label>
          <span>Application type</span>
          <Select
            ariaLabel="Application type"
            value={applicationType}
            onChange={(value) => setApplicationType(String(value))}
            options={[
              { value: "programme", label: "Programme" },
              { value: "scholarship", label: "Scholarship" },
              { value: "fellowship", label: "Fellowship" },
              { value: "grant", label: "Grant" },
            ]}
          />
        </label>
        <label>
          <span>Document type</span>
          <Select
            ariaLabel="Document type"
            value={documentType}
            onChange={(value) => {
              setDocumentType(String(value) as typeof documentType);
              setTemplateId("");
            }}
            options={types.map((value) => ({ value, label: label(value) }))}
          />
        </label>
        {documentType === "academic_cv" ? (
          <label>
            <span>Academic CV mode</span>
            <Select
              ariaLabel="Academic CV mode"
              name="cv_mode"
              defaultValue="graduate"
              options={[
                { value: "graduate", label: "Graduate" },
                { value: "scholarship", label: "Scholarship" },
                { value: "research", label: "Research" },
                { value: "phd", label: "PhD" },
                { value: "undergraduate", label: "Undergraduate" },
                { value: "internship", label: "Internship" },
              ]}
            />
          </label>
        ) : null}
        <label>
          <span>Template</span>
          <Select
            ariaLabel="Template"
            value={templateId}
            disabled={templates.isPending}
            onChange={(value) => setTemplateId(String(value))}
            options={[
              { value: "", label: "Start without a template" },
              ...(templates.data ?? []).map((item) => ({
                value: item.id,
                label: item.name,
              })),
            ]}
          />
        </label>
        {template.data ? (
          <section className="template-preview">
            <strong>{template.data.name}</strong>
            <p>{template.data.description}</p>
            <ol>
              {template.data.sections.map((section) => (
                <li key={section.key}>
                  {section.label}
                  <small>{section.guidance}</small>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        <label>
          <span>Prompt or question</span>
          <textarea
            name="prompt_text"
            rows={4}
            placeholder="Paste the essay prompt or question here..."
          />
        </label>
        <div className="form-row-2">
          <label>
            <span>Word limit</span>
            <input
              name="word_limit"
              type="number"
              min={1}
              max={20000}
              placeholder="e.g. 500"
            />
          </label>
          <label>
            <span>Character limit</span>
            <input
              name="character_limit"
              type="number"
              min={1}
              max={100000}
              placeholder="e.g. 3000"
            />
          </label>
        </div>
        {error ? <p role="alert">{error}</p> : null}
        <div className="form-actions">
          <button className="primary">Create document</button>
        </div>
      </form>
    </div>
  );
}
export function WritingEditor() {
  const requestText = usePromptDialog();
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
    [quality, setQuality] = useState<Record<string, unknown> | null>(null),
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
    const r = await writingApi.analyze(id);
    setQuality({
      scores: r.scores,
      findings: r.findings,
      claims: r.claim_warnings,
    });
    void analyses.refetch();
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
        <div>
          <Link to="/app/writing">Writing Studio</Link>
          <h1>{q.data.title}</h1>
          <span className={`save-state ${dirty ? "dirty" : ""}`}>
            {dirty ? "Unsaved" : status}
          </span>
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
          <button onClick={analyze}>Analyze quality</button>
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
        <aside>
          <h2>Document outline</h2>
          {[
            "Introduction",
            "Academic background",
            "Research experience",
            "Why this programme",
            "Future goals",
          ].map((x) => (
            <button key={x}>{x}</button>
          ))}
          <button onClick={() => revisions.refetch()}>
            <History />
            Revision history
          </button>
          {revisions.data?.map((r) => (
            <button
              key={r.id}
              onClick={async () => {
                if (confirm("Restore this revision?")) {
                  const x = await writingApi.restore(id, r.id);
                  qc.setQueryData(["writing", id], x);
                }
              }}
            >
              Revision {r.revision_number} · {r.name ?? r.reason}
            </button>
          ))}
        </aside>
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
              ? `Linked application ${q.data.application_id.slice(0, 8)}`
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
            <button
              onClick={async () => {
                const applicationId = (
                  await requestText({
                    title: "Attach application",
                    label: "Application ID",
                    required: true,
                    submitLabel: "Attach",
                  })
                )?.trim();
                if (applicationId) {
                  const next = await writingApi.attach(id, applicationId);
                  qc.setQueryData(queryKeys.writingDocument(id), next);
                }
              }}
            >
              Attach application
            </button>
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
          {quality ? (
            <section className="quality">
              <h2>Quality analysis</h2>
              <ObjectView value={quality} />
              <strong>Guidance only — not an admission guarantee.</strong>
            </section>
          ) : null}
          {analyses.data?.items.length ? (
            <details>
              <summary>Analysis history ({analyses.data.items.length})</summary>
              {analyses.data.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    setQuality({
                      scores: item.scores,
                      findings: item.findings,
                      claims: item.claim_warnings,
                    })
                  }
                >
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
        <section className="writing-preview" aria-label="Document preview">
          <header>
            <div>
              <h2>Rendered preview</h2>
              <p>
                {preview.data
                  ? `${preview.data.word_count} words · ${preview.data.character_count} characters`
                  : "Preparing preview…"}
              </p>
            </div>
            <button onClick={() => setShowPreview(false)}>
              <XCircle />
              Close
            </button>
          </header>
          {preview.data ? (
            <iframe
              title="Sanitized document preview"
              sandbox=""
              srcDoc={previewDocument(preview.data.html)}
            />
          ) : null}
        </section>
      ) : null}
      {showReview ? (
        <WritingReview documentId={id} revisions={revisions.data ?? []} />
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

function WritingReview({
  documentId,
  revisions,
}: {
  documentId: string;
  revisions: S["WritingRevisionResponse"][];
}) {
  const requestText = usePromptDialog();
  const qc = useQueryClient(),
    comments = useQuery({
      queryKey: queryKeys.comments(documentId),
      queryFn: () => writingApi.comments(documentId),
    }),
    shares = useQuery({
      queryKey: queryKeys.shareLinks(documentId),
      queryFn: () => writingApi.shareLinks(documentId),
    }),
    [createdUrl, setCreatedUrl] = useState("");
  const refreshComments = () =>
    qc.invalidateQueries({ queryKey: queryKeys.comments(documentId) });
  const refreshShares = () =>
    qc.invalidateQueries({ queryKey: queryKeys.shareLinks(documentId) });
  return (
    <section className="writing-review">
      <div className="comments-panel">
        <header>
          <div>
            <h2>Comments</h2>
            <p>
              {comments.data?.total ?? comments.data?.items.length ?? 0} total ·{" "}
              {comments.data?.items.filter((x) => !x.resolved).length ?? 0}{" "}
              unresolved
            </p>
          </div>
        </header>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget,
              data = new FormData(form),
              start = data.get("anchor_start"),
              end = data.get("anchor_end");
            await writingApi.createComment(documentId, {
              body: String(data.get("body")),
              revision_id: String(data.get("revision_id")) || null,
              anchor:
                start !== "" && end !== ""
                  ? { start: Number(start), end: Number(end) }
                  : null,
            });
            form.reset();
            void refreshComments();
          }}
        >
          <label>
            <span>General or anchored comment</span>
            <textarea name="body" required maxLength={5000} rows={3} />
          </label>
          <label>
            <span>Revision (optional)</span>
            <Select
              ariaLabel="Revision"
              name="revision_id"
              defaultValue=""
              options={[
                { value: "", label: "Current document" },
                ...revisions.map((revision) => ({
                  value: revision.id,
                  label: `Revision ${revision.revision_number}`,
                })),
              ]}
            />
          </label>
          <div className="comment-anchor">
            <label>
              <span>Anchor start (optional)</span>
              <input name="anchor_start" type="number" min={0} />
            </label>
            <label>
              <span>Anchor end (optional)</span>
              <input name="anchor_end" type="number" min={0} />
            </label>
          </div>
          <button className="primary">Add comment</button>
        </form>
        <ul>
          {comments.data?.items.map((item) => (
            <li className={item.resolved ? "resolved" : ""} key={item.id}>
              <div>
                <strong>{item.author_label}</strong>
                <small>
                  {item.anchor ? `Anchored · ` : "General · "}
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: "medium",
                  }).format(new Date(item.created_at))}
                </small>
              </div>
              <p>{item.body}</p>
              <div>
                <button
                  onClick={async () => {
                    await writingApi.updateComment(item.id, {
                      resolved: !item.resolved,
                    });
                    void refreshComments();
                  }}
                >
                  {item.resolved ? "Reopen" : "Resolve"}
                </button>
                <button
                  onClick={async () => {
                    const body = (
                      await requestText({
                        title: "Edit comment",
                        label: "Comment",
                        initialValue: item.body,
                        multiline: true,
                        required: true,
                      })
                    )?.trim();
                    if (body) {
                      await writingApi.updateComment(item.id, { body });
                      void refreshComments();
                    }
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (confirm("Delete this comment?")) {
                      await writingApi.deleteComment(item.id);
                      void refreshComments();
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="share-panel">
        <header>
          <Share2 />
          <div>
            <h2>Share links</h2>
            <p>Create revocable view or comment access.</p>
          </div>
        </header>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget,
              data = new FormData(form);
            const created = await writingApi.createShareLink(documentId, {
              scope: data.get("scope") as "view" | "comment",
              passcode: String(data.get("passcode")) || null,
              expires_at: data.get("expires_at")
                ? new Date(String(data.get("expires_at"))).toISOString()
                : null,
            });
            setCreatedUrl(created.share_url);
            form.reset();
            void refreshShares();
          }}
        >
          <label>
            <span>Scope</span>
            <Select
              ariaLabel="Scope"
              name="scope"
              defaultValue="view"
              options={[
                { value: "view", label: "View only" },
                { value: "comment", label: "View and comment" },
              ]}
            />
          </label>
          <label>
            <span>Passcode (optional)</span>
            <input name="passcode" type="password" minLength={4} />
          </label>
          <label>
            <span>Expiry (optional)</span>
            <input name="expires_at" type="datetime-local" />
          </label>
          <button className="primary">Create secure link</button>
        </form>
        {createdUrl ? (
          <div className="created-share">
            <strong>New link</strong>
            <button onClick={() => navigator.clipboard.writeText(createdUrl)}>
              Copy link
            </button>
            <small>The token is never sent to analytics or logs.</small>
          </div>
        ) : null}
        <ul>
          {shares.data?.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{label(item.scope)}</strong>
                <small>
                  {item.has_passcode ? "Passcode protected" : "No passcode"} ·{" "}
                  {item.access_count} opens
                </small>
              </div>
              <button
                onClick={async () => {
                  if (confirm("Revoke this share link?")) {
                    await writingApi.revokeShareLink(documentId, item.id);
                    void refreshShares();
                  }
                }}
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
function ObjectView({ value }: { value: unknown }) {
  if (Array.isArray(value))
    return (
      <ul>
        {value.map((x, i) => (
          <li key={i}>
            <ObjectView value={x} />
          </li>
        ))}
      </ul>
    );
  if (value && typeof value === "object")
    return (
      <dl>
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k}>
            <dt>{label(k)}</dt>
            <dd>
              <ObjectView value={v} />
            </dd>
          </div>
        ))}
      </dl>
    );
  return <>{String(value ?? "Not provided")}</>;
}
