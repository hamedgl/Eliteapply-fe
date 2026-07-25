import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { writingApi } from "../../lib/api/phase3";
import { queryKeys } from "../../lib/api/queryKeys";
import { Select } from "../../components/ui/select";
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

const label = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const IMPORT_FILE_TYPES =
  ".pdf,.doc,.docx,.txt,.md,.markdown,application/pdf,application/msword," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "text/plain,text/markdown";
/** Matches the server's own limit, so an oversized file fails before the upload. */
const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

type Source = "blank" | "import";

/**
 * Rendered as a positioned div rather than a native `<dialog>`: `showModal()`
 * puts the dialog in the top layer, where the Select's portalled popover —
 * appended to `document.body` — paints underneath it and looks like a dropdown
 * that does not open.
 */
export function NewWritingDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [source, setSource] = useState<Source>("blank");
  const [error, setError] = useState("");
  const [documentType, setDocumentType] =
    useState<(typeof types)[number]>("motivation_letter");
  const [applicationType, setApplicationType] = useState("programme");
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [imported, setImported] = useState<{
    name: string;
    result: S["WritingImportResponse"];
  } | null>(null);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, [onClose]);

  const templates = useQuery({
    queryKey: ["writing-templates", documentType, applicationType],
    queryFn: () => writingApi.templates(documentType, applicationType),
  });
  const template = useQuery({
    queryKey: ["writing-template", templateId],
    queryFn: () => writingApi.template(templateId),
    enabled: Boolean(templateId),
  });

  const importFile = useMutation({
    mutationFn: (file: File) => writingApi.import(file, documentType),
    onSuccess: (result, file) => {
      if (!result.text.trim()) {
        setError(
          result.warnings?.[0] ??
            "No readable text could be extracted from that file.",
        );
        return;
      }
      setImported({ name: file.name, result });
      if (!title.trim())
        setTitle(result.title || file.name.replace(/\.[^.]+$/, ""));
    },
    onError: (cause) =>
      setError(
        cause instanceof Error ? cause.message : "That file could not be read.",
      ),
  });

  function selectFile(file: File) {
    setError("");
    if (file.size > MAX_IMPORT_BYTES) {
      setError("That file is larger than 10 MB. Export a smaller version.");
      return;
    }
    importFile.mutate(file);
  }

  const create = useMutation({
    mutationFn: (form: HTMLFormElement) => {
      const values = Object.fromEntries(new FormData(form));
      return writingApi.create({
        title: title.trim(),
        document_type: documentType,
        cv_mode:
          documentType === "academic_cv"
            ? (values.cv_mode as S["WritingDocumentCreate"]["cv_mode"])
            : null,
        prompt_text: String(values.prompt_text ?? "") || null,
        word_limit: values.word_limit ? Number(values.word_limit) : null,
        character_limit: values.character_limit
          ? Number(values.character_limit)
          : null,
        template_id: source === "blank" ? templateId || null : null,
        // Imported text is stored as plain text; the editor converts it to blocks.
        content: { text: source === "import" ? (imported?.result.text ?? "") : "" },
        target_requirements: {},
        evidence_map: {},
        theme: {},
      });
    },
    onSuccess: (created) => {
      qc.setQueryData(queryKeys.writingDocument(created.id), created);
      for (const includeArchived of [false, true])
        qc.setQueryData<S["WritingDocumentResponse"][]>(
          ["writing", { includeArchived }],
          (current) => [
            created,
            ...(current ?? []).filter((item) => item.id !== created.id),
          ],
        );
      navigate(`/app/writing/${created.id}`);
    },
    onError: (cause) =>
      setError(
        cause instanceof Error ? cause.message : "Could not create document.",
      ),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (source === "import" && !imported) {
      setError("Choose a file to import, or switch to Blank or template.");
      return;
    }
    create.mutate(event.currentTarget);
  }

  return (
    <div className="apps-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="apps-dialog writing-new-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-writing-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="apps-dialog-header">
          <div>
            <h2 id="new-writing-title">New writing document</h2>
            <p className="apps-dialog-subtext">
              Start from a template, a blank page, or a draft you already have.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>

        <nav className="detail-tabs" aria-label="Document source" role="tablist">
          {(
            [
              { id: "blank", label: "Blank or template", icon: FileText },
              { id: "import", label: "Import a file", icon: Upload },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`new-writing-tab-${tab.id}`}
              aria-selected={source === tab.id}
              aria-controls={`new-writing-panel-${tab.id}`}
              className={source === tab.id ? "active" : undefined}
              onClick={() => {
                setSource(tab.id);
                setError("");
              }}
            >
              <tab.icon aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </nav>

        <form className="settings-form" onSubmit={submit}>
          <label>
            <span>Title</span>
            <input
              name="title"
              required
              minLength={2}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Statement of Purpose — Oxford MSc"
            />
          </label>
          <div className="form-row-2">
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
          </div>
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

          {source === "blank" ? (
            <div
              className="new-writing-panel"
              role="tabpanel"
              id="new-writing-panel-blank"
              aria-labelledby="new-writing-tab-blank"
            >
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
            </div>
          ) : (
            <div
              className="new-writing-panel"
              role="tabpanel"
              id="new-writing-panel-import"
              aria-labelledby="new-writing-tab-import"
            >
              <div className="writing-import">
                <label className="writing-import-drop">
                  <Upload aria-hidden="true" />
                  <span>
                    <strong>
                      {importFile.isPending
                        ? "Reading your file…"
                        : imported
                          ? `Imported ${imported.name}`
                          : "Choose a file"}
                    </strong>
                    <small>
                      {imported
                        ? `${imported.result.word_count} words will open in the editor`
                        : "PDF, Word, plain text or Markdown · up to 10 MB"}
                    </small>
                  </span>
                  <input
                    type="file"
                    accept={IMPORT_FILE_TYPES}
                    disabled={importFile.isPending}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) selectFile(file);
                      event.target.value = "";
                    }}
                  />
                </label>
                {imported ? (
                  <button type="button" onClick={() => setImported(null)}>
                    Remove
                  </button>
                ) : null}
              </div>
              {imported?.result.truncated ? (
                <p className="apps-notice is-warning">
                  Only the first part of this file fits in one document — the
                  rest was left out.
                </p>
              ) : null}
              {imported?.result.warnings?.length ? (
                <ul className="writing-import-warnings">
                  {imported.result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}

          <label>
            <span>Prompt or question</span>
            <textarea
              name="prompt_text"
              rows={3}
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
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="dialog-actions">
            <button type="button" onClick={onClose} disabled={create.isPending}>
              Cancel
            </button>
            <button className="primary" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
