import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, RefreshCw, Sparkles, Upload } from "lucide-react";
import { Select } from "../../../components/ui/select";
import { EntityCombobox } from "../../../components/filters/EntityCombobox";
import { applicationsApi, documentsApi } from "../../../lib/api/phase2";
import { referencesApi } from "../../../lib/api/phase3";
import { newMutationId } from "../../../lib/api/mutations";
import { queryKeys } from "../../../lib/api/queryKeys";
import { track } from "../../../lib/analytics/track";
import { UploadDialog } from "../../documents/components/UploadDialog";
import { referenceModes, methodLabel, referenceTypes, referenceTypeLabel } from "../model";

const REFEREE_ROLES = ["professor", "supervisor", "teacher", "employer", "mentor"] as const;
const STEPS = ["Method", "Referee details", "Request details", "Review & send"] as const;

export function RequestReferenceFlow({ onCreated }: { onCreated: (referenceId: string) => void }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const mutationId = useRef(newMutationId());

  const [mode, setMode] = useState<(typeof referenceModes)[number]>("referee_direct");
  const [refereeName, setRefereeName] = useState("");
  const [refereeEmail, setRefereeEmail] = useState("");
  const [refereeRole, setRefereeRole] = useState<(typeof REFEREE_ROLES)[number]>("professor");
  const [institution, setInstitution] = useState("");
  const [department, setDepartment] = useState("");

  const [applicationId, setApplicationId] = useState("");
  const [applicationName, setApplicationName] = useState("");
  const [referenceType, setReferenceType] = useState<(typeof referenceTypes)[number]>("academic");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [relationship, setRelationship] = useState("");
  const [context, setContext] = useState("");
  const [studentDraft, setStudentDraft] = useState("");
  const [polishSuggestion, setPolishSuggestion] = useState("");
  const [existingDocumentId, setExistingDocumentId] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [destinations, setDestinations] = useState("");
  const studentDraftLength = studentDraft.trim().length;

  const documents = useQuery({
    queryKey: queryKeys.documents,
    queryFn: documentsApi.list,
    enabled: mode === "existing_upload",
  });
  const cleanDocuments = (documents.data ?? []).filter((document) => document.malware_status === "clean");
  const selectedDocument = cleanDocuments.find((document) => document.id === existingDocumentId);

  const create = useMutation({
    mutationFn: () =>
      referencesApi.create({
        mutation_id: mutationId.current,
        application_id: applicationId,
        mode,
        confidential: false,
        confidentiality_acknowledged: false,
        referee_name: refereeName,
        referee_email: refereeEmail,
        referee_role: refereeRole,
        institution: institution || null,
        department: department || null,
        reference_type: referenceType,
        expires_in_days: expiresInDays ? Number(expiresInDays) : undefined,
        relationship_context: { summary: relationship },
        student_context: { summary: context },
        student_draft: mode === "student_draft" ? studentDraft || null : null,
        existing_document_id: mode === "existing_upload" ? existingDocumentId : null,
        destinations: destinations
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean)
          .map((name) => ({ name })),
      }),
    onSuccess: (created) => {
      mutationId.current = newMutationId();
      void qc.invalidateQueries({ queryKey: queryKeys.references() });
      void track("first_referee_invited").catch(() => undefined);
      onCreated(created.id);
    },
    onError: (caught) => setError(caught instanceof Error ? caught.message : "Could not create the invitation."),
  });

  const polish = useMutation({
    mutationFn: () => referencesApi.polishDraft({ content: studentDraft.trim() }),
    onSuccess: ({ polished_content }) => {
      setPolishSuggestion(polished_content);
    },
    onError: (caught) =>
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not polish the draft. Your original is unchanged.",
      ),
  });

  const step1Valid = Boolean(mode);
  const step2Valid = refereeName.trim().length >= 2 && /\S+@\S+\.\S+/.test(refereeEmail);
  const expiresInDaysValid = !expiresInDays || (Number(expiresInDays) >= 3 && Number(expiresInDays) <= 60);
  const step3Valid =
    Boolean(applicationId) &&
    (mode !== "student_draft" || studentDraftLength >= 50) &&
    (mode !== "existing_upload" || Boolean(existingDocumentId)) &&
    expiresInDaysValid;
  const canAdvance = [step1Valid, step2Valid, step3Valid, true][step];

  const visibilityPreview =
    mode === "existing_upload"
      ? "The student can already see the uploaded document — it's their own file."
      : "The student will be able to review the final reference content once submitted.";

  return (
    <div className="reference-request-flow">
      <ol className="reference-request-steps" aria-label="Request steps">
        {STEPS.map((label, index) => (
          <li key={label} className={index === step ? "is-active" : index < step ? "is-done" : ""}>
            {index < step ? <Check aria-hidden="true" /> : <span>{index + 1}</span>}
            {label}
          </li>
        ))}
      </ol>

      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : null}

      {step === 0 ? (
        <section className="reference-request-step">
          <h3 className="reference-required-label">How should this reference be written?</h3>
          <div className="reference-method-options">
            {referenceModes.map((option) => (
              <label key={option} className={`reference-method-option${mode === option ? " is-selected" : ""}`}>
                <input
                  type="radio"
                  name="mode"
                  checked={mode === option}
                  onChange={() => setMode(option)}
                  required
                />
                <span>{methodLabel(option)}</span>
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="reference-request-step">
          <h3>Referee details</h3>
          <div className="form-grid">
            <label>
              <span className="reference-required-label">Full name</span>
              <input value={refereeName} onChange={(event) => setRefereeName(event.target.value)} required />
            </label>
            <label>
              <span className="reference-required-label">Email</span>
              <input
                type="email"
                value={refereeEmail}
                onChange={(event) => setRefereeEmail(event.target.value)}
                required
              />
            </label>
            <label>
              <span className="reference-required-label">Role</span>
              <Select
                ariaLabel="Referee role"
                required
                value={refereeRole}
                onChange={(val: any) =>
                  setRefereeRole((typeof val === "string" ? val : val?.target?.value) as (typeof REFEREE_ROLES)[number])
                }
                options={REFEREE_ROLES.map((role) => ({ value: role, label: role }))}
              />
            </label>
            <label>
              <span>
                Institution <span className="muted">(optional)</span>
              </span>
              <input value={institution} onChange={(event) => setInstitution(event.target.value)} />
            </label>
            <label className="wide">
              <span>
                Department <span className="muted">(optional)</span>
              </span>
              <input value={department} onChange={(event) => setDepartment(event.target.value)} />
            </label>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="reference-request-step">
          <h3>Request details</h3>
          <div className="reference-request-application">
            <EntityCombobox
              queryKey={queryKeys.applications}
              search={async (search) =>
                (await applicationsApi.list({ search, limit: 10 })).items.map((app) => ({ id: app.id, name: app.title }))
              }
              label="Application"
              placeholder="Search your applications…"
              required
              value={applicationId}
              valueLabel={applicationName}
              onChange={(id, name) => {
                setApplicationId(id);
                setApplicationName(name);
              }}
            />
          </div>
          <div className="form-grid reference-request-grid">
            <label>
              <span className="reference-required-label">Reference type</span>
              <Select
                ariaLabel="Reference type"
                required
                value={referenceType}
                onChange={(val: any) =>
                  setReferenceType((typeof val === "string" ? val : val?.target?.value) as (typeof referenceTypes)[number])
                }
                options={referenceTypes.map((type) => ({ value: type, label: referenceTypeLabel(type) }))}
              />
            </label>
            <label>
              <span>Due in</span>
              <input
                type="number"
                min={3}
                max={60}
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(event.target.value)}
                placeholder="14"
                aria-describedby="reference-due-help"
              />
              <span id="reference-due-help" className="field-help">
                Optional · 3–60 days · defaults to 14
              </span>
              {!expiresInDaysValid ? <span className="form-error">Must be between 3 and 60 days.</span> : null}
            </label>
          </div>
          <label>
            <span>
              Relationship to the referee <span className="muted">(optional)</span>
            </span>
            <input value={relationship} onChange={(event) => setRelationship(event.target.value)} />
          </label>
          <label>
            <span>
              Guidance for the referee <span className="muted">(optional)</span>
            </span>
            <textarea value={context} onChange={(event) => setContext(event.target.value)} rows={3} />
          </label>
          {mode === "student_draft" ? (
            <div className="reference-draft-field">
              <div className="reference-draft-heading">
                <label
                  className="reference-required-label"
                  htmlFor="student-reference-draft"
                >
                  Student draft
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    polish.mutate();
                  }}
                  disabled={
                    studentDraftLength < 50 ||
                    !applicationId ||
                    polish.isPending
                  }
                  aria-describedby="student-reference-polish-help"
                >
                  {polish.isPending ? (
                    <Loader2 aria-hidden="true" className="apps-spin" />
                  ) : (
                    <Sparkles aria-hidden="true" />
                  )}
                  {polish.isPending ? "Polishing…" : "Polish with AI"}
                </button>
              </div>
              <textarea
                id="student-reference-draft"
                value={studentDraft}
                onChange={(event) => {
                  setStudentDraft(event.target.value);
                  setPolishSuggestion("");
                }}
                minLength={50}
                required
                rows={6}
                disabled={polish.isPending}
                aria-describedby="student-reference-draft-help student-reference-draft-count"
                aria-invalid={studentDraftLength > 0 && studentDraftLength < 50}
              />
              <div className="reference-field-meta">
                <span id="student-reference-draft-help">
                  Write at least 50 characters so your referee has enough context
                  to review.
                </span>
                <strong
                  id="student-reference-draft-count"
                  className={
                    studentDraftLength > 0 && studentDraftLength < 50
                      ? "is-short"
                      : ""
                  }
                  aria-live="polite"
                >
                  {studentDraftLength} / 50 minimum
                </strong>
              </div>
              <p id="student-reference-polish-help" className="field-help">
                AI polish improves clarity and grammar without intentionally
                adding facts. Nothing changes until you use the suggestion.
              </p>
              {polishSuggestion ? (
                <div className="reference-polish-suggestion" aria-live="polite">
                  <div>
                    <strong>Polished suggestion</strong>
                    <span>Review it carefully for factual accuracy.</span>
                  </div>
                  <textarea
                    value={polishSuggestion}
                    readOnly
                    rows={6}
                    aria-label="Polished reference suggestion"
                  />
                  <div>
                    <button type="button" onClick={() => setPolishSuggestion("")}>
                      Keep my draft
                    </button>
                    <button
                      type="button"
                      className="primary"
                      onClick={() => {
                        setStudentDraft(polishSuggestion);
                        setPolishSuggestion("");
                      }}
                    >
                      Use suggestion
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          {mode === "existing_upload" ? (
            <div className="reference-document-field">
              <div className="reference-document-heading">
                <span className="reference-required-label">Existing document</span>
                <div className="reference-document-actions">
                  <button type="button" onClick={() => setUploadOpen(true)}>
                    <Upload aria-hidden="true" />
                    Upload new
                  </button>
                  <button
                    type="button"
                    onClick={() => void documents.refetch()}
                    disabled={documents.isFetching}
                  >
                    <RefreshCw
                      aria-hidden="true"
                      className={documents.isFetching ? "apps-spin" : ""}
                    />
                    {documents.isFetching ? "Refreshing…" : "Refresh"}
                  </button>
                </div>
              </div>
              <Select
                ariaLabel="Existing document"
                required
                value={existingDocumentId}
                placeholder="Select a document"
                onChange={(val: any) => setExistingDocumentId(typeof val === "string" ? val : (val?.target?.value ?? ""))}
                options={cleanDocuments.map((document) => ({ value: document.id, label: document.display_name }))}
              />
              <span className="field-help" role="status" aria-live="polite">
                {documents.isPending
                  ? "Loading documents…"
                  : documents.isError
                    ? "Documents could not be loaded. Refresh to try again."
                    : cleanDocuments.length
                      ? `${cleanDocuments.length} security-cleared document${cleanDocuments.length === 1 ? "" : "s"} available.`
                      : documents.data?.length
                        ? "Uploaded documents appear here after security scanning finishes."
                        : "No documents yet. Upload one to continue."}
              </span>
            </div>
          ) : null}
          <label>
            <span>
              Destinations{" "}
              <span className="muted">(one per line, optional)</span>
            </span>
            <textarea
              value={destinations}
              onChange={(event) => setDestinations(event.target.value)}
              placeholder={"Oxford MSc Computer Science\nRhodes Scholarship"}
              rows={2}
            />
          </label>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="reference-request-step">
          <h3>Review and send</h3>
          <dl className="reference-detail-facts">
            <div>
              <dt>Referee</dt>
              <dd>
                {refereeName} ({refereeRole})
              </dd>
            </div>
            <div>
              <dt>Application</dt>
              <dd>{applicationName || "Not selected"}</dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>{methodLabel(mode)}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{referenceTypeLabel(referenceType)}</dd>
            </div>
            <div>
              <dt>Due</dt>
              <dd>{expiresInDays ? `${expiresInDays} days from now` : "14 days from now (default)"}</dd>
            </div>
            {mode === "existing_upload" ? (
              <div>
                <dt>Document to verify</dt>
                <dd>{selectedDocument?.display_name ?? "Not selected"}</dd>
              </div>
            ) : null}
            {relationship.trim() ? (
              <div>
                <dt>Relationship</dt>
                <dd>{relationship.trim()}</dd>
              </div>
            ) : null}
            {context.trim() ? (
              <div>
                <dt>Guidance</dt>
                <dd>{context.trim()}</dd>
              </div>
            ) : null}
            {mode === "student_draft" ? (
              <div className="reference-review-draft">
                <dt>Student draft</dt>
                <dd>{studentDraft.trim()}</dd>
              </div>
            ) : null}
          </dl>
          <p className="apps-dialog-subtext">{visibilityPreview}</p>
          <p className="apps-dialog-subtext">
            EliteApply will email {refereeName || "the referee"} securely — the invitation link itself is never
            exposed to your browser. There is no draft-and-save-for-later step; sending creates the request
            immediately.
          </p>
        </section>
      ) : null}

      <div className="reference-request-nav">
        <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" className="primary" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
            Continue
          </button>
        ) : (
          <button type="button" className="primary" onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? "Sending…" : "Send request"}
          </button>
        )}
      </div>
      {uploadOpen ? (
        <UploadDialog
          onClose={() => {
            setUploadOpen(false);
            void documents.refetch();
          }}
        />
      ) : null}
    </div>
  );
}
