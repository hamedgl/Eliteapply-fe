import { useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Archive,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Columns3,
  Copy,
  Download,
  GripVertical,
  List,
  Plus,
  Trash2,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import type { components } from "../../generated/api/schema";
import { ConflictNotice } from "../../components/ConflictNotice";
import { ApiError } from "../../lib/api/errors";
import { downloadResponse } from "../../lib/api/download";
import { newMutationId } from "../../lib/api/mutations";
import {
  applicationsApi,
  catalogueApi,
  type ApplicationFilters,
} from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
import {
  formatDate,
  label,
  parseBoard,
  priorities,
  stages,
  types,
  type Application,
} from "./model";

type Schema = components["schemas"];
type View = "board" | "list";

export function ApplicationsPage() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(() => params.get("create") === "1");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStage, setBulkStage] = useState("");
  const [bulkPriority, setBulkPriority] = useState("");
  const [bulkTags, setBulkTags] = useState("");
  const [duplicateApp, setDuplicateApp] = useState<Application | null>(null);
  const [notice, setNotice] = useState("");
  const [operationError, setOperationError] = useState("");
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(
    new Set(),
  );
  const initializedCollapsedStages = useRef(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const draggedIdRef = useRef<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const view =
    (params.get("view") as View | null) ??
    (window.matchMedia("(max-width: 700px)").matches ? "list" : "board");
  const value = (key: string) => params.get(key) ?? "";
  const setParam = (key: string, next: string) => {
    const copy = new URLSearchParams(params);
    if (next) copy.set(key, next);
    else copy.delete(key);
    if (key !== "view") copy.set("view", view);
    setParams(copy, { replace: true });
  };
  const filters: ApplicationFilters = {
    search: value("search") || undefined,
    stage: value("stage") || undefined,
    applicationType: value("type") || undefined,
    priority: value("priority") || undefined,
    institutionId: value("institution") || undefined,
    programmeId: value("programme") || undefined,
    scholarshipId: value("scholarship") || undefined,
    deadlineFrom: value("deadlineFrom") || undefined,
    deadlineTo: value("deadlineTo") || undefined,
    tag: value("tag") || undefined,
    archived: value("archived") === "true" || undefined,
    sort: value("sort") || undefined,
  };
  const boardFilters = {
    applicationType: filters.applicationType,
    priority: filters.priority,
    institutionId: filters.institutionId,
    deadlineBefore: filters.deadlineTo,
  };
  const boardKey = [...queryKeys.board, boardFilters] as const;
  const boardQuery = useQuery({
    queryKey: boardKey,
    queryFn: async () => parseBoard(await applicationsApi.board(boardFilters)),
    enabled: view === "board",
  });
  const listQuery = useInfiniteQuery({
    queryKey: [...queryKeys.applications, "list", filters],
    queryFn: ({ pageParam }) =>
      applicationsApi.list({ ...filters, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    enabled: view === "list",
  });
  const listApps = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data],
  );
  const boardApps = useMemo(() => {
    const all = Object.values(boardQuery.data?.columns ?? {}).flat();
    const search = filters.search?.toLocaleLowerCase();
    return all.filter(
      (app) =>
        (!filters.stage || app.stage === filters.stage) &&
        (!search || app.title.toLocaleLowerCase().includes(search)),
    );
  }, [boardQuery.data, filters.search, filters.stage]);
  const appsByStage = useMemo(() => {
    const grouped = new Map<string, Application[]>(
      stages.map((stage) => [stage, []]),
    );
    for (const app of boardApps) grouped.get(app.stage)?.push(app);
    return grouped;
  }, [boardApps]);
  useEffect(() => {
    if (
      view !== "board" ||
      boardQuery.isPending ||
      initializedCollapsedStages.current
    )
      return;
    initializedCollapsedStages.current = true;
    setCollapsedStages(
      new Set(stages.filter((stage) => !(appsByStage.get(stage)?.length ?? 0))),
    );
  }, [appsByStage, boardQuery.isPending, view]);
  const visibleApps = view === "board" ? boardApps : listApps;
  const update = useMutation({
    mutationFn: ({ app, next }: { app: Application; next: string }) =>
      applicationsApi.update(app.id, {
        expected_version: app.version,
        stage: next as (typeof stages)[number],
      }),
    onMutate: async ({ app, next }) => {
      setOperationError("");
      setNotice("");
      await qc.cancelQueries({ queryKey: boardKey });
      const previous =
        qc.getQueryData<Schema["ApplicationBoardResponse"]>(boardKey);
      if (previous) {
        const moved = { ...app, stage: next };
        const columns = Object.fromEntries(
          Object.entries(previous.columns).map(([stage, items]) => [
            stage,
            items.filter((item) => item.id !== app.id),
          ]),
        );
        columns[next] = [...(columns[next] ?? []), moved];
        qc.setQueryData(boardKey, { ...previous, columns });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) qc.setQueryData(boardKey, context.previous);
    },
    onSettled: () => refreshApplications(qc),
  });
  const bulk = useMutation({
    mutationFn: (mutationId: string) =>
      applicationsApi.bulkUpdate({
        mutation_id: mutationId,
        items: visibleApps
          .filter((app) => selected.has(app.id))
          .map((app) => ({
            application_id: app.id,
            expected_version: app.version,
            stage: bulkStage
              ? (bulkStage as (typeof stages)[number])
              : undefined,
            priority: bulkPriority
              ? (bulkPriority as (typeof priorities)[number])
              : undefined,
            tags: bulkTags
              ? bulkTags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean)
              : undefined,
          })),
      }),
    onMutate: () => {
      setOperationError("");
      setNotice("");
    },
    onSuccess: (result) => {
      const updated = result.results.filter(
        (item) => item.status === "updated",
      ).length;
      const failed = result.results.length - updated;
      setNotice(
        `${updated} updated${failed ? `; ${failed} need review` : ""}.`,
      );
      const reasons = result.results
        .filter((item) => item.status !== "updated")
        .map((item) => item.detail)
        .filter((detail): detail is string => Boolean(detail));
      if (reasons.length)
        setOperationError([...new Set(reasons)].slice(0, 3).join(" "));
      setSelected(new Set());
      void refreshApplications(qc);
    },
  });
  const action = useMutation({
    mutationFn: async ({
      app,
      kind,
      duplicate,
      mutationId,
    }: {
      app: Application;
      kind: "duplicate" | "archive" | "delete" | "export";
      duplicate?: {
        copy_requirements: boolean;
        copy_tasks: boolean;
        title_suffix: string;
      };
      mutationId?: string;
    }) => {
      if (kind === "duplicate")
        return applicationsApi.duplicate(app.id, {
          mutation_id: mutationId ?? newMutationId(),
          copy_requirements: duplicate?.copy_requirements ?? false,
          copy_tasks: duplicate?.copy_tasks ?? false,
          title_suffix: duplicate?.title_suffix || "(copy)",
        });
      if (kind === "archive")
        return applicationsApi.archive(app.id, {
          expected_version: app.version,
        });
      if (kind === "delete") return applicationsApi.remove(app.id);
      const data = await applicationsApi.export(app.id);
      await downloadResponse(
        new Response(JSON.stringify(data, null, 2), {
          headers: { "content-type": "application/json" },
        }),
        `${safeFilename(app.title)}.json`,
      );
    },
    onMutate: () => {
      setOperationError("");
      setNotice("");
    },
    onSuccess: (_data, variables) => {
      if (variables.kind !== "export") void refreshApplications(qc);
      setNotice(`${label(variables.kind)} complete.`);
    },
  });
  const activeQuery = view === "board" ? boardQuery : listQuery;
  if (activeQuery.isPending) return <State text="Loading applications…" />;
  if (activeQuery.isError)
    return (
      <State
        text="We couldn’t load your applications."
        action={() => activeQuery.refetch()}
      />
    );
  const runAction = (
    app: Application,
    kind: "duplicate" | "archive" | "delete" | "export",
  ) => {
    if (kind === "duplicate") {
      setDuplicateApp(app);
      return;
    }
    if (
      kind === "archive" &&
      !window.confirm(
        `Archive “${app.title}”? Its current stage will be kept for a future restore.`,
      )
    )
      return;
    if (
      kind === "delete" &&
      !window.confirm(`Delete “${app.title}”? This cannot be undone.`)
    )
      return;
    action.mutate({ app, kind });
  };
  const moveApplication = (app: Application, next: string) => {
    if (app.stage === next || update.isPending) return;
    update.mutate({ app, next });
  };
  const toggleStage = (stage: string) => {
    setCollapsedStages((current) => {
      const next = new Set(current);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };
  const mutationError = bulk.error ?? action.error ?? update.error;
  const mutationErrorMessage =
    operationError ||
    (mutationError &&
    !(mutationError instanceof ApiError && mutationError.code === "CONFLICT")
      ? readableApiError(mutationError)
      : "");

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
          <Plus aria-hidden="true" /> Add application
        </button>
      </header>
      <div className="application-toolbar">
        <div className="view-toggle" aria-label="View">
          <button
            type="button"
            className={view === "board" ? "selected" : ""}
            onClick={() => setParam("view", "board")}
            aria-pressed={view === "board"}
          >
            <Columns3 aria-hidden="true" /> Board
          </button>
          <button
            type="button"
            className={view === "list" ? "selected" : ""}
            onClick={() => setParam("view", "list")}
            aria-pressed={view === "list"}
          >
            <List aria-hidden="true" /> List
          </button>
        </div>
        <label className="application-search">
          Search
          <input
            type="search"
            value={value("search")}
            onChange={(event) => setParam("search", event.target.value)}
            placeholder="Title or tag"
          />
        </label>
        <Filter
          label="Stage"
          value={value("stage")}
          onChange={(next) => setParam("stage", next)}
          options={stages}
        />
        <Filter
          label="Type"
          value={value("type")}
          onChange={(next) => setParam("type", next)}
          options={types}
        />
        <Filter
          label="Priority"
          value={value("priority")}
          onChange={(next) => setParam("priority", next)}
          options={priorities}
        />
      </div>
      <details className="application-advanced-filters">
        <summary>More filters</summary>
        <div>
          <label>
            Institution ID
            <input
              value={value("institution")}
              onChange={(event) => setParam("institution", event.target.value)}
            />
          </label>
          <label>
            Programme ID
            <input
              value={value("programme")}
              onChange={(event) => setParam("programme", event.target.value)}
            />
          </label>
          <label>
            Scholarship ID
            <input
              value={value("scholarship")}
              onChange={(event) => setParam("scholarship", event.target.value)}
            />
          </label>
          <label>
            Deadline from
            <input
              type="date"
              value={value("deadlineFrom")}
              onChange={(event) => setParam("deadlineFrom", event.target.value)}
            />
          </label>
          <label>
            Deadline to
            <input
              type="date"
              value={value("deadlineTo")}
              onChange={(event) => setParam("deadlineTo", event.target.value)}
            />
          </label>
          <label>
            Tag
            <input
              value={value("tag")}
              onChange={(event) => setParam("tag", event.target.value)}
            />
          </label>
          <label>
            Sort
            <select
              value={value("sort")}
              onChange={(event) => setParam("sort", event.target.value)}
            >
              <option value="">Recommended</option>
              <option value="deadline_asc">Deadline</option>
              <option value="updated_desc">Recently updated</option>
              <option value="priority_desc">Priority</option>
            </select>
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={value("archived") === "true"}
              onChange={(event) =>
                setParam("archived", event.target.checked ? "true" : "")
              }
            />{" "}
            Include archived
          </label>
          <label>
            Priority
            <select
              value={bulkPriority}
              onChange={(event) => setBulkPriority(event.target.value)}
            >
              <option value="">Keep priority</option>
              {priorities.map((item) => (
                <option value={item} key={item}>
                  {label(item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Replace tags
            <input
              value={bulkTags}
              onChange={(event) => setBulkTags(event.target.value)}
              placeholder="funding, UK"
            />
          </label>
          <button
            type="button"
            onClick={() => setParams({ view }, { replace: true })}
          >
            Clear filters
          </button>
        </div>
      </details>
      {update.error instanceof ApiError && update.error.code === "CONFLICT" ? (
        <ConflictNotice onRefresh={() => void activeQuery.refetch()} />
      ) : null}
      {mutationErrorMessage ? (
        <p role="alert" className="form-error">
          <strong>We couldn’t save that change.</strong> {mutationErrorMessage}
        </p>
      ) : null}
      {notice ? (
        <p className="inline-success" role="status">
          {notice}
        </p>
      ) : null}
      {view === "list" && selected.size ? (
        <div
          className="bulk-action-bar"
          role="region"
          aria-label="Bulk application actions"
        >
          <strong>{selected.size} selected</strong>
          <label>
            Move to
            <select
              value={bulkStage}
              onChange={(event) => setBulkStage(event.target.value)}
            >
              <option value="">Choose stage</option>
              {stages.map((item) => (
                <option value={item} key={item}>
                  {label(item)}
                </option>
              ))}
            </select>
          </label>
          <button
            className="primary"
            type="button"
            disabled={
              (!bulkStage && !bulkPriority && !bulkTags.trim()) ||
              bulk.isPending
            }
            onClick={() => bulk.mutate(newMutationId())}
          >
            Apply
          </button>
          <button type="button" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      ) : null}
      {view === "board" ? (
        <div className="board" aria-label="Application board">
          {stages.map((column) => {
            const columnApps = appsByStage.get(column) ?? [];
            const collapsed = collapsedStages.has(column);
            const isDropTarget = dragOverStage === column;
            return (
              <section
                className={`board-column${collapsed ? " is-collapsed" : ""}${isDropTarget ? " is-drop-target" : ""}`}
                key={column}
                aria-labelledby={`column-${column}-title`}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (dragOverStage !== column) setDragOverStage(column);
                }}
                onDragLeave={(event) => {
                  if (
                    !event.relatedTarget ||
                    !event.currentTarget.contains(event.relatedTarget as Node)
                  )
                    setDragOverStage(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const appId =
                    event.dataTransfer.getData("text/plain") ||
                    draggedIdRef.current;
                  const app = boardApps.find((item) => item.id === appId);
                  draggedIdRef.current = null;
                  setDraggedId(null);
                  setDragOverStage(null);
                  if (app) moveApplication(app, column);
                }}
              >
                <header className="board-column-header">
                  <button
                    type="button"
                    className="board-column-toggle"
                    aria-expanded={!collapsed}
                    aria-controls={`column-${column}-content`}
                    aria-label={`${collapsed ? "Expand" : "Collapse"} ${label(column)}`}
                    title={label(column)}
                    onClick={() => toggleStage(column)}
                  >
                    {collapsed ? (
                      <ChevronRight aria-hidden="true" />
                    ) : (
                      <ChevronDown aria-hidden="true" />
                    )}
                    <span id={`column-${column}-title`}>{label(column)}</span>
                    <strong>{columnApps.length}</strong>
                  </button>
                </header>
                <div
                  className="board-column-content"
                  id={`column-${column}-content`}
                  hidden={collapsed}
                >
                  {columnApps.map((app) => (
                    <article
                      className={`application-card${draggedId === app.id ? " is-dragging" : ""}`}
                      key={app.id}
                      aria-labelledby={`application-${app.id}-title`}
                    >
                      <div className="application-card-heading">
                        <span
                          className="application-drag-handle"
                          draggable={!update.isPending}
                          title={`Drag ${app.title}`}
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", app.id);
                            draggedIdRef.current = app.id;
                            setDraggedId(app.id);
                          }}
                          onDragEnd={() => {
                            draggedIdRef.current = null;
                            setDraggedId(null);
                            setDragOverStage(null);
                          }}
                        >
                          <GripVertical aria-hidden="true" />
                        </span>
                        <div>
                          <Link to={`/app/applications/${app.id}`}>
                            <h3 id={`application-${app.id}-title`}>
                              {app.title}
                            </h3>
                          </Link>
                          <p>{label(app.application_type)}</p>
                        </div>
                      </div>
                      <dl>
                        <div>
                          <dt>Deadline</dt>
                          <dd>
                            <CalendarDays aria-hidden="true" />
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
                      <label className="card-stage-control">
                        Move to
                        <select
                          aria-label={`Move ${app.title}`}
                          value={app.stage}
                          disabled={update.isPending}
                          onChange={(event) =>
                            moveApplication(app, event.target.value)
                          }
                        >
                          {stages.map((item) => (
                            <option key={item} value={item}>
                              {label(item)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <ApplicationActions
                        app={app}
                        pending={action.isPending}
                        run={runAction}
                      />
                      <Link
                        className="card-link"
                        to={`/app/applications/${app.id}`}
                      >
                        Open workspace <ArrowRight aria-hidden="true" />
                      </Link>
                    </article>
                  ))}
                  {!columnApps.length ? (
                    <div className="column-empty">
                      {draggedId
                        ? "Drop application here"
                        : "No applications in this stage"}
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <ApplicationList
          apps={listApps}
          selected={selected}
          setSelected={setSelected}
          pending={action.isPending}
          run={runAction}
        />
      )}
      {view === "list" && listQuery.hasNextPage ? (
        <button
          className="load-more"
          type="button"
          disabled={listQuery.isFetchingNextPage}
          onClick={() => listQuery.fetchNextPage()}
        >
          {listQuery.isFetchingNextPage ? "Loading…" : "Load more applications"}
        </button>
      ) : null}
      {view === "board" ? (
        <p className="keyboard-tip">
          Drag cards between stages, or Tab to a card’s “Move to” control and
          use the arrow keys. Collapse stages you do not need right now.
        </p>
      ) : null}
      {creating ? (
        <CreateApplication
          defaults={{
            title: value("title"),
            catalogueType: value("catalogueType"),
            catalogueId: value("catalogueId"),
          }}
          onClose={() => setCreating(false)}
        />
      ) : null}
      {duplicateApp ? (
        <DuplicateApplication
          app={duplicateApp}
          pending={action.isPending}
          onClose={() => setDuplicateApp(null)}
          onSubmit={(duplicate) =>
            action.mutate(
              {
                app: duplicateApp,
                kind: "duplicate",
                duplicate,
                mutationId: newMutationId(),
              },
              { onSuccess: () => setDuplicateApp(null) },
            )
          }
        />
      ) : null}
    </div>
  );
}

function DuplicateApplication({
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
    <div className="dialog-backdrop" role="presentation">
      <section
        className="dialog duplicate-dialog"
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
            ×
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

function Filter({
  label: text,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label>
      {text}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All {text.toLocaleLowerCase()}s</option>
        {options.map((item) => (
          <option value={item} key={item}>
            {label(item)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ApplicationList({
  apps,
  selected,
  setSelected,
  pending,
  run,
}: {
  apps: Application[];
  selected: Set<string>;
  setSelected: (value: Set<string>) => void;
  pending: boolean;
  run: (
    app: Application,
    kind: "duplicate" | "archive" | "delete" | "export",
  ) => void;
}) {
  if (!apps.length)
    return (
      <div className="filtered-empty" role="status">
        <strong>No applications match these filters</strong>
        <p>Change or clear a filter to see more applications.</p>
      </div>
    );
  const allSelected = apps.every((app) => selected.has(app.id));
  return (
    <div className="table-wrap application-list-wrap">
      <table className="application-list-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                aria-label="Select all visible applications"
                checked={allSelected}
                onChange={(event) =>
                  setSelected(
                    event.target.checked
                      ? new Set(apps.map((app) => app.id))
                      : new Set(),
                  )
                }
              />
            </th>
            <th>Application</th>
            <th>Type</th>
            <th>Stage</th>
            <th>Deadline</th>
            <th>Priority</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {apps.map((app) => (
            <tr key={app.id}>
              <td data-label="Select">
                <input
                  type="checkbox"
                  aria-label={`Select ${app.title}`}
                  checked={selected.has(app.id)}
                  onChange={(event) => {
                    const next = new Set(selected);
                    if (event.target.checked) next.add(app.id);
                    else next.delete(app.id);
                    setSelected(next);
                  }}
                />
              </td>
              <td data-label="Application">
                <strong>{app.title}</strong>
              </td>
              <td data-label="Type">{label(app.application_type)}</td>
              <td data-label="Stage">{label(app.stage)}</td>
              <td data-label="Deadline">
                {formatDate(app.primary_deadline_at)}
              </td>
              <td data-label="Priority">{label(app.priority)}</td>
              <td className="application-list-action" data-label="Actions">
                <div className="application-list-action-inner">
                  <ApplicationActions app={app} pending={pending} run={run} />
                  <Link to={`/app/applications/${app.id}`}>
                    Open <ArrowRight aria-hidden="true" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApplicationActions({
  app,
  pending,
  run,
}: {
  app: Application;
  pending: boolean;
  run: (
    app: Application,
    kind: "duplicate" | "archive" | "delete" | "export",
  ) => void;
}) {
  return (
    <div
      className="application-actions"
      aria-label={`Actions for ${app.title}`}
    >
      <button
        type="button"
        disabled={pending}
        onClick={() => run(app, "duplicate")}
        aria-label={`Duplicate ${app.title}`}
        title="Duplicate"
      >
        <Copy />
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(app, "archive")}
        aria-label={`Archive ${app.title}`}
        title="Archive"
      >
        <Archive />
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(app, "export")}
        aria-label={`Export ${app.title}`}
        title="Export"
      >
        <Download />
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(app, "delete")}
        aria-label={`Delete ${app.title}`}
        title="Delete"
      >
        <Trash2 />
      </button>
    </div>
  );
}

function CreateApplication({
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
    <div className="dialog-backdrop" role="presentation">
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-title"
      >
        <header>
          <h2 id="create-title">Add application</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
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

function refreshApplications(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: queryKeys.applications });
  void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
}

function safeFilename(value: string) {
  return (
    value
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLocaleLowerCase() || "application"
  );
}

function readableApiError(error: unknown) {
  if (!(error instanceof ApiError))
    return error instanceof Error
      ? error.message
      : "Please refresh and try again.";
  const details = error.fields.map(({ field, message }) => {
    const cleanMessage = message.replace(/^Value error,\s*/i, "");
    return !field || field === "global"
      ? cleanMessage
      : `${label(field)}: ${cleanMessage}`;
  });
  const reason = [...new Set(details)].join(" ") || error.message;
  return error.correlationId
    ? `${reason} Reference: ${error.correlationId}.`
    : reason;
}
