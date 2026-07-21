import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { applicationsApi, catalogueApi } from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";
import { label, priorities, stages, types, type Application } from "../model";
import { readableApiError, refreshApplications } from "../utils";

export function DuplicateApplication({
  app,
  pending,
  onClose,
  onSubmit,
}: {
  app: Application;
  pending: boolean;
  onClose: () => void;
  onSubmit: (options: {
    copy_requirements: boolean;
    copy_tasks: boolean;
    title_suffix: string;
  }) => void;
}) {
  return (
    <div className="apps-dialog-backdrop" role="presentation">
      <section
        className="apps-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-title"
      >
        <header>
          <div>
            <h2 id="duplicate-title">Duplicate application</h2>
            <p>Create a new copy of {app.title}.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            onSubmit({
              copy_requirements: data.get("requirements") === "on",
              copy_tasks: data.get("tasks") === "on",
              title_suffix: String(data.get("suffix")) || "(copy)",
            });
          }}
        >
          <label>
            Title suffix
            <input name="suffix" defaultValue="(copy)" required autoFocus />
          </label>
          <label className="check-field">
            <input name="requirements" type="checkbox" /> Copy requirements
          </label>
          <label className="check-field">
            <input name="tasks" type="checkbox" /> Copy tasks
          </label>
          <div className="dialog-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" disabled={pending}>
              {pending ? "Duplicating…" : "Duplicate"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function CreateApplication({
  onClose,
  defaults,
}: {
  onClose: () => void;
  defaults?: { title?: string; catalogueType?: string; catalogueId?: string };
}) {
  const qc = useQueryClient();
  const [error, setError] = useState("");
  const [applicationType, setApplicationType] = useState<
    (typeof types)[number]
  >(
    defaults?.catalogueType === "scholarship"
      ? "scholarship"
      : defaults?.catalogueType === "programme"
        ? "programme"
        : "programme",
  );
  const mutationId = useState(() => crypto.randomUUID())[0];
  const programmes = useQuery({
    queryKey: queryKeys.catalogue("programmes", {
      surface: "application-create",
    }),
    queryFn: ({ signal }) => catalogueApi.programmes({}, signal),
    enabled: applicationType === "programme",
  });
  const scholarships = useQuery({
    queryKey: queryKeys.catalogue("scholarships", {
      surface: "application-create",
    }),
    queryFn: ({ signal }) => catalogueApi.scholarships({}, signal),
    enabled: applicationType === "scholarship",
  });
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await applicationsApi.create({
        mutation_id: mutationId,
        title: String(data.title),
        application_type: applicationType,
        institution_id:
          defaults?.catalogueType === "institution"
            ? defaults.catalogueId || null
            : null,
        programme_id:
          applicationType === "programme"
            ? String(data.programme_id) || null
            : null,
        scholarship_id:
          applicationType === "scholarship"
            ? String(data.scholarship_id) || null
            : null,
        stage: data.stage as (typeof stages)[number],
        priority: data.priority as (typeof priorities)[number],
        intake: String(data.intake) || null,
        primary_deadline_at: data.deadline
          ? new Date(`${String(data.deadline)}T12:00:00Z`).toISOString()
          : null,
        source_url: String(data.source_url) || null,
        notes: String(data.notes) || null,
        tags: String(data.tags)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      await refreshApplications(qc);
      onClose();
    } catch (caught) {
      setError(readableApiError(caught));
    }
  }
  return (
    <div className="apps-dialog-backdrop" role="presentation">
      <section
        className="apps-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-title"
      >
        <header>
          <h2 id="create-title">Add application</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <form className="form-grid" onSubmit={submit}>
          <label className="wide">
            Title
            <input
              name="title"
              required
              minLength={2}
              autoFocus
              defaultValue={defaults?.title}
            />
          </label>
          <label>
            Type
            <select
              name="application_type"
              required
              value={applicationType}
              onChange={(event) => {
                setApplicationType(
                  event.target.value as (typeof types)[number],
                );
                setError("");
              }}
            >
              {types.map((item) => (
                <option value={item} key={item}>
                  {label(item)}
                </option>
              ))}
            </select>
          </label>
          {applicationType === "programme" ? (
            <label>
              Programme opportunity
              <select
                name="programme_id"
                required
                defaultValue={
                  defaults?.catalogueType === "programme"
                    ? defaults.catalogueId
                    : ""
                }
                disabled={programmes.isPending}
              >
                <option value="">
                  {programmes.isPending
                    ? "Loading programmes…"
                    : "Select a programme"}
                </option>
                {defaults?.catalogueType === "programme" &&
                defaults.catalogueId &&
                !programmes.data?.items.some(
                  (item) => item.id === defaults.catalogueId,
                ) ? (
                  <option value={defaults.catalogueId}>
                    {defaults.title || "Selected programme"}
                  </option>
                ) : null}
                {programmes.data?.items.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <small>
                Can’t find it?{" "}
                <Link
                  to="/app/catalogue?kind=programmes&create=1"
                  target="_blank"
                  rel="noreferrer"
                >
                  Add a private programme
                </Link>
              </small>
            </label>
          ) : null}
          {applicationType === "scholarship" ? (
            <label>
              Scholarship opportunity
              <select
                name="scholarship_id"
                required
                defaultValue={
                  defaults?.catalogueType === "scholarship"
                    ? defaults.catalogueId
                    : ""
                }
                disabled={scholarships.isPending}
              >
                <option value="">
                  {scholarships.isPending
                    ? "Loading scholarships…"
                    : "Select a scholarship"}
                </option>
                {defaults?.catalogueType === "scholarship" &&
                defaults.catalogueId &&
                !scholarships.data?.items.some(
                  (item) => item.id === defaults.catalogueId,
                ) ? (
                  <option value={defaults.catalogueId}>
                    {defaults.title || "Selected scholarship"}
                  </option>
                ) : null}
                {scholarships.data?.items.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                    {item.provider_name ? ` — ${item.provider_name}` : ""}
                  </option>
                ))}
              </select>
              <small>
                Can’t find it?{" "}
                <Link
                  to="/app/catalogue?kind=scholarships&create=1"
                  target="_blank"
                  rel="noreferrer"
                >
                  Add a private scholarship
                </Link>
              </small>
            </label>
          ) : null}
          {(applicationType === "programme" && programmes.isError) ||
          (applicationType === "scholarship" && scholarships.isError) ? (
            <p className="form-error wide" role="alert">
              The catalogue choices could not be loaded. Close this form and try
              again, or add the opportunity from the Catalogue page.
            </p>
          ) : null}
          <label>
            Stage
            <select name="stage" required>
              {stages.map((item) => (
                <option value={item} key={item}>
                  {label(item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select name="priority" required>
              {priorities.map((item) => (
                <option value={item} key={item}>
                  {label(item)}
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
