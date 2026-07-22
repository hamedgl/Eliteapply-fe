import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Select } from "../../../components/ui/select";
import { EntityCombobox } from "../../../components/filters/EntityCombobox";
import { applicationsApi, documentsApi } from "../../../lib/api/phase2";
import { referencesApi } from "../../../lib/api/phase3";
import { newMutationId } from "../../../lib/api/mutations";
import { queryKeys } from "../../../lib/api/queryKeys";
import { track } from "../../../lib/analytics/track";
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
  const [existingDocumentId, setExistingDocumentId] = useState("");
  const [destinations, setDestinations] = useState("");
  const [confidential, setConfidential] = useState(false);
  const [confidentialityAcknowledged, setConfidentialityAcknowledged] = useState(false);

  const documents = useQuery({
    queryKey: queryKeys.documents,
    queryFn: documentsApi.list,
    enabled: mode === "existing_upload",
  });

  const create = useMutation({
    mutationFn: () =>
      referencesApi.create({
        mutation_id: mutationId.current,
        application_id: applicationId,
        mode,
        confidential,
        confidentiality_acknowledged: confidentialityAcknowledged,
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
          .map((destination) => ({ destination })),
      }),
    onSuccess: (created) => {
      mutationId.current = newMutationId();
      void qc.invalidateQueries({ queryKey: queryKeys.references() });
      void track("first_referee_invited").catch(() => undefined);
      onCreated(created.id);
    },
    onError: (caught) => setError(caught instanceof Error ? caught.message : "Could not create the invitation."),
  });

  const step1Valid = Boolean(mode);
  const step2Valid = refereeName.trim().length >= 2 && /\S+@\S+\.\S+/.test(refereeEmail);
  const expiresInDaysValid = !expiresInDays || (Number(expiresInDays) >= 3 && Number(expiresInDays) <= 60);
  const step3Valid =
    Boolean(applicationId) &&
    (mode !== "student_draft" || studentDraft.trim().length >= 50) &&
    (mode !== "existing_upload" || Boolean(existingDocumentId)) &&
    (!confidential || confidentialityAcknowledged) &&
    expiresInDaysValid;
  const canAdvance = [step1Valid, step2Valid, step3Valid, true][step];

  const visibilityPreview = confidential
    ? "The student will see request status and timeline, but not the final reference content."
    : mode === "existing_upload"
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
          <h3>How should this reference be written?</h3>
          <div className="reference-method-options">
            {referenceModes.map((option) => (
              <label key={option} className={`reference-method-option${mode === option ? " is-selected" : ""}`}>
                <input type="radio" name="mode" checked={mode === option} onChange={() => setMode(option)} />
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
              Full name
              <input value={refereeName} onChange={(event) => setRefereeName(event.target.value)} required />
            </label>
            <label>
              Email
              <input
                type="email"
                value={refereeEmail}
                onChange={(event) => setRefereeEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Role
              <Select
                value={refereeRole}
                onChange={(val: any) =>
                  setRefereeRole((typeof val === "string" ? val : val?.target?.value) as (typeof REFEREE_ROLES)[number])
                }
                options={REFEREE_ROLES.map((role) => ({ value: role, label: role }))}
              />
            </label>
            <label>
              Institution
              <input value={institution} onChange={(event) => setInstitution(event.target.value)} />
            </label>
            <label className="wide">
              Department
              <input value={department} onChange={(event) => setDepartment(event.target.value)} />
            </label>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="reference-request-step">
          <h3>Request details</h3>
          <label>
            Application
            <EntityCombobox
              queryKey={queryKeys.applications}
              search={async (search) =>
                (await applicationsApi.list({ search, limit: 10 })).items.map((app) => ({ id: app.id, name: app.title }))
              }
              label="Application"
              placeholder="Search your applications…"
              value={applicationId}
              valueLabel={applicationName}
              onChange={(id, name) => {
                setApplicationId(id);
                setApplicationName(name);
              }}
            />
          </label>
          <div className="form-grid">
            <label>
              Reference type
              <Select
                value={referenceType}
                onChange={(val: any) =>
                  setReferenceType((typeof val === "string" ? val : val?.target?.value) as (typeof referenceTypes)[number])
                }
                options={referenceTypes.map((type) => ({ value: type, label: referenceTypeLabel(type) }))}
              />
            </label>
            <label>
              Due in <span className="muted">(3–60 days, optional — defaults to 14)</span>
              <input
                type="number"
                min={3}
                max={60}
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(event.target.value)}
                placeholder="14"
              />
              {!expiresInDaysValid ? <span className="form-error">Must be between 3 and 60 days.</span> : null}
            </label>
          </div>
          <label>
            Relationship to the referee
            <input value={relationship} onChange={(event) => setRelationship(event.target.value)} />
          </label>
          <label>
            Guidance for the referee <span className="muted">(optional)</span>
            <textarea value={context} onChange={(event) => setContext(event.target.value)} rows={3} />
          </label>
          {mode === "student_draft" ? (
            <label>
              Student draft
              <textarea
                value={studentDraft}
                onChange={(event) => setStudentDraft(event.target.value)}
                minLength={50}
                required
                rows={8}
              />
            </label>
          ) : null}
          {mode === "existing_upload" ? (
            <label>
              Existing document
              <Select
                value={existingDocumentId}
                placeholder="Select a document"
                onChange={(val: any) => setExistingDocumentId(typeof val === "string" ? val : (val?.target?.value ?? ""))}
                options={(documents.data ?? []).map((document) => ({ value: document.id, label: document.display_name }))}
              />
            </label>
          ) : null}
          <label>
            Destinations <span className="muted">(one per line, optional)</span>
            <textarea
              value={destinations}
              onChange={(event) => setDestinations(event.target.value)}
              placeholder={"Oxford MSc Computer Science\nRhodes Scholarship"}
              rows={2}
            />
          </label>
          <label className="check">
            <input type="checkbox" checked={confidential} onChange={(event) => setConfidential(event.target.checked)} />
            This is a confidential reference.
          </label>
          {confidential ? (
            <label className="check">
              <input
                type="checkbox"
                checked={confidentialityAcknowledged}
                onChange={(event) => setConfidentialityAcknowledged(event.target.checked)}
              />
              I understand the final content may not be visible to me.
            </label>
          ) : null}
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
              <dt>Privacy mode</dt>
              <dd>{confidential ? "Confidential" : "Visible to student"}</dd>
            </div>
            <div>
              <dt>Due</dt>
              <dd>{expiresInDays ? `${expiresInDays} days from now` : "14 days from now (default)"}</dd>
            </div>
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
    </div>
  );
}
