import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  History,
  ShieldCheck,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { applicationsApi, intelligenceApi } from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
import { formatDate, label } from "./model";
import type { components } from "../../generated/api/schema";
type S = components["schemas"];
type Tab = "overview" | "requirements" | "tasks" | "documents" | "activity";
export function ApplicationWorkspace() {
  const { id = "" } = useParams(),
    qc = useQueryClient(),
    [tab, setTab] = useState<Tab>("overview"),
    [eligibility, setEligibility] = useState<S["EligibilityResponse"] | null>(
      null,
    );
  const q = useQuery({
    queryKey: queryKeys.workspace(id),
    queryFn: () => applicationsApi.workspace(id),
    enabled: Boolean(id),
  });
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.workspace(id) });
  const requirement = useMutation({
    mutationFn: (body: S["RequirementCreate"]) =>
      applicationsApi.addRequirement(id, body),
    onSuccess: invalidate,
  });
  const task = useMutation({
    mutationFn: (body: S["TaskCreate"]) => applicationsApi.addTask(id, body),
    onSuccess: invalidate,
  });
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
  async function analyze() {
    setEligibility(
      await intelligenceApi.eligibility(id, {
        mutation_id: crypto.randomUUID(),
      }),
    );
  }
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
        <button onClick={analyze}>Run readiness analysis</button>
      </header>
      <nav className="tabs" aria-label="Application workspace">
        {(
          [
            "overview",
            "requirements",
            "tasks",
            "documents",
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
      {eligibility ? <Eligibility result={eligibility} /> : null}
      {tab === "overview" ? <Overview workspace={w} /> : null}
      {tab === "requirements" ? (
        <Requirements
          items={w.requirements}
          onAdd={(body) => requirement.mutate(body)}
          pending={requirement.isPending}
        />
      ) : null}
      {tab === "tasks" ? (
        <Tasks
          items={w.tasks}
          onAdd={(body) => task.mutate(body)}
          pending={task.isPending}
        />
      ) : null}
      {tab === "documents" ? (
        <section className="workspace-section">
          <h2>Linked documents</h2>
          {w.document_links.length ? (
            <ul className="rows">
              {w.document_links.map((x) => (
                <li key={x.id}>
                  <FileText />
                  <span>Document {x.document_id.slice(0, 8)}</span>
                  {x.requirement_id ? (
                    <small>Linked to requirement</small>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="No documents linked to this application." />
          )}
          <Link className="primary" to="/app/documents">
            Open document vault
          </Link>
        </section>
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
function Overview({
  workspace: w,
}: {
  workspace: S["ApplicationWorkspaceResponse"];
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
        <h2>Readiness foundation</h2>
        <strong className="large-stat">
          {ready} of {w.requirements.length}
        </strong>
        <p>requirements ready, submitted or waived</p>
        <hr />
        <strong>
          {w.tasks.filter((x) => x.status !== "completed").length}
        </strong>{" "}
        open tasks
      </aside>
    </div>
  );
}
function Requirements({
  items,
  onAdd,
  pending,
}: {
  items: S["RequirementResponse"][];
  onAdd: (x: S["RequirementCreate"]) => void;
  pending: boolean;
}) {
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    onAdd({
      requirement_type: String(d.requirement_type),
      title: String(d.title),
      status: "not_started",
      required: true,
      owner: d.owner as "student",
    });
    e.currentTarget.reset();
  }
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
        <button disabled={pending}>Add</button>
      </form>
      {items.length ? (
        <ul className="rows">
          {items.map((x) => (
            <li key={x.id}>
              <CheckCircle2 />
              <div>
                <strong>{x.title}</strong>
                <small>
                  {label(x.status)} · {label(x.owner)} · Validation:{" "}
                  {label(x.validation_state)}
                </small>
              </div>
              {x.required ? <span>Required</span> : <span>Optional</span>}
            </li>
          ))}
        </ul>
      ) : (
        <Empty text="No requirements yet." />
      )}
    </section>
  );
}
function Tasks({
  items,
  onAdd,
  pending,
}: {
  items: S["TaskResponse"][];
  onAdd: (x: S["TaskCreate"]) => void;
  pending: boolean;
}) {
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    onAdd({
      title: String(d.title),
      due_at: d.due_at
        ? new Date(String(d.due_at) + "T12:00:00Z").toISOString()
        : null,
    });
    e.currentTarget.reset();
  }
  return (
    <section className="workspace-section">
      <h2>Tasks</h2>
      <form className="inline-form" onSubmit={submit}>
        <input name="title" required minLength={2} placeholder="Next task" />
        <input name="due_at" type="date" />
        <button disabled={pending}>Add task</button>
      </form>
      {items.length ? (
        <ul className="rows">
          {items.map((x) => (
            <li key={x.id}>
              <CheckCircle2 />
              <div>
                <strong>{x.title}</strong>
                <small>
                  {label(x.status)} · {formatDate(x.due_at ?? null)}
                </small>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty text="No tasks yet." />
      )}
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
