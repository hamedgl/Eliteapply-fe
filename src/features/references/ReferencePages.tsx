import { useEffect, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Select } from "../../components/ui/select";
import { referencesApi } from "../../lib/api/phase3";
import { applicationsApi, documentsApi } from "../../lib/api/phase2";
import { downloadResponse } from "../../lib/api/download";
import { queryKeys } from "../../lib/api/queryKeys";
import { track } from "../../lib/analytics/track";
export function ReferencesPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const q = useInfiniteQuery({
    queryKey: queryKeys.references(status),
    queryFn: ({ pageParam }) =>
      referencesApi.list(status || undefined, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
  });
  const items = q.data?.pages.flatMap((page) => page.items) ?? [];
  async function revoke(id: string) {
    if (
      !confirm(
        "Revoke this reference request? The referee link will stop working.",
      )
    )
      return;
    await referencesApi.revoke(id);
    void qc.invalidateQueries({ queryKey: ["references"] });
  }
  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>Academic References</h1>
          <p>
            Request and verify references while respecting referee
            confidentiality.
          </p>
        </div>
        <Link className="primary" to="/app/references/new">
          New reference
        </Link>
      </header>
      <label className="reference-status-filter">
        Status
        <Select
          value={status}
          onChange={(val: any) => setStatus(typeof val === "string" ? val : (val?.target?.value ?? ""))}
          options={[
            { value: "", label: "All statuses" },
            ...["pending", "opened", "approved", "declined", "expired", "revoked"].map((item) => ({
              value: item,
              label: item,
            })),
          ]}
        />
      </label>
      {items.map((x) => (
        <article className="reference-row" key={x.id}>
          <div className="reference-row-actions">
            <Link to={`/app/references/${x.id}`}>Open</Link>
            <h2>{x.referee_name}</h2>
            <p>
              {x.referee_role} · {x.institution ?? "Institution not provided"}
            </p>
            <strong>{x.status}</strong>
            {x.confidential ? (
              <small>
                {" "}
                Confidential final content is not shown to the student.
              </small>
            ) : null}
          </div>
          <div>
            {x.approved_at ? (
              <Link to={`/verify/academic-reference/${x.public_id}`}>
                Verify
              </Link>
            ) : null}
            <button
              onClick={() => revoke(x.id)}
              disabled={Boolean(x.revoked_at)}
            >
              Revoke
            </button>
          </div>
        </article>
      ))}
      {q.hasNextPage ? (
        <button
          className="load-more"
          type="button"
          disabled={q.isFetchingNextPage}
          onClick={() => q.fetchNextPage()}
        >
          {q.isFetchingNextPage ? "Loading…" : "Load more references"}
        </button>
      ) : null}
    </div>
  );
}

const terminalReferenceStatuses = new Set([
  "approved",
  "declined",
  "expired",
  "cancelled",
  "revoked",
]);

export function ReferenceDetail() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const reference = useQuery({
    queryKey: queryKeys.reference(id),
    queryFn: () => referencesApi.get(id),
  });
  const events = useInfiniteQuery({
    queryKey: queryKeys.referenceEvents(id),
    queryFn: ({ pageParam }) => referencesApi.events(id, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
  });
  const mutate = useMutation({
    mutationFn: (action: "resend" | "remind" | "cancel" | "revoke") =>
      referencesApi[action](id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.reference(id) });
      void qc.invalidateQueries({ queryKey: ["references"] });
      void qc.invalidateQueries({ queryKey: queryKeys.referenceEvents(id) });
    },
  });
  const item = reference.data;
  if (reference.isPending) return <div className="page" role="status">Loading reference…</div>;
  if (!item) return <div className="page"><h1>Reference unavailable</h1><Link to="/app/references">Return to references</Link></div>;
  const terminal = terminalReferenceStatuses.has(item.status);
  const eventItems = events.data?.pages.flatMap((page) => page.items) ?? [];
  const expiry = new Date(item.expires_at);
  return (
    <div className="page reference-detail">
      <header className="page-heading">
        <div><Link to="/app/references">← References</Link><h1>{item.referee_name}</h1><p>{item.referee_role} · {item.institution ?? "Institution not provided"}</p></div>
        <span className="status-pill">{item.status.replaceAll("_", " ")}</span>
      </header>
      <section className="phase3-summary-grid">
        <div><small>Mode</small><strong>{item.mode.replaceAll("_", " ")}</strong></div>
        <div><small>Expires</small><strong><time dateTime={item.expires_at}>{expiry.toLocaleString()}</time></strong></div>
        <div><small>Version</small><strong>{item.version}</strong></div>
        <div><small>Privacy</small><strong>{item.confidential ? "Confidential" : "Visible"}</strong></div>
      </section>
      {item.confidential ? <p className="phase3-notice">The referee’s final content stays confidential. You can see status, attestations, and integrity history.</p> : null}
      <div className="phase3-actions">
        {!terminal ? <button onClick={() => mutate.mutate("resend")} disabled={mutate.isPending}>Resend invitation</button> : null}
        {!terminal ? <button onClick={() => mutate.mutate("remind")} disabled={mutate.isPending}>Send reminder</button> : null}
        {!terminal ? <button onClick={() => confirm("Cancel this pending request?") && mutate.mutate("cancel")} disabled={mutate.isPending}>Cancel request</button> : null}
        {!item.revoked_at && item.status !== "revoked" ? <button className="danger" onClick={() => confirm("Revoke this reference? Its verification and referee link will stop working.") && mutate.mutate("revoke")} disabled={mutate.isPending}>Revoke</button> : null}
        {item.approved_at ? <button onClick={async () => downloadResponse(await referencesApi.certificate(id), `reference-${item.public_id}-certificate.pdf`)}>Certificate</button> : null}
        {item.approved_at && !item.confidential ? <button onClick={async () => downloadResponse(await referencesApi.download(id), `reference-${item.public_id}.pdf`)}>Download letter</button> : null}
        {item.approved_at ? <Link to={`/verify/academic-reference/${item.public_id}`}>Public verification</Link> : null}
      </div>
      {!terminal ? <details className="phase3-panel"><summary>Edit request details</summary><form className="settings-form" onSubmit={async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); try { await referencesApi.update(id, { expected_version: item.version, referee_name: String(data.get("referee_name")), referee_role: data.get("referee_role") as "professor" | "supervisor" | "teacher" | "employer" | "mentor", institution: String(data.get("institution")) || null, department: String(data.get("department")) || null, student_context: { summary: String(data.get("student_context")) } }); await reference.refetch(); } catch (caught) { const message = caught instanceof Error ? caught.message : "Update failed."; alert(message.includes("409") ? `${message} Refresh the latest request before reapplying your edits.` : message); } }}><label>Referee name<input name="referee_name" defaultValue={item.referee_name} required /></label><label>Role<Select name="referee_role" defaultValue={item.referee_role} options={["professor", "supervisor", "teacher", "employer", "mentor"].map((role) => ({ value: role, label: role }))} /></label><label>Institution<input name="institution" defaultValue={item.institution ?? ""} /></label><label>Department<input name="department" /></label><label>Updated student context<textarea name="student_context" /></label><button className="primary">Save request</button></form></details> : null}
      {mutate.error ? <p role="alert">{mutate.error instanceof Error ? mutate.error.message : "Action failed."}</p> : null}
      <section className="phase3-panel"><h2>Integrity history</h2><p className="muted">Each event is chained by the service. Hash metadata is shown for auditability.</p>
        {eventItems.length ? <ol className="phase3-timeline">{eventItems.map((event) => <li key={event.id}><strong>{event.event_type.replaceAll("_", " ")}</strong><time dateTime={event.created_at}>{new Date(event.created_at).toLocaleString()}</time><small>Hash {event.event_hash.slice(0, 12)}…</small></li>)}</ol> : <p>No events recorded yet.</p>}
        {events.hasNextPage ? <button onClick={() => events.fetchNextPage()}>Load earlier events</button> : null}
      </section>
    </div>
  );
}
export function NewReference() {
  const nav = useNavigate(),
    [created, setCreated] = useState<Awaited<
      ReturnType<typeof referencesApi.create>
    > | null>(null);
  const documents = useQuery({ queryKey: queryKeys.documents, queryFn: documentsApi.list });
  const applications = useQuery({ queryKey: queryKeys.applications, queryFn: () => applicationsApi.list() });
  const [mode, setMode] = useState<"student_draft" | "referee_direct" | "existing_upload">("referee_direct");
  const [applicationId, setApplicationId] = useState("");
  const [error, setError] = useState("");
  const mutationId = useRef("");
  useEffect(() => {
    if (!applicationId && applications.data?.items.length) {
      setApplicationId(applications.data.items[0].id);
    }
  }, [applications.data, applicationId]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!applicationId) {
      setError("Select an application first.");
      return;
    }
    const d = Object.fromEntries(new FormData(e.currentTarget)),
      selectedMode = d.mode as typeof mode;
    try { const x = await referencesApi.create({
      mutation_id: mutationId.current ||= crypto.randomUUID(),
      application_id: applicationId,
      mode: selectedMode,
      confidential: d.confidential === "on",
      confidentiality_acknowledged: d.ack === "on",
      referee_name: String(d.referee_name),
      referee_email: String(d.referee_email),
      referee_role: d.referee_role as "professor",
      institution: String(d.institution) || null,
      department: String(d.department) || null,
      relationship_context: { summary: String(d.relationship) },
      student_context: { summary: String(d.context) },
      student_draft: selectedMode === "student_draft" ? String(d.student_draft) || null : null,
      existing_document_id: selectedMode === "existing_upload" ? String(d.existing_document_id) : null,
      destinations: String(d.destinations).split("\n").map((value) => value.trim()).filter(Boolean).map((destination) => ({ destination })),
    });
    mutationId.current = ""; setCreated(x); void track("first_referee_invited").catch(() => undefined); } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not create the invitation."); }
  }
  if (created)
    return (
      <div className="page">
        <h1>Invitation created</h1>
        <p>
          EliteApply sent the invitation securely. No referee token is exposed
          to this browser.
        </p>
        <dl>
          <div>
            <dt>Status</dt>
            <dd>{created.status}</dd>
          </div>
          <div>
            <dt>Expires</dt>
            <dd>{new Date(created.expires_at).toLocaleDateString()}</dd>
          </div>
        </dl>
        <button
          onClick={() => {
            setCreated(null);
            nav("/app/references");
          }}
        >
          Done
        </button>
      </div>
    );
  return (
    <div className="page">
      <h1>New academic reference</h1>
      <form className="settings-form" onSubmit={submit}>
        <label>
          Application
          {applications.data?.items.length ? (
            <Select
              value={applicationId}
              onChange={(val: any) =>
                setApplicationId(typeof val === "string" ? val : (val?.target?.value ?? ""))
              }
              options={applications.data.items.map((application) => ({
                value: application.id,
                label: application.institution_name
                  ? `${application.title} · ${application.institution_name}`
                  : application.title,
              }))}
            />
          ) : (
            <p className="apps-dialog-subtext">
              {applications.isPending ? "Loading applications…" : "You don't have any applications yet."}
            </p>
          )}
        </label>
        <label>
          Mode
          <Select
            name="mode"
            value={mode}
            onChange={(val: any) =>
              setMode((typeof val === "string" ? val : (val?.target?.value ?? "referee_direct")) as typeof mode)
            }
            options={[
              { value: "referee_direct", label: "Referee writes directly" },
              { value: "student_draft", label: "Student draft" },
              { value: "existing_upload", label: "Existing upload" },
            ]}
          />
        </label>
        <label>
          Referee name
          <input name="referee_name" required />
        </label>
        <label>
          Referee email
          <input type="email" name="referee_email" required />
        </label>
        <label>
          Role
          <Select
            name="referee_role"
            options={["professor", "supervisor", "teacher", "employer", "mentor"].map((x) => ({
              value: x,
              label: x,
            }))}
          />
        </label>
        <label>
          Institution
          <input name="institution" />
        </label>
        <label>
          Department
          <input name="department" />
        </label>
        <label>
          Relationship
          <input name="relationship" />
        </label>
        <label>
          Student context
          <textarea name="context" />
        </label>
        {mode === "student_draft" ? <label>Student draft<textarea name="student_draft" required minLength={50} /></label> : null}
        {mode === "existing_upload" ? <label>Existing document<select name="existing_document_id" required><option value="">Select a document</option>{documents.data?.map((document) => <option key={document.id} value={document.id}>{document.display_name}</option>)}</select></label> : null}
        <label>Destinations <span className="muted">(one per line)</span><textarea name="destinations" placeholder="Oxford MSc Computer Science&#10;Rhodes Scholarship" /></label>
        <label className="check">
          <input name="confidential" type="checkbox" />
          This is a confidential reference.
        </label>
        <label className="check">
          <input name="ack" type="checkbox" />I understand confidential final
          content may not be visible to me.
        </label>
        <button className="primary" disabled={!applicationId}>Create invitation</button>
        {error ? <p role="alert">{error}</p> : null}
      </form>
    </div>
  );
}
export function RefereePage() {
  const { token = "" } = useParams(),
    [code, setCode] = useState(""),
    [request, setRequest] = useState<Record<string, unknown> | null>(null),
    [decision, setDecision] = useState<"approve" | "decline">("approve"),
    [done, setDone] = useState(false),
    [error, setError] = useState(""), [submitting, setSubmitting] = useState(false);
  async function unlock() {
    try {
      setRequest(await referencesApi.refereeGet(token, code));
    } catch {
      setError("The invitation or code could not be verified.");
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true); setError("");
    const data = new FormData(e.currentTarget);
    try { await referencesApi.refereeSubmit(token, code, {
      decision,
      final_content:
        decision === "approve" ? String(data.get("content")) : null,
      referee_display_name: String(data.get("referee_display_name")),
      role_title: String(data.get("role_title")) || null,
      relationship_confirmation: data.get("relationship_confirmation") === "on",
      relationship_duration: String(data.get("relationship_duration")) || null,
      authenticity_attestation: data.get("authenticity_attestation") === "on",
      authority_consent: data.get("authority_consent") === "on",
      conflict_of_interest: String(data.get("conflict_of_interest")) || null,
      signature_name: String(data.get("signature_name")) || null,
      decline_reason_category: decision === "decline" ? data.get("decline_reason_category") as "no_relationship" | "insufficient_time" | "policy_conflict" | "other" : null,
      existing_document_id: String(data.get("existing_document_id")) || null,
    });
    setCode("");
    setRequest(null);
    setDone(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Submission failed. Your form is still available to retry."); setSubmitting(false); }
  }
  if (done)
    return (
      <Public title="Reference submitted">
        <p>
          Your reference was submitted securely. Sensitive content has been
          cleared from this page.
        </p>
      </Public>
    );
  return (
    <Public title="Submit an academic reference">
      {!request ? (
        <div className="settings-form">
          <p>
            Enter the separate reference code you received. It is kept only in
            memory.
          </p>
          <label>
            Reference code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
            />
          </label>
          <button className="primary" onClick={unlock}>
            Continue securely
          </button>
          {error ? <p role="alert">{error}</p> : null}
        </div>
      ) : (
        <form className="settings-form" onSubmit={submit}>
          <SafeObject value={request} />
          <label>
            Decision
            <Select
              value={decision}
              onChange={(val: any) =>
                setDecision((typeof val === "string" ? val : (val?.target?.value ?? "approve")) as typeof decision)
              }
              options={[
                { value: "approve", label: "Approve and submit" },
                { value: "decline", label: "Decline request" },
              ]}
            />
          </label>
          <label>
            Display name
            <input name="referee_display_name" required minLength={2} />
          </label>
          <label>
            Role or title
            <input name="role_title" />
          </label>
          <label>How long have you known the applicant?<input name="relationship_duration" required /></label>
          {decision === "approve" ? (
            <label>
              Final reference
              <textarea name="content" minLength={50} required rows={14} />
            </label>
          ) : null}
          {decision === "decline" ? <label>Reason for declining<select name="decline_reason_category" required><option value="no_relationship">I do not know the applicant</option><option value="insufficient_time">I do not have enough time</option><option value="policy_conflict">Institutional policy conflict</option><option value="other">Other</option></select></label> : null}
          {decision === "approve" ? <label>Existing supporting document ID <span className="muted">(optional alternative)</span><input name="existing_document_id" /></label> : null}
          <label>Potential conflict of interest <span className="muted">(write “None” if not applicable)</span><textarea name="conflict_of_interest" required /></label>
          <label>
            Signature name
            <input name="signature_name" required />
          </label>
          <label className="check">
            <input name="relationship_confirmation" type="checkbox" required />I
            confirm the stated relationship.
          </label>
          <label className="check">
            <input name="authenticity_attestation" type="checkbox" required />I
            attest that this submission is authentic.
          </label>
          <label className="check">
            <input name="authority_consent" type="checkbox" required />I am
            authorized to submit this reference.
          </label>
          <p className="phase3-consent">By submitting, you confirm that the reference is your own honest assessment, that you have authority to provide it, and that EliteApply may securely store and share it with the stated destinations.</p>
          <button className="primary" disabled={submitting}>{submitting ? "Submitting securely…" : "Submit reference"}</button>
          {error ? <p role="alert">{error}</p> : null}
        </form>
      )}
    </Public>
  );
}
export function VerifyReference() {
  const { publicId = "" } = useParams(),
    q = useQuery({
      queryKey: ["verify", publicId],
      queryFn: () => referencesApi.verify(publicId),
    });
  return (
    <Public title="Academic reference verification">
      {q.isPending ? (
        <p>Checking reference…</p>
      ) : q.isError ? (
        <p>This reference could not be verified.</p>
      ) : (
        <dl className="verify">
          <div>
            <dt>Status</dt>
            <dd>{q.data.status}</dd>
          </div>
          <div>
            <dt>Referee role</dt>
            <dd>{q.data.referee_role}</dd>
          </div>
          <div>
            <dt>Institution</dt>
            <dd>{q.data.institution ?? "Not provided"}</dd>
          </div>
          <div>
            <dt>Approved</dt>
            <dd>
              {q.data.approved_at
                ? new Date(q.data.approved_at).toLocaleDateString()
                : "Not approved"}
            </dd>
          </div>
          <div>
            <dt>What verification means</dt>
            <dd>{q.data.disclaimer}</dd>
          </div>
        </dl>
      )}
    </Public>
  );
}
function Public({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]') ?? document.head.appendChild(document.createElement("meta"));
    const previous = meta.content;
    meta.name = "robots"; meta.content = "noindex,nofollow";
    return () => { meta.content = previous; };
  }, []);
  return (
    <main className="public-flow">
      <Link className="brand" to="/">
        EliteApply
      </Link>
      <h1>{title}</h1>
      {children}
    </main>
  );
}
function SafeObject({ value }: { value: Record<string, unknown> }) {
  return (
    <dl>
      {Object.entries(value)
        .filter(([k]) => !/(token|email|content|context)/i.test(k))
        .map(([k, v]) => (
          <div>
            <dt>{k.replaceAll("_", " ")}</dt>
            <dd>{typeof v === "string" ? v : "Provided"}</dd>
          </div>
        ))}
    </dl>
  );
}
