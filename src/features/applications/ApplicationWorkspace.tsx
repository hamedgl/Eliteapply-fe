import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  History,
  Link2,
  ShieldCheck,
  Unlink,
  UserPlus,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
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
import { formatDate, label } from "./model";
import type { components } from "../../generated/api/schema";
type S = components["schemas"];
type Tab =
  | "overview"
  | "requirements"
  | "tasks"
  | "documents"
  | "eligibility"
  | "collaborators"
  | "activity";
export function ApplicationWorkspace() {
  const { id = "" } = useParams(),
    qc = useQueryClient(),
    [tab, setTab] = useState<Tab>("overview");
  const q = useQuery({
    queryKey: queryKeys.workspace(id),
    queryFn: () => applicationsApi.workspace(id),
    enabled: Boolean(id),
  });
  const collaboratorView = useQuery({
    queryKey: queryKeys.collaboratorView(id),
    queryFn: () => collaborationApi.view(id),
    enabled: Boolean(id),
    retry: false,
  });
  const readiness = useQuery({
    queryKey: [...queryKeys.workspace(id), "readiness"],
    queryFn: () => applicationsApi.readiness(id),
    enabled: Boolean(id),
  });
  const submit = useMutation({
    mutationFn: async (version: number) => {
      const latest = await applicationsApi.readiness(id);
      if (latest.blocking_issues.length || latest.overall_state !== "ready")
        throw new Error(
          "Resolve the blocking readiness items before submitting.",
        );
      return applicationsApi.submit(id, {
        expected_version: version,
        override_incomplete_requirements: false,
      });
    },
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.workspace(id) }),
        qc.invalidateQueries({ queryKey: queryKeys.applications }),
        qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]),
  });
  if (
    collaboratorView.data &&
    ["viewer", "commenter"].includes(collaboratorView.data.role)
  )
    return <ReadOnlyCollaboratorWorkspace view={collaboratorView.data} />;
  if (q.isPending) return <div className="page">Loading workspace…</div>;
  if (q.isError)
    return (
      <div className="page error-state">
        <h1>Application workspace unavailable</h1>
        <button onClick={() => q.refetch()} className="primary">
          Try again
        </button>
      </div>
    );
  const w = q.data,
    a = w.application;
  return (
    <div className="page workspace-page">
      <Link to="/app/applications" className="back">
        <ArrowLeft />
        All applications
      </Link>
      <header className="workspace-header">
        <div>
          <h1>{a.title}</h1>
          <p>
            {label(a.application_type)} · {label(a.stage)} ·{" "}
            {formatDate(a.primary_deadline_at)}
          </p>
        </div>
        <div className="workspace-header-actions">
          <button onClick={() => setTab("eligibility")}>
            Review eligibility
          </button>
          <button
            className="primary"
            disabled={
              readiness.isPending ||
              submit.isPending ||
              readiness.data?.overall_state !== "ready"
            }
            onClick={() => submit.mutate(a.version)}
          >
            {submit.isPending ? "Submitting…" : "Mark submitted"}
          </button>
        </div>
      </header>
      <nav className="tabs" aria-label="Application workspace">
        {(
          [
            "overview",
            "requirements",
            "tasks",
            "documents",
            "eligibility",
            "collaborators",
            "activity",
          ] as Tab[]
        ).map((x) => (
          <button
            key={x}
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
          >
            {label(x)}
          </button>
        ))}
      </nav>
      {submit.error ? (
        <p className="form-error" role="alert">
          {submit.error.message}
        </p>
      ) : null}
      {tab === "overview" ? (
        <Overview
          workspace={w}
          readiness={readiness.data}
          pending={readiness.isPending}
          refresh={() => void readiness.refetch()}
        />
      ) : null}
      {tab === "requirements" ? (
        <Requirements
          applicationId={id}
          items={w.requirements}
          refresh={() =>
            qc.invalidateQueries({ queryKey: queryKeys.workspace(id) })
          }
        />
      ) : null}
      {tab === "tasks" ? (
        <Tasks
          applicationId={id}
          items={w.tasks}
          refresh={() =>
            qc.invalidateQueries({ queryKey: queryKeys.workspace(id) })
          }
        />
      ) : null}
      {tab === "documents" ? (
        <ApplicationDocuments
          applicationId={id}
          requirements={w.requirements}
        />
      ) : null}
      {tab === "eligibility" ? <EligibilityPanel applicationId={id} /> : null}
      {tab === "collaborators" ? (
        <CollaboratorsPanel applicationId={id} />
      ) : null}
      {tab === "activity" ? (
        <section className="workspace-section">
          <h2>Activity</h2>
          {w.history.length ? (
            <ul className="timeline">
              {w.history.map((x) => (
                <li key={x.id}>
                  <History />
                  <div>
                    <strong>{label(x.event_type)}</strong>
                    <time>{formatDate(x.created_at ?? null)}</time>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="No activity recorded yet." />
          )}
        </section>
      ) : null}
    </div>
  );
}

function ReadOnlyCollaboratorWorkspace({
  view,
}: {
  view: S["CollaboratorViewResponse"];
}) {
  const canComment = ["commenter", "advisor_editor"].includes(view.role),
    canEdit = view.role === "advisor_editor";
  return (
    <div className="page workspace-page collaborator-workspace">
      <Link to="/app/applications" className="back">
        <ArrowLeft /> All applications
      </Link>
      <header className="workspace-header">
        <div>
          <span className="permission-badge">{label(view.role)}</span>
          <h1>{view.application.title}</h1>
          <p>
            {canEdit
              ? "Advisor editing is permitted where the server authorizes it."
              : canComment
                ? "Comment access only — application fields are read-only."
                : "View-only access — no changes can be made."}
          </p>
        </div>
      </header>
      <section className="workspace-section">
        <h2>Requirements</h2>
        {view.requirements.length ? (
          <ul className="rows">
            {view.requirements.map((item) => (
              <li key={item.id}>
                <CheckCircle2 aria-hidden="true" />
                <div>
                  <strong>{item.title}</strong>
                  <small>{label(item.status)}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="No requirements available." />
        )}
      </section>
      <section className="workspace-section">
        <h2>Tasks</h2>
        {view.tasks.length ? (
          <ul className="rows">
            {view.tasks.map((item) => (
              <li key={item.id}>
                <CheckCircle2 aria-hidden="true" />
                <div>
                  <strong>{item.title}</strong>
                  <small>{label(item.status)}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="No tasks available." />
        )}
      </section>
    </div>
  );
}

function ApplicationDocuments({
  applicationId,
  requirements,
}: {
  applicationId: string;
  requirements: S["RequirementResponse"][];
}) {
  const qc = useQueryClient();
  const [documentId, setDocumentId] = useState("");
  const [requirementId, setRequirementId] = useState("");
  const links = useQuery({
    queryKey: queryKeys.applicationDocuments(applicationId),
    queryFn: () => applicationsApi.documentLinks(applicationId),
  });
  const documents = useQuery({
    queryKey: queryKeys.documents,
    queryFn: documentsApi.list,
  });
  const scan = useQuery({
    queryKey: queryKeys.documentScan(documentId),
    queryFn: () => documentsApi.scanStatus(documentId),
    enabled: Boolean(documentId),
  });
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({
        queryKey: queryKeys.applicationDocuments(applicationId),
      }),
      qc.invalidateQueries({ queryKey: queryKeys.workspace(applicationId) }),
    ]);
  const link = useMutation({
    mutationFn: () =>
      applicationsApi.linkDocument(applicationId, {
        document_id: documentId,
        requirement_id: requirementId || null,
      }),
    onSuccess: async () => {
      setDocumentId("");
      setRequirementId("");
      await refresh();
    },
  });
  const unlink = useMutation({
    mutationFn: (linkId: string) =>
      applicationsApi.unlinkDocument(applicationId, linkId),
    onSuccess: refresh,
  });
  const names = new Map(
    (documents.data ?? []).map((document) => [
      document.id,
      document.display_name,
    ]),
  );
  const linkedIds = new Set((links.data ?? []).map((item) => item.document_id));
  const available = (documents.data ?? []).filter(
    (document) => !linkedIds.has(document.id),
  );
  const usable = Boolean(scan.data?.usable_for_protected_workflows);
  return (
    <section className="workspace-section application-documents">
      <header>
        <div>
          <h2>Linked documents</h2>
          <p>Only documents that pass security scanning can be linked.</p>
        </div>
        <Link to="/app/documents">Open document vault</Link>
      </header>
      {links.isPending ? (
        <p role="status">Loading document links…</p>
      ) : links.data?.length ? (
        <ul className="rows">
          {links.data.map((item) => (
            <li key={item.id}>
              <FileText aria-hidden="true" />
              <div>
                <strong>
                  {names.get(item.document_id) ??
                    `Document ${item.document_id.slice(0, 8)}`}
                </strong>
                <small>
                  {item.requirement_id
                    ? (requirements.find(
                        (entry) => entry.id === item.requirement_id,
                      )?.title ?? "Linked to requirement")
                    : "Linked to application"}
                </small>
              </div>
              <button
                type="button"
                disabled={unlink.isPending}
                onClick={() => {
                  if (
                    confirm(
                      "Unlink this document from the application? The document will remain in your vault.",
                    )
                  )
                    unlink.mutate(item.id);
                }}
              >
                <Unlink aria-hidden="true" /> Unlink
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Empty text="No documents linked to this application." />
      )}
      <form
        className="document-link-form"
        onSubmit={(event) => {
          event.preventDefault();
          link.mutate();
        }}
      >
        <label>
          Document
          <select
            value={documentId}
            onChange={(event) => setDocumentId(event.target.value)}
            required
          >
            <option value="">Choose a scanned document</option>
            {available.map((document) => (
              <option key={document.id} value={document.id}>
                {document.display_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Requirement (optional)
          <select
            value={requirementId}
            onChange={(event) => setRequirementId(event.target.value)}
          >
            <option value="">Whole application</option>
            {requirements.map((requirement) => (
              <option key={requirement.id} value={requirement.id}>
                {requirement.title}
              </option>
            ))}
          </select>
        </label>
        <button
          className="primary"
          disabled={!documentId || !usable || link.isPending}
        >
          <Link2 aria-hidden="true" />{" "}
          {link.isPending ? "Linking…" : "Link document"}
        </button>
        {documentId && scan.isPending ? (
          <small role="status">Checking document scan status…</small>
        ) : null}
        {documentId && scan.data && !usable ? (
          <small role="alert">
            This document cannot be linked until its security scan passes.
          </small>
        ) : null}
      </form>
      {link.isError || unlink.isError ? (
        <p className="form-error" role="alert">
          The document link could not be updated. Refresh and try again.
        </p>
      ) : null}
    </section>
  );
}
function Overview({
  workspace: w,
  readiness,
  pending,
  refresh,
}: {
  workspace: S["ApplicationWorkspaceResponse"];
  readiness?: S["ApplicationReadinessResponse"];
  pending: boolean;
  refresh: () => void;
}) {
  const ready = w.requirements.filter((x) =>
    ["ready", "submitted", "waived"].includes(x.status),
  ).length;
  return (
    <div className="workspace-overview">
      <section>
        <h2>Application overview</h2>
        <dl className="detail-list">
          <div>
            <dt>Stage</dt>
            <dd>{label(w.application.stage)}</dd>
          </div>
          <div>
            <dt>Priority</dt>
            <dd>{label(w.application.priority)}</dd>
          </div>
          <div>
            <dt>Intake</dt>
            <dd>{w.application.intake ?? "Not set"}</dd>
          </div>
          <div>
            <dt>Deadline</dt>
            <dd>{formatDate(w.application.primary_deadline_at)}</dd>
          </div>
        </dl>
      </section>
      <aside>
        <header className="readiness-heading">
          <h2>Submission readiness</h2>
          <button type="button" onClick={refresh} disabled={pending}>
            Refresh
          </button>
        </header>
        {pending ? (
          <p role="status">Checking readiness…</p>
        ) : readiness ? (
          <>
            <strong className="large-stat">
              {readiness.readiness_percent}%
            </strong>
            <p>
              {label(readiness.overall_state)} · Deadline{" "}
              {label(readiness.deadline_state)}
            </p>
            <progress max="100" value={readiness.readiness_percent}>
              {readiness.readiness_percent}%
            </progress>
            {readiness.blocking_issues.length ? (
              <div className="readiness-issues">
                <strong>Blocking issues</strong>
                <ul>
                  {readiness.blocking_issues.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {readiness.recommended_next_actions.length ? (
              <div className="readiness-issues">
                <strong>Recommended next</strong>
                <ul>
                  {readiness.recommended_next_actions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <p>Readiness is temporarily unavailable.</p>
        )}
        <hr />
        <small>
          {ready} of {w.requirements.length} requirements ready ·{" "}
          {w.tasks.filter((x) => x.status !== "completed").length} open tasks
        </small>
      </aside>
    </div>
  );
}
function Requirements({
  applicationId,
  items,
  refresh,
}: {
  applicationId: string;
  items: S["RequirementResponse"][];
  refresh: () => Promise<unknown>;
}) {
  const [bulkText, setBulkText] = useState("");
  const add = useMutation({
    mutationFn: (body: S["RequirementCreate"]) =>
      applicationsApi.addRequirement(applicationId, body),
    onSuccess: refresh,
  });
  const bulk = useMutation({
    mutationFn: ({ text, mutationId }: { text: string; mutationId: string }) =>
      applicationsApi.addRequirements(applicationId, {
        mutation_id: mutationId,
        items: text
          .split("\n")
          .map((title) => title.trim())
          .filter(Boolean)
          .map((title) => ({
            requirement_type: "other",
            title,
            status: "not_started" as const,
            required: true,
            owner: "student" as const,
          })),
      }),
    onSuccess: async () => {
      setBulkText("");
      await refresh();
    },
  });
  const reorder = useMutation({
    mutationFn: (ids: string[]) =>
      applicationsApi.reorderRequirements(applicationId, {
        requirement_ids: ids,
      }),
    onSuccess: refresh,
  });
  const validate = useMutation({
    mutationFn: (id: string) =>
      applicationsApi.validateRequirement(applicationId, id, {
        validation_state: "valid",
        source: "user_confirmed",
      }),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: (requirement: S["RequirementResponse"]) =>
      applicationsApi.updateRequirement(applicationId, requirement.id, {
        expected_version: requirement.version,
        status: requirement.status === "ready" ? "not_started" : "ready",
      }),
    onSuccess: refresh,
  });
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(e.currentTarget));
    add.mutate(
      {
        requirement_type: String(d.requirement_type),
        title: String(d.title),
        status: "not_started",
        required: true,
        owner: d.owner as "student",
      },
      { onSuccess: () => form.reset() },
    );
  }
  const ordered = [...items].sort((a, b) => a.position - b.position);
  const move = (index: number, direction: -1 | 1) => {
    const next = [...ordered];
    const target = index + direction;
    if (!next[target]) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next.map((item) => item.id));
  };
  const drop = (target: number, event: React.DragEvent) => {
    event.preventDefault();
    const source = ordered.findIndex(
      (item) => item.id === event.dataTransfer.getData("text/plain"),
    );
    if (source < 0 || source === target) return;
    const next = [...ordered];
    const [moved] = next.splice(source, 1);
    next.splice(target, 0, moved);
    reorder.mutate(next.map((item) => item.id));
  };
  return (
    <section className="workspace-section">
      <h2>Requirements</h2>
      <form className="inline-form" onSubmit={submit}>
        <input
          name="title"
          required
          minLength={2}
          placeholder="Requirement title"
        />
        <input
          name="requirement_type"
          required
          minLength={2}
          placeholder="Type, e.g. transcript"
        />
        <select name="owner">
          <option value="student">Student</option>
          <option value="recommender">Recommender</option>
          <option value="institution">Institution</option>
          <option value="advisor">Advisor</option>
        </select>
        <button disabled={add.isPending}>Add</button>
      </form>
      <details className="bulk-create">
        <summary>Add several requirements</summary>
        <label>
          One title per line
          <textarea
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            rows={4}
          />
        </label>
        <button
          type="button"
          disabled={!bulkText.trim() || bulk.isPending}
          onClick={() =>
            bulk.mutate({ text: bulkText, mutationId: newMutationId() })
          }
        >
          Add requirements
        </button>
      </details>
      {items.length ? (
        <ul className="rows">
          {ordered.map((x, index) => (
            <li
              key={x.id}
              draggable
              onDragStart={(event) =>
                event.dataTransfer.setData("text/plain", x.id)
              }
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => drop(index, event)}
            >
              <CheckCircle2 />
              <div>
                <strong>{x.title}</strong>
                <small>
                  {label(x.status)} · {label(x.owner)} · Validation:{" "}
                  {label(x.validation_state)}
                  {x.validation_source
                    ? ` (${label(x.validation_source)})`
                    : ""}
                </small>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  aria-label={`Move ${x.title} up`}
                  disabled={index === 0 || reorder.isPending}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Move ${x.title} down`}
                  disabled={index === ordered.length - 1 || reorder.isPending}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </button>
                {x.validation_state !== "valid" ? (
                  <button
                    type="button"
                    disabled={validate.isPending}
                    onClick={() => validate.mutate(x.id)}
                  >
                    Confirm valid
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={update.isPending}
                  onClick={() => update.mutate(x)}
                >
                  {x.status === "ready" ? "Reopen" : "Mark ready"}
                </button>
                <span>{x.required ? "Required" : "Optional"}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty text="No requirements yet." />
      )}
      {[
        add.error,
        bulk.error,
        reorder.error,
        validate.error,
        update.error,
      ].some(
        (error) => error instanceof ApiError && error.code === "CONFLICT",
      ) ? (
        <ConflictNotice onRefresh={() => void refresh()} />
      ) : add.isError ||
        bulk.isError ||
        reorder.isError ||
        validate.isError ||
        update.isError ? (
        <p className="form-error" role="alert">
          The requirement change could not be saved. Refresh and try again.
        </p>
      ) : null}
    </section>
  );
}
function Tasks({
  applicationId,
  items,
  refresh,
}: {
  applicationId: string;
  items: S["TaskResponse"][];
  refresh: () => Promise<unknown>;
}) {
  const [bulkText, setBulkText] = useState("");
  const add = useMutation({
    mutationFn: (body: S["TaskCreate"]) =>
      applicationsApi.addTask(applicationId, body),
    onSuccess: refresh,
  });
  const bulk = useMutation({
    mutationFn: ({ text, mutationId }: { text: string; mutationId: string }) =>
      applicationsApi.addTasks(applicationId, {
        mutation_id: mutationId,
        items: text
          .split("\n")
          .map((title) => title.trim())
          .filter(Boolean)
          .map((title) => ({ title })),
      }),
    onSuccess: async () => {
      setBulkText("");
      await refresh();
    },
  });
  const reorder = useMutation({
    mutationFn: (ids: string[]) =>
      applicationsApi.reorderTasks(applicationId, { task_ids: ids }),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: (task: S["TaskResponse"]) =>
      applicationsApi.updateTask(applicationId, task.id, {
        expected_version: task.version,
        status: task.status === "completed" ? "open" : "completed",
      }),
    onSuccess: refresh,
  });
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(e.currentTarget));
    add.mutate(
      {
        title: String(d.title),
        due_at: d.due_at
          ? new Date(String(d.due_at) + "T12:00:00Z").toISOString()
          : null,
      },
      { onSuccess: () => form.reset() },
    );
  }
  const ordered = [...items].sort((a, b) => a.position - b.position);
  const move = (index: number, direction: -1 | 1) => {
    const next = [...ordered],
      target = index + direction;
    if (!next[target]) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next.map((item) => item.id));
  };
  const drop = (target: number, event: React.DragEvent) => {
    event.preventDefault();
    const source = ordered.findIndex(
      (item) => item.id === event.dataTransfer.getData("text/plain"),
    );
    if (source < 0 || source === target) return;
    const next = [...ordered];
    const [moved] = next.splice(source, 1);
    next.splice(target, 0, moved);
    reorder.mutate(next.map((item) => item.id));
  };
  return (
    <section className="workspace-section">
      <h2>Tasks</h2>
      <form className="inline-form" onSubmit={submit}>
        <input name="title" required minLength={2} placeholder="Next task" />
        <input name="due_at" type="date" />
        <button disabled={add.isPending}>Add task</button>
      </form>
      <details className="bulk-create">
        <summary>Add several tasks</summary>
        <label>
          One title per line
          <textarea
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            rows={4}
          />
        </label>
        <button
          type="button"
          disabled={!bulkText.trim() || bulk.isPending}
          onClick={() =>
            bulk.mutate({ text: bulkText, mutationId: newMutationId() })
          }
        >
          Add tasks
        </button>
      </details>
      {items.length ? (
        <ul className="rows">
          {ordered.map((x, index) => (
            <li
              key={x.id}
              draggable
              onDragStart={(event) =>
                event.dataTransfer.setData("text/plain", x.id)
              }
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => drop(index, event)}
            >
              <CheckCircle2 />
              <div>
                <strong>{x.title}</strong>
                <small>
                  {label(x.status)} · {formatDate(x.due_at ?? null)}
                </small>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  aria-label={`Move ${x.title} up`}
                  disabled={index === 0 || reorder.isPending}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Move ${x.title} down`}
                  disabled={index === ordered.length - 1 || reorder.isPending}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={update.isPending}
                  onClick={() => update.mutate(x)}
                >
                  {x.status === "completed" ? "Reopen" : "Complete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty text="No tasks yet." />
      )}
      {[add.error, bulk.error, reorder.error, update.error].some(
        (error) => error instanceof ApiError && error.code === "CONFLICT",
      ) ? (
        <ConflictNotice onRefresh={() => void refresh()} />
      ) : add.isError || bulk.isError || reorder.isError || update.isError ? (
        <p className="form-error" role="alert">
          The task change could not be saved. Refresh and try again.
        </p>
      ) : null}
    </section>
  );
}
function EligibilityPanel({ applicationId }: { applicationId: string }) {
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
  const recalculate = useMutation({
    mutationFn: () =>
      intelligenceApi.recalculateEligibility(applicationId, {
        mutation_id: crypto.randomUUID(),
      }),
    onSuccess: (result) => {
      qc.setQueryData(queryKeys.eligibility(applicationId), result);
      void Promise.all([
        qc.invalidateQueries({
          queryKey: queryKeys.eligibilityHistory(applicationId),
        }),
        qc.invalidateQueries({
          queryKey: [...queryKeys.workspace(applicationId), "readiness"],
        }),
        qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
  });
  return (
    <section className="workspace-section eligibility-panel">
      <header>
        <div>
          <h2>Eligibility & readiness</h2>
          <p>
            Review the latest evidence-based check and recalculate when your
            application changes.
          </p>
        </div>
        <button
          className="primary"
          disabled={recalculate.isPending}
          onClick={() => recalculate.mutate()}
        >
          <ShieldCheck aria-hidden="true" />
          {recalculate.isPending ? "Recalculating…" : "Recalculate"}
        </button>
      </header>
      {current.isPending ? (
        <p role="status">Loading current eligibility…</p>
      ) : current.data ? (
        <Eligibility result={current.data} />
      ) : (
        <Empty text="No eligibility result yet. Recalculate to create the first review." />
      )}
      <h3>History</h3>
      {history.data?.items.length ? (
        <ol className="eligibility-history">
          {history.data.items.map((item) => (
            <li key={item.id}>
              <strong>{item.readiness_score}/100</strong>
              <span>{formatDate(item.created_at)}</span>
              <small>{item.disclaimer}</small>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted">No previous calculations.</p>
      )}
      {recalculate.isError ? (
        <p role="alert" className="form-error">
          Eligibility could not be recalculated. Your previous result is
          unchanged.
        </p>
      ) : null}
    </section>
  );
}

function CollaboratorsPanel({ applicationId }: { applicationId: string }) {
  const qc = useQueryClient();
  const collaborators = useQuery({
    queryKey: queryKeys.collaborators(applicationId),
    queryFn: () => collaborationApi.list(applicationId),
  });
  const permission = useQuery({
    queryKey: queryKeys.collaboratorView(applicationId),
    queryFn: () => collaborationApi.view(applicationId),
    retry: false,
  });
  const refresh = () =>
    qc.invalidateQueries({ queryKey: queryKeys.collaborators(applicationId) });
  const invite = useMutation({
    mutationFn: (body: S["CollaboratorInvite"]) =>
      collaborationApi.invite(applicationId, body),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: ({
      id,
      role,
    }: {
      id: string;
      role: S["CollaboratorUpdate"]["role"];
    }) => collaborationApi.update(applicationId, id, { role }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) => collaborationApi.remove(applicationId, id),
    onSuccess: refresh,
  });
  const role = permission.data?.role;
  return (
    <section className="workspace-section collaborators-panel">
      <header>
        <div>
          <h2>Collaborators</h2>
          <p>
            Invite reviewers with the smallest role they need. The server
            verifies every action.
          </p>
        </div>
        {role ? (
          <span className="permission-badge">Your role: {label(role)}</span>
        ) : null}
      </header>
      <form
        className="collaborator-invite"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          invite.mutate(
            {
              email: String(data.get("email")),
              role: data.get("role") as S["CollaboratorInvite"]["role"],
            },
            { onSuccess: () => form.reset() },
          );
        }}
      >
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Role
          <select name="role">
            <option value="viewer">Viewer</option>
            <option value="commenter">Commenter</option>
            <option value="advisor_editor">Advisor editor</option>
          </select>
        </label>
        <button
          className="primary"
          disabled={invite.isPending || Boolean(role)}
        >
          <UserPlus />
          {invite.isPending ? "Inviting…" : "Invite"}
        </button>
      </form>
      {role ? (
        <p className="permission-notice">
          Collaborators cannot manage access.{" "}
          {role === "viewer"
            ? "This view is read-only."
            : role === "commenter"
              ? "You can comment but cannot edit application data."
              : "You can edit application content allowed by the server."}
        </p>
      ) : null}
      {collaborators.data?.length ? (
        <ul className="collaborator-list">
          {collaborators.data.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.invited_email}</strong>
                <small>
                  {label(item.status)} · expires {formatDate(item.expires_at)}
                </small>
              </div>
              <select
                aria-label={`Role for ${item.invited_email}`}
                value={item.role}
                disabled={update.isPending || Boolean(role)}
                onChange={(e) =>
                  update.mutate({
                    id: item.id,
                    role: e.target.value as S["CollaboratorUpdate"]["role"],
                  })
                }
              >
                <option value="viewer">Viewer</option>
                <option value="commenter">Commenter</option>
                <option value="advisor_editor">Advisor editor</option>
              </select>
              <button
                disabled={remove.isPending || Boolean(role)}
                onClick={() =>
                  confirm("Remove this collaborator?") && remove.mutate(item.id)
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Empty text="No collaborators have been invited." />
      )}
      {invite.isError || update.isError || remove.isError ? (
        <p className="form-error" role="alert">
          The collaborator change was not authorized or could not be saved.
        </p>
      ) : null}
    </section>
  );
}
function Eligibility({ result }: { result: S["EligibilityResponse"] }) {
  const render = (x: unknown) =>
    typeof x === "string"
      ? x
      : x && typeof x === "object"
        ? Object.entries(x as Record<string, unknown>)
            .map(([k, v]) => `${label(k)}: ${String(v)}`)
            .join(" · ")
        : "Unsupported finding";
  return (
    <section className="eligibility">
      <ShieldCheck />
      <div>
        <h2>
          Readiness analysis:{" "}
          {Math.max(0, Math.min(100, result.readiness_score))}/100
        </h2>
        <p>{result.disclaimer}</p>
        <div>
          {result.risks.map((x, i) => (
            <span key={i}>{render(x)}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
function Empty({ text }: { text: string }) {
  return <p className="empty-line">{text}</p>;
}
