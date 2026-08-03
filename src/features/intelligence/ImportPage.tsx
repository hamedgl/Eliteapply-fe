import { useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Check, Link2, RefreshCw, Trash2, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { ConfirmationDialog } from "../../components/actions/ConfirmationDialog";
import { AiNotice } from "../../components/common/AiNotice";
import { CountryCombobox } from "../../components/filters/CountryCombobox";
import type { components } from "../../generated/api/schema";
import { applicationsApi, intelligenceApi } from "../../lib/api/phase2";
import { countryName } from "../../lib/countries";
import { queryKeys } from "../../lib/api/queryKeys";
import { WorkspacePageGuideButton } from "../../components/AppShell";
import { SectionSkeleton } from "../../components/page/PageSkeleton";

type Import = components["schemas"]["OpportunityImportResponse"];
const terminal = new Set([
  "completed",
  "complete",
  "ready",
  "extracted",
  "confirmed",
  "failed",
  "partial",
  "cancelled",
  "canceled",
]);
const display = (value: unknown) =>
  Array.isArray(value)
    ? value.map(String).join("\n")
    : typeof value === "string" || typeof value === "number"
    ? String(value)
    : value == null
      ? ""
      : JSON.stringify(value, null, 2);
const hasContent = (value: unknown): boolean =>
  value != null &&
  (typeof value === "string"
    ? Boolean(value.trim())
    : Array.isArray(value)
      ? value.some(hasContent)
      : typeof value === "object"
        ? Object.values(value).some(hasContent)
        : true);
const hasExtractedContent = (item: Import) =>
  Object.values(item.extracted_fields).some(hasContent);
const confidencePercent = (value: unknown) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.round(Math.max(0, Math.min(1, value)) * 100);
};
const eligibilityDetailFields = [
  "eligible_program_levels",
  "eligible_nationalities",
] as const;
const programLevelOptions = [
  "Foundation / pathway",
  "Undergraduate / Bachelor's",
  "Postgraduate / Master's",
  "MBA",
  "Doctoral / PhD",
  "Non-degree / exchange",
] as const;
const listValue = (value: unknown) =>
  Array.isArray(value)
    ? value.map(String).filter(Boolean)
    : typeof value === "string" && value.trim()
      ? value
          .split(/\r?\n|,/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
const fieldOrder = [
  "name",
  "institution",
  "source_scope",
  "institution_type",
  "location",
  "country",
  "degree_level",
  "field_of_study",
  "duration",
  "intake",
  "deadline",
  "tuition",
  "cost_of_living",
  "application_fee",
  "funding_amount",
  "scholarships",
  "eligible_program_levels",
  "eligible_nationalities",
  "eligibility_criteria",
  "required_documents",
  "essay_prompts",
  "reference_requirements",
  "study_features",
  "average_decision_time",
  "top_disciplines",
  "description",
  "trade_offs",
  "notes",
];
const multilineFields = new Set(["description", "trade_offs", "notes"]);
const fieldLabel = (key: string) =>
  key === "trade_offs"
    ? "Source-based trade-offs"
    : key === "source_scope"
      ? "Source scope"
      : key
          .replaceAll("_", " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase());
const correctionValue = (original: unknown, value: string) => {
  if (Array.isArray(original))
    return value
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean);
  if (original && typeof original === "object") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};
const sourceSummary = (item: Import) => {
  if (item.source_type === "pdf_text")
    return { title: "PDF import", detail: "Uploaded document" };
  if (!item.source_url)
    return {
      title: `${fieldLabel(item.source_type)} import`,
      detail: "Pasted source",
    };
  try {
    const url = new URL(item.source_url);
    const slug =
      url.pathname
        .split("/")
        .filter(Boolean)
        .at(-1)
        ?.replace(
          /-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i,
          "",
        )
        .replaceAll("-", " ") || "Web page";
    return {
      title: slug.replace(/\b\w/g, (letter) => letter.toUpperCase()),
      detail: url.hostname.replace(/^www\./, ""),
    };
  } catch {
    return { title: "Web page import", detail: item.source_url };
  }
};

export function ImportPage() {
  const [params] = useSearchParams();
  const applicationId = params.get("application_id");
  const qc = useQueryClient(),
    mutationId = useRef(crypto.randomUUID()),
    [sourceType, setSourceType] = useState<"text" | "url" | "pdf_text">("url"),
    [selected, setSelected] = useState<string | null>(null),
    [error, setError] = useState(""),
    [submitting, setSubmitting] = useState(false);
  const sourceInitialised = useRef(false);
  const linkedImportSelected = useRef(false);
  const linkedApplication = useQuery({
    queryKey: applicationId
      ? queryKeys.application(applicationId)
      : ["application", "none"],
    queryFn: ({ signal }) => applicationsApi.get(applicationId!, signal),
    enabled: Boolean(applicationId),
  });
  useEffect(() => {
    if (!linkedApplication.data || sourceInitialised.current) return;
    sourceInitialised.current = true;
    setSourceType(linkedApplication.data.source_url ? "url" : "text");
  }, [linkedApplication.data]);
  const history = useInfiniteQuery({
    queryKey: queryKeys.imports,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      intelligenceApi.imports(pageParam, signal),
    getNextPageParam: (page) => (page.has_more ? page.next_cursor : undefined),
  });
  const current = useQuery({
    queryKey: selected
      ? queryKeys.opportunityImport(selected)
      : ["opportunity-import", "none"],
    queryFn: ({ signal }) => intelligenceApi.getImport(selected!, signal),
    enabled: Boolean(selected),
    refetchInterval: (q) => {
      const status = q.state.data?.status.toLowerCase();
      return status && !terminal.has(status) && !document.hidden ? 2500 : false;
    },
  });
  const action = useMutation<
    Import | void,
    Error,
    { id: string; kind: "retry" | "cancel" | "delete" }
  >({
    mutationFn: async ({ id, kind }) =>
      kind === "retry"
        ? intelligenceApi.retryImport(id)
        : kind === "cancel"
          ? intelligenceApi.cancelImport(id)
          : intelligenceApi.deleteImport(id),
    onSuccess: (data) => {
      if (data)
        selected &&
          qc.setQueryData(queryKeys.opportunityImport(selected), data);
      else setSelected(null);
      void qc.invalidateQueries({ queryKey: queryKeys.imports });
    },
  });
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const d = new FormData(e.currentTarget);
    try {
      const id = mutationId.current;
      const file = d.get("source_file");
      if (sourceType === "pdf_text" && !(file instanceof File && file.size))
        throw new Error("Choose a PDF to import.");
      if (
        sourceType === "pdf_text" &&
        file instanceof File &&
        file.size > 10 * 1024 * 1024
      )
        throw new Error("PDF files must be 10 MB or smaller.");
      const result =
        sourceType === "pdf_text"
          ? await intelligenceApi.createPdfImport(
              file as File,
              id,
              applicationId,
            )
          : await intelligenceApi.createImport({
              mutation_id: id,
              application_id: applicationId,
              source_type: sourceType,
              source_url:
                sourceType === "url" ? String(d.get("source_url")) : null,
              raw_source_text:
                sourceType === "text"
                  ? String(d.get("raw_source_text"))
                  : null,
            });
      setSelected(result.id);
      mutationId.current = crypto.randomUUID();
      void qc.invalidateQueries({ queryKey: queryKeys.imports });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Import failed.");
    } finally {
      setSubmitting(false);
    }
  }
  const items = history.data?.pages.flatMap((page) => page.items) ?? [];
  useEffect(() => {
    if (!applicationId || linkedImportSelected.current) return;
    const linked = items.find((item) => item.application_id === applicationId);
    if (linked) {
      linkedImportSelected.current = true;
      setSelected(linked.id);
    }
  }, [applicationId, items]);
  return (
    <div className="page phase2-page import-page">
      <header className="page-heading">
        <div>
          {applicationId ? (
            <Link to={`/app/applications/${applicationId}/eligibility`}>
              ← Return to eligibility report
            </Link>
          ) : null}
          <span className="eyebrow">Opportunity intelligence</span>
          <h1>Import an opportunity</h1>
          <p>
            Bring in a web page or pasted source, then review each extracted
            field before it enters your application.
          </p>
        </div>
        <div className="apps-header-actions">
          <WorkspacePageGuideButton />
        </div>
      </header>
      <div className="import-layout">
        <section className="import-create">
          <h2>New import</h2>
          <p>
            Add a public programme page, upload a PDF or paste its details. AI
            will extract the facts for you to verify.
          </p>
          {linkedApplication.data ? (
            <div className="import-progress import-source-context">
              <Check aria-hidden="true" />
              <div>
                <strong>
                  Rechecking criteria for {linkedApplication.data.title}
                </strong>
                <p>
                  The saved official source is prefilled below. Confirmed
                  criteria will update this application&apos;s eligibility
                  report.
                </p>
              </div>
            </div>
          ) : null}
          <form className="settings-form" onSubmit={submit}>
            <label>
              <span>Source type</span>
              <select
                name="source_type"
                required
                value={sourceType}
                onChange={(e) =>
                  setSourceType(e.target.value as typeof sourceType)
                }
              >
                <option value="url">Web page URL</option>
                <option value="text">Pasted text</option>
                <option value="pdf_text">PDF document</option>
              </select>
            </label>
            {sourceType === "url" ? (
              <label>
                <span>Source URL</span>
                <input
                  key={linkedApplication.data?.source_url ?? "new-source"}
                  name="source_url"
                  type="url"
                  required
                  placeholder="https://…"
                  defaultValue={linkedApplication.data?.source_url ?? ""}
                />
                <small>
                  Use the exact public page that contains deadlines,
                  requirements and fees.
                </small>
              </label>
            ) : sourceType === "pdf_text" ? (
              <label>
                <span>PDF file</span>
                <input
                  className="import-pdf-input"
                  name="source_file"
                  type="file"
                  accept=".pdf,application/pdf"
                  required
                />
                <small>
                  Text-based PDF · up to 10 MB. The file is checked and read
                  securely on the server.
                </small>
              </label>
            ) : (
              <label>
                <span>Source text</span>
                <textarea
                  key={linkedApplication.data?.notes ?? "new-source-text"}
                  name="raw_source_text"
                  minLength={20}
                  maxLength={200000}
                  required
                  rows={8}
                  defaultValue={linkedApplication.data?.notes ?? ""}
                  placeholder="Paste the programme description, requirements, deadlines and fees…"
                />
              </label>
            )}
            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? (
                <RefreshCw className="spin" aria-hidden="true" />
              ) : (
                <Link2 aria-hidden="true" />
              )}
              {submitting ? "Starting…" : "Start extraction"}
            </button>
            {error ? (
              <p role="alert" className="form-error">
                {error}
              </p>
            ) : null}
          </form>
        </section>
        <section className="import-history">
          <header>
            <div>
              <h2>Import history</h2>
              <p>Previous extraction attempts and their status.</p>
            </div>
            <button
              type="button"
              className="icon-text-button"
              disabled={history.isFetching}
              onClick={() => history.refetch()}
            >
              <RefreshCw
                className={history.isFetching ? "spin" : ""}
                aria-hidden="true"
              />
              Refresh
            </button>
          </header>
          {history.isPending ? (
            <SectionSkeleton label="Loading import history" rows={4} />
          ) : items.length ? (
            <ul>
              {items.map((item) => (
                <li
                  className={selected === item.id ? "selected" : ""}
                  key={item.id}
                >
                  <button
                    type="button"
                    title={item.source_url ?? undefined}
                    onClick={() => setSelected(item.id)}
                  >
                    <span className="import-source">
                      <strong>{sourceSummary(item).title}</strong>
                      <small>{sourceSummary(item).detail}</small>
                    </span>
                    <span
                      className={`status-pill status-${
                        item.status === "extracted" &&
                        !hasExtractedContent(item)
                          ? "failed"
                          : item.status.toLowerCase()
                      }`}
                    >
                      {item.status === "extracted" &&
                      !hasExtractedContent(item)
                        ? "Needs retry"
                        : item.status}
                    </span>
                    <time dateTime={item.retrieved_at}>
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(item.retrieved_at))}
                    </time>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No imports yet.</p>
          )}
          {history.hasNextPage ? (
            <button onClick={() => history.fetchNextPage()}>
              Load earlier imports
            </button>
          ) : null}
        </section>
      </div>
      {current.isPending && selected ? (
        <SectionSkeleton label="Loading extracted opportunity fields" variant="fields" rows={8} />
      ) : current.data ? (
        <ImportReview
          key={current.data.id}
          item={current.data}
          busy={action.isPending}
          onAction={(kind) => action.mutate({ id: current.data.id, kind })}
          onConfirmed={(item) => {
            qc.setQueryData(queryKeys.opportunityImport(item.id), item);
            void qc.invalidateQueries({ queryKey: queryKeys.imports });
            if (item.application_id)
              void Promise.all([
                qc.invalidateQueries({
                  queryKey: queryKeys.application(item.application_id),
                }),
                qc.invalidateQueries({
                  queryKey: queryKeys.workspace(item.application_id),
                }),
                qc.invalidateQueries({
                  queryKey: queryKeys.eligibility(item.application_id),
                }),
                qc.invalidateQueries({
                  queryKey: queryKeys.eligibilityHistory(item.application_id),
                }),
                qc.invalidateQueries({
                  queryKey: queryKeys.readiness(item.application_id),
                }),
                qc.invalidateQueries({ queryKey: queryKeys.applications }),
              ]);
          }}
        />
      ) : null}
    </div>
  );
}

function ImportReview({
  item,
  busy,
  onAction,
  onConfirmed,
}: {
  item: Import;
  busy: boolean;
  onAction: (kind: "retry" | "cancel" | "delete") => void;
  onConfirmed: (item: Import) => void;
}) {
  const [corrections, setCorrections] = useState<Record<string, unknown>>(
      () => ({ ...item.user_corrections }),
    ),
    [confirming, setConfirming] = useState(false),
    [confirmError, setConfirmError] = useState(""),
    [showDelete, setShowDelete] = useState(false),
    fields = useMemo(
      () =>
        Object.keys({ ...item.extracted_fields, ...corrections })
          .filter(
            (key) =>
              hasContent(item.extracted_fields[key]) ||
              hasContent(corrections[key]),
          )
          .sort((left, right) => {
            const leftIndex = fieldOrder.indexOf(left);
            const rightIndex = fieldOrder.indexOf(right);
            return (
              (leftIndex < 0 ? fieldOrder.length : leftIndex) -
              (rightIndex < 0 ? fieldOrder.length : rightIndex)
            );
          }),
      [corrections, item.extracted_fields],
    ),
    status = item.status.toLowerCase(),
    active = !terminal.has(status),
    empty = !hasExtractedContent(item),
    canRetry = status === "failed" || status === "extracted",
    lowConfidence = fields.filter((key) => {
      if (!hasContent(item.extracted_fields[key])) return false;
      const score = confidencePercent(item.field_confidence[key]);
      return score == null || score < 60;
    }).length,
    missingEligibilityDetails = eligibilityDetailFields.filter(
      (key) => !hasContent(item.extracted_fields[key]),
    ),
    eligibilityDetailsChanged = eligibilityDetailFields.some(
      (key) =>
        display(corrections[key]) !==
        display(item.user_corrections[key] ?? item.extracted_fields[key]),
    );
  const setEligibilityDetail = (
    key: (typeof eligibilityDetailFields)[number],
    value: string[],
  ) =>
    setCorrections((current) => ({
      ...current,
      [key]: value,
    }));
  const selectedProgramLevels = listValue(
    corrections.eligible_program_levels ??
      item.extracted_fields.eligible_program_levels,
  );
  const selectedNationalities = listValue(
    corrections.eligible_nationalities ??
      item.extracted_fields.eligible_nationalities,
  );
  useEffect(() => {
    if (
      window.location.hash !== "#missing-eligibility-details"
    )
      return;
    const panel = document.getElementById("missing-eligibility-details");
    panel?.focus({ preventScroll: true });
    panel?.scrollIntoView({ block: "start" });
  }, [missingEligibilityDetails.length]);
  async function confirmFields() {
    setConfirming(true);
    setConfirmError("");
    try {
      const result = await intelligenceApi.confirmImport(item.id, {
        confirmed_fields: fields,
        corrections,
      });
      onConfirmed(result);
    } catch (caught) {
      setConfirmError(
        caught instanceof Error ? caught.message : "Could not confirm fields.",
      );
    } finally {
      setConfirming(false);
    }
  }
  return (
    <section className="import-review">
      <header>
        <div>
          <span
            className={`status-pill status-${empty && status === "extracted" ? "failed" : status}`}
          >
            {empty && status === "extracted" ? "Needs retry" : item.status}
          </span>
          <h2>Review extracted fields</h2>
          <p>
            Check the AI-extracted facts against the source before adding them
            to your application.
          </p>
          <AiNotice compact>
            Fields and confidence come from an AI model reading the source, not
            from the provider. Nothing is added until you confirm.
          </AiNotice>
        </div>
        <div className="import-review-actions">
          {active ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction("cancel")}
            >
              <X aria-hidden="true" />
              Cancel
            </button>
          ) : null}
          {canRetry ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction("retry")}
            >
              <RefreshCw aria-hidden="true" />
              Run again
            </button>
          ) : null}
          <button
            type="button"
            className="danger-link"
            disabled={busy || active}
            onClick={() => setShowDelete(true)}
          >
            <Trash2 aria-hidden="true" />
            Delete
          </button>
        </div>
      </header>
      {active ? (
        <div className="import-progress" role="status">
          <RefreshCw className="spin" aria-hidden="true" />
          <div>
            <strong>Extraction in progress</strong>
            <p>
              The page is being read and analysed. This view updates
              automatically.
            </p>
          </div>
        </div>
      ) : null}
      {status === "confirmed" && item.application_id ? (
        <div className="import-progress import-complete" role="status">
          <Check aria-hidden="true" />
          <div>
            <strong>Added to application</strong>
            <p>
              Confirmed details, notes and document requirements are now
              available in the application workspace.
            </p>
            <Link to={`/app/applications/${item.application_id}`}>
              View application
            </Link>
          </div>
        </div>
      ) : null}
      {status === "confirmed" && !item.application_id ? (
        <div className="import-progress" role="status">
          <Link2 aria-hidden="true" />
          <div>
            <strong>Confirmed, but not added to applications</strong>
            <p>
              This import was not linked to an existing application. Create
              one now using the confirmed details.
            </p>
            <button
              type="button"
              className="primary"
              disabled={confirming}
              onClick={confirmFields}
            >
              {confirming ? "Adding…" : "Add to applications"}
            </button>
          </div>
        </div>
      ) : null}
      {!active && fields.length ? (
        <div className="import-review-summary" aria-label="Extraction summary">
          <div>
            <strong>{fields.length}</strong>
            <span>Fields found</span>
          </div>
          <div>
            <strong>{lowConfidence}</strong>
            <span>Need a closer look</span>
          </div>
          <div>
            <strong>{Object.keys(corrections).length}</strong>
            <span>User edits</span>
          </div>
        </div>
      ) : null}
      {missingEligibilityDetails.length &&
      (status === "extracted" || status === "confirmed") ? (
        <section
          id="missing-eligibility-details"
          tabIndex={-1}
          className="import-missing-details"
          aria-labelledby="missing-eligibility-title"
        >
          <header>
            <div>
              <span className="eyebrow">Optional provider details</span>
              <h3 id="missing-eligibility-title">
                Help us complete eligibility
              </h3>
              <p>
                These restrictions were not found in the source. Add only what
                the provider explicitly states, or leave them blank.
              </p>
            </div>
          </header>
          <div className="import-eligibility-fields">
            {missingEligibilityDetails.includes(
              "eligible_program_levels",
            ) ? (
              <fieldset>
                <legend>Eligible programme levels</legend>
                <p>Select every level this opportunity accepts.</p>
                <div className="import-choice-grid">
                  {programLevelOptions.map((level) => (
                    <label key={level}>
                      <input
                        type="checkbox"
                        checked={selectedProgramLevels.includes(level)}
                        onChange={(event) =>
                          setEligibilityDetail(
                            "eligible_program_levels",
                            event.target.checked
                              ? [...selectedProgramLevels, level]
                              : selectedProgramLevels.filter(
                                  (item) => item !== level,
                                ),
                          )
                        }
                      />
                      <span>{level}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
            {missingEligibilityDetails.includes(
              "eligible_nationalities",
            ) ? (
              <fieldset>
                <legend>Eligible nationalities</legend>
                <p>
                  Mark it open to everyone, or add the nationalities named by
                  the provider.
                </p>
                <label className="import-all-nationalities">
                  <input
                    type="checkbox"
                    checked={selectedNationalities.includes(
                      "All nationalities",
                    )}
                    onChange={(event) =>
                      setEligibilityDetail(
                        "eligible_nationalities",
                        event.target.checked ? ["All nationalities"] : [],
                      )
                    }
                  />
                  <span>Open to all nationalities</span>
                </label>
                {!selectedNationalities.includes("All nationalities") ? (
                  <>
                    <CountryCombobox
                      label="Add an eligible nationality"
                      value=""
                      onChange={(code) => {
                        const name = countryName(code);
                        if (name && !selectedNationalities.includes(name))
                          setEligibilityDetail("eligible_nationalities", [
                            ...selectedNationalities,
                            name,
                          ]);
                      }}
                    />
                    {selectedNationalities.length ? (
                      <ul className="import-answer-chips">
                        {selectedNationalities.map((nationality) => (
                          <li className="apps-chip" key={nationality}>
                            {nationality}
                            <button
                              type="button"
                              aria-label={`Remove ${nationality}`}
                              onClick={() =>
                                setEligibilityDetail(
                                  "eligible_nationalities",
                                  selectedNationalities.filter(
                                    (item) => item !== nationality,
                                  ),
                                )
                              }
                            >
                              <X aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </>
                ) : null}
              </fieldset>
            ) : null}
          </div>
        </section>
      ) : null}
      {fields.length ? (
        <div
          className="extraction-fields"
          id={
            missingEligibilityDetails.length
              ? undefined
              : "missing-eligibility-details"
          }
          tabIndex={missingEligibilityDetails.length ? undefined : -1}
        >
          {fields.map((key) => {
            const value =
              key in corrections
                ? corrections[key]
                : item.extracted_fields[key];
            const confidence = item.field_confidence[key];
            const score = confidencePercent(confidence);
            const original = item.extracted_fields[key];
            const isStructured =
              Array.isArray(original) ||
              (original != null && typeof original === "object");
            const useTextarea = isStructured || multilineFields.has(key);
            return (
              <label
                className={useTextarea ? "extraction-field-wide" : ""}
                key={key}
              >
                <span className="extraction-field-heading">
                  <strong>{fieldLabel(key)}</strong>
                  <small
                    className={`confidence-badge confidence-${
                      score == null ? "unknown" : score >= 80 ? "high" : score >= 60 ? "medium" : "low"
                    }`}
                  >
                    {score == null ? "Not scored" : `${score}% confidence`}
                  </small>
                </span>
                {useTextarea ? (
                  <textarea
                    rows={key === "description" ? 7 : 5}
                    value={display(value)}
                    placeholder="No value extracted"
                    onChange={(e) =>
                      setCorrections((old) => ({
                        ...old,
                        [key]: correctionValue(original, e.target.value),
                      }))
                    }
                  />
                ) : (
                  <input
                    value={display(value)}
                    placeholder="No value extracted"
                    onChange={(e) =>
                      setCorrections((old) => ({
                        ...old,
                        [key]: e.target.value,
                      }))
                    }
                  />
                )}
                {Array.isArray(original) ? (
                  <small>Use one item per line.</small>
                ) : null}
                {key === "trade_offs" ? (
                  <small>
                    AI can extend these comparison points, but every item must
                    stay grounded in source facts. Review before relying on it.
                  </small>
                ) : null}
              </label>
            );
          })}
        </div>
      ) : !active ? (
        <div className="import-empty-result">
          <strong>No usable details were extracted</strong>
          <p>
            The page may hide its content or require a login. Run extraction
            again, or paste the programme details as source text.
          </p>
        </div>
      ) : null}
      {confirmError ? (
        <p className="form-error" role="alert">
          {confirmError}
        </p>
      ) : null}
      {fields.length && status === "extracted" ? (
        <footer className="import-review-footer">
          <p>
            Your changes are saved as corrections when you confirm this
            import.
          </p>
          <button
            type="button"
            className="primary"
            disabled={confirming}
            onClick={confirmFields}
          >
            <Check aria-hidden="true" />
            {confirming ? "Confirming…" : `Confirm ${fields.length} fields`}
          </button>
        </footer>
      ) : null}
      {status === "confirmed" && eligibilityDetailsChanged ? (
        <footer className="import-review-footer">
          <p>
            Save these provider details and the eligibility report will
            recalculate automatically.
          </p>
          <button
            type="button"
            className="primary"
            disabled={confirming}
            onClick={confirmFields}
          >
            <Check aria-hidden="true" />
            {confirming ? "Saving…" : "Save eligibility details"}
          </button>
        </footer>
      ) : null}
      {showDelete ? (
        <ConfirmationDialog
          title="Delete this import?"
          confirmLabel="Delete import"
          pendingLabel="Deleting…"
          pending={busy}
          onCancel={() => setShowDelete(false)}
          onConfirm={() => onAction("delete")}
        >
          <p>
            This removes the extracted data and review history. It cannot be
            undone.
          </p>
        </ConfirmationDialog>
      ) : null}
    </section>
  );
}
