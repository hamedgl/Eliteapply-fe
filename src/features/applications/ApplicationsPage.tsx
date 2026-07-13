import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Columns3, List, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { applicationsApi } from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
import { ApiError } from "../../lib/api/errors";
import {
  formatDate,
  label,
  parseBoard,
  priorities,
  stages,
  types,
  type Application,
} from "./model";
export function ApplicationsPage() {
  const qc = useQueryClient(),
    [view, setView] = useState<"board" | "list">(() =>
      window.matchMedia("(max-width: 700px)").matches ? "list" : "board",
    ),
    [stage, setStage] = useState("all"),
    [type, setType] = useState("all"),
    [priority, setPriority] = useState("all"),
    [creating, setCreating] = useState(false);
  const query = useQuery({
    queryKey: queryKeys.board,
    queryFn: async () => parseBoard(await applicationsApi.board()),
  });
  const update = useMutation({
    mutationFn: ({ app, next }: { app: Application; next: string }) =>
      applicationsApi.update(app.id, {
        expected_version: app.version,
        stage: next as (typeof stages)[number],
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.board });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
  const apps = useMemo(
    () =>
      Object.values(query.data?.columns ?? {})
        .flat()
        .filter(
          (a) =>
            (stage === "all" || a.stage === stage) &&
            (type === "all" || a.application_type === type) &&
            (priority === "all" || a.priority === priority),
        ),
    [query.data, stage, type, priority],
  );
  if (query.isPending) return <State text="Loading applications…" />;
  if (query.isError)
    return (
      <State
        text="We couldn’t load your applications."
        action={() => query.refetch()}
      />
    );
  return (
    <div className="page applications-page">
      <header className="page-heading">
        <div>
          <h1>Applications</h1>
          <p>Track every opportunity, requirement and deadline in one place.</p>
        </div>
        <button
          className="primary"
          type="button"
          onClick={() => setCreating(true)}
        >
          <Plus aria-hidden="true" />
          Add application
        </button>
      </header>
      <div className="application-toolbar">
        <div className="view-toggle" aria-label="View">
          <button
            type="button"
            className={view === "board" ? "selected" : ""}
            onClick={() => setView("board")}
            aria-pressed={view === "board"}
          >
            <Columns3 aria-hidden="true" />
            Board
          </button>
          <button
            type="button"
            className={view === "list" ? "selected" : ""}
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
          >
            <List aria-hidden="true" />
            List
          </button>
        </div>
        <label>
          Stage
          <select value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="all">All stages</option>
            {stages.map((x) => (
              <option value={x} key={x}>
                {label(x)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All types</option>
            {types.map((x) => (
              <option value={x} key={x}>
                {label(x)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="all">All priorities</option>
            {priorities.map((x) => (
              <option value={x} key={x}>
                {label(x)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {update.error && (
        <p role="alert" className="form-error">
          {update.error instanceof ApiError && update.error.code === "CONFLICT"
            ? "This application changed elsewhere. The board has been refreshed; review it before moving again."
            : "The application could not be moved."}
        </p>
      )}
      {view === "board" ? (
        <div className="board" aria-label="Application board">
          {stages.map((column) => (
            <section className="board-column" key={column}>
              <h2>
                {label(column)}
                <span>{apps.filter((a) => a.stage === column).length}</span>
              </h2>
              {apps
                .filter((a) => a.stage === column)
                .map((app) => (
                  <article className="application-card" key={app.id}>
                    <Link to={`/app/applications/${app.id}`}>
                      <h3>{app.title}</h3>
                    </Link>
                    <p>{label(app.application_type)}</p>
                    <dl>
                      <div>
                        <dt>Deadline</dt>
                        <dd>
                          <CalendarDays />
                          {formatDate(app.primary_deadline_at)}
                        </dd>
                      </div>
                      <div>
                        <dt>Priority</dt>
                        <dd className={`priority-${app.priority}`}>
                          {label(app.priority)}
                        </dd>
                      </div>
                    </dl>
                    <label>
                      Move application
                      <select
                        aria-label={`Move ${app.title}`}
                        value={app.stage}
                        disabled={update.isPending}
                        onChange={(e) =>
                          update.mutate({ app, next: e.target.value })
                        }
                      >
                        {stages.map((x) => (
                          <option key={x} value={x}>
                            {label(x)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Link
                      className="card-link"
                      to={`/app/applications/${app.id}`}
                    >
                      Open workspace <ArrowRight />
                    </Link>
                  </article>
                ))}
              {apps.filter((a) => a.stage === column).length === 0 ? (
                <div className="column-empty">No applications</div>
              ) : null}
            </section>
          ))}
        </div>
      ) : (
        <ApplicationList apps={apps} />
      )}
      {view === "board" ? (
        <p className="keyboard-tip">
          Keyboard tip: Tab to a card’s move control, then use arrow keys to
          choose a stage.
        </p>
      ) : null}
      {creating ? (
        <CreateApplication onClose={() => setCreating(false)} />
      ) : null}
    </div>
  );
}
function ApplicationList({ apps }: { apps: Application[] }) {
  if (apps.length === 0) {
    return (
      <div className="filtered-empty" role="status">
        <strong>No applications match these filters</strong>
        <p>Change or clear a filter to see more applications.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap application-list-wrap">
      <table className="application-list-table">
        <thead>
          <tr>
            <th>Application</th>
            <th>Type</th>
            <th>Stage</th>
            <th>Deadline</th>
            <th>Priority</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {apps.map((a) => (
            <tr key={a.id}>
              <td data-label="Application">
                <strong>{a.title}</strong>
              </td>
              <td data-label="Type">{label(a.application_type)}</td>
              <td data-label="Stage">{label(a.stage)}</td>
              <td data-label="Deadline">{formatDate(a.primary_deadline_at)}</td>
              <td data-label="Priority">{label(a.priority)}</td>
              <td className="application-list-action">
                <Link to={`/app/applications/${a.id}`}>
                  Open workspace <ArrowRight aria-hidden="true" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function CreateApplication({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient(),
    [error, setError] = useState("");
  const mutationId = useState(() => crypto.randomUUID())[0];
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await applicationsApi.create({
        mutation_id: mutationId,
        title: String(d.title),
        application_type: d.application_type as (typeof types)[number],
        stage: d.stage as (typeof stages)[number],
        priority: d.priority as (typeof priorities)[number],
        intake: String(d.intake) || null,
        primary_deadline_at: d.deadline
          ? new Date(String(d.deadline) + "T12:00:00Z").toISOString()
          : null,
        source_url: String(d.source_url) || null,
        notes: String(d.notes) || null,
        tags: String(d.tags)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      });
      await qc.invalidateQueries({ queryKey: queryKeys.board });
      onClose();
    } catch (x) {
      setError(
        x instanceof ApiError ? x.message : "Could not create application.",
      );
    }
  }
  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-title"
      >
        <header>
          <h2 id="create-title">Add application</h2>
          <button onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <form className="form-grid" onSubmit={submit}>
          <label className="wide">
            Title
            <input name="title" required minLength={2} />
          </label>
          <label>
            Type
            <select name="application_type">
              {types.map((x) => (
                <option value={x} key={x}>
                  {label(x)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Stage
            <select name="stage">
              {stages.map((x) => (
                <option value={x} key={x}>
                  {label(x)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select name="priority">
              {priorities.map((x) => (
                <option value={x} key={x}>
                  {label(x)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Intake
            <input name="intake" placeholder="Autumn 2027" />
          </label>
          <label>
            Primary deadline
            <input name="deadline" type="date" />
          </label>
          <label className="wide">
            Source URL
            <input name="source_url" type="url" />
          </label>
          <label className="wide">
            Tags
            <input name="tags" placeholder="UK, research, funding" />
          </label>
          <label className="wide">
            Notes
            <textarea name="notes" rows={4} />
          </label>
          {error ? (
            <p className="form-error wide" role="alert">
              {error}
            </p>
          ) : null}
          <div className="dialog-actions wide">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary">Create application</button>
          </div>
        </form>
      </section>
    </div>
  );
}
function State({ text, action }: { text: string; action?: () => void }) {
  return (
    <div className="page error-state">
      <h1>{text}</h1>
      {action ? (
        <button className="primary" onClick={action}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
