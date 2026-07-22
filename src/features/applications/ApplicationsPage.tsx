import { useEffect, useMemo, useRef, useState } from "react";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Columns3,
  Filter as FilterIcon,
  List as ListIcon,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { ConflictNotice } from "../../components/ConflictNotice";
import { Select } from "../../components/ui/select";
import { ApiError } from "../../lib/api/errors";
import { downloadResponse } from "../../lib/api/download";
import { newMutationId } from "../../lib/api/mutations";
import {
  applicationsApi,
  type ApplicationFilters,
  type ApplicationSort,
} from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
import {
  label,
  parseBoard,
  priorities,
  PRIMARY_STAGES,
  stages,
  types,
  type Application,
} from "./model";
import { useDebouncedFilter, useSlashFocus } from "./hooks";
import { readableApiError, refreshApplications, safeFilename } from "./utils";
import { ApplicationsSummary, type SummaryAction } from "./components/ApplicationsSummary";
import { FilterDrawer, collectKnownTags, type DrawerFilters } from "./components/FilterDrawer";
import { ActiveFilterChips, buildFilterChips } from "./components/ActiveFilterChips";
import { ApplicationsTable } from "./components/ApplicationsTable";
import { ApplicationsBoard } from "./components/ApplicationsBoard";
import { BulkActionBar } from "./components/BulkActionBar";
import { ApplicationsSkeleton } from "./components/ApplicationsSkeleton";
import { OnboardingEmptyState } from "./components/EmptyStates";
import { DeleteApplicationDialog } from "./components/DeleteApplicationDialog";
import { CreateApplication, DuplicateApplication } from "./components/ApplicationDialogs";
import type { ActionKind } from "./components/RowActionMenu";
import { PageHeader } from "../../components/page/PageHeader";
import "../../styles/workspace.css";

type View = "board" | "list";
const SORT_OPTIONS = [
  { value: "deadline_asc", text: "Deadline: soonest" },
  { value: "deadline_desc", text: "Deadline: latest" },
  { value: "updated_desc", text: "Recently updated" },
  { value: "priority_desc", text: "Priority: highest" },
  { value: "readiness_asc", text: "Readiness: lowest" },
  { value: "readiness_desc", text: "Readiness: highest" },
  { value: "title_asc", text: "Title: A to Z" },
  { value: "title_desc", text: "Title: Z to A" },
] as const satisfies ReadonlyArray<{ value: ApplicationSort; text: string }>;
const isApplicationSort = (value: string): value is ApplicationSort =>
  SORT_OPTIONS.some((option) => option.value === value);
const DRAWER_KEYS: Record<keyof DrawerFilters, string> = {
  applicationType: "type",
  institutionId: "institution",
  institutionName: "institutionName",
  programmeId: "programme",
  programmeName: "programmeName",
  scholarshipId: "scholarship",
  scholarshipName: "scholarshipName",
  deadlineFrom: "deadlineFrom",
  deadlineTo: "deadlineTo",
  tag: "tag",
  priority: "priority",
  archived: "archived",
};
const DRAWER_SCOPE_KEYS = [
  "institution",
  "institutionName",
  "programme",
  "programmeName",
  "scholarship",
  "scholarshipName",
  "type",
  "deadlineFrom",
  "deadlineTo",
  "tag",
  "priority",
  "archived",
];

export function ApplicationsPage() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(() => params.get("create") === "1");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStage, setBulkStage] = useState("");
  const [bulkPriority, setBulkPriority] = useState("");
  const [bulkTags, setBulkTags] = useState("");
  const [duplicateApp, setDuplicateApp] = useState<Application | null>(null);
  const [deletingApp, setDeletingApp] = useState<Application | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [operationError, setOperationError] = useState("");
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(
    new Set(),
  );
  const initializedCollapsedStages = useRef(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const draggedIdRef = useRef<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  useSlashFocus(searchInputRef);

  const view =
    (params.get("view") as View | null) ??
    (window.matchMedia("(max-width: 700px)").matches ? "list" : "board");
  const value = (key: string) => params.get(key) ?? "";
  const setParam = (key: string, next: string | boolean) => {
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        const text = typeof next === "boolean" ? (next ? "true" : "") : next;
        if (text) copy.set(key, text);
        else copy.delete(key);
        if (key !== "view") copy.set("view", view);
        return copy;
      },
      { replace: true },
    );
  };
  const [searchDraft, setSearchDraft] = useDebouncedFilter(
    "search",
    params,
    setParams,
    view,
  );

  const requestedSort = value("sort");
  const selectedSort = isApplicationSort(requestedSort)
    ? requestedSort
    : "deadline_asc";
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
    sort: selectedSort,
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
    placeholderData: keepPreviousData,
  });
  const listQuery = useInfiniteQuery({
    queryKey: [...queryKeys.applications, "list", filters],
    queryFn: ({ pageParam }) =>
      applicationsApi.list({ ...filters, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    enabled: view === "list",
    placeholderData: keepPreviousData,
  });
  const listApps = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data],
  );
  const boardApps = useMemo(() => {
    const all = Object.values(boardQuery.data?.columns ?? {}).flat();
    const search = searchDraft.trim().toLocaleLowerCase();
    return all.filter(
      (app) =>
        (!filters.stage || app.stage === filters.stage) &&
        (!search || app.title.toLocaleLowerCase().includes(search)),
    );
  }, [boardQuery.data, searchDraft, filters.stage]);
  const appsByStage = useMemo(() => {
    const grouped = new Map<string, Application[]>(
      stages.map((stage) => [stage, []]),
    );
    for (const app of boardApps) grouped.get(app.stage)?.push(app);
    return grouped;
  }, [boardApps]);
  const visibleStages = useMemo(
    () =>
      stages.filter(
        (stage) =>
          PRIMARY_STAGES.has(stage) ||
          (appsByStage.get(stage)?.length ?? 0) > 0,
      ),
    [appsByStage],
  );
  useEffect(() => {
    if (
      view !== "board" ||
      boardQuery.isPending ||
      initializedCollapsedStages.current
    )
      return;
    initializedCollapsedStages.current = true;
    setCollapsedStages(
      new Set(
        visibleStages.filter(
          (stage) => !(appsByStage.get(stage)?.length ?? 0),
        ),
      ),
    );
  }, [appsByStage, visibleStages, boardQuery.isPending, view]);
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
      const previous = qc.getQueryData(boardKey) as
        | { columns: Record<string, Application[]>; total: number }
        | undefined;
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
      setBulkStage("");
      setBulkPriority("");
      setBulkTags("");
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
      kind: ActionKind;
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
  const runAction = (app: Application, kind: ActionKind) => {
    if (kind === "duplicate") {
      setDuplicateApp(app);
      return;
    }
    if (kind === "delete") {
      setDeletingApp(app);
      return;
    }
    if (
      kind === "archive" &&
      !window.confirm(
        `Archive “${app.title}”? Its current stage will be kept for a future restore.`,
      )
    )
      return;
    action.mutate({ app, kind });
  };
  const moveApplication = (app: Application, next: string) => {
    if (app.stage === next || update.isPending) return;
    setCollapsedStages((current) => {
      if (!current.has(next)) return current;
      const expanded = new Set(current);
      expanded.delete(next);
      return expanded;
    });
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

  const resetDrawerFilters = () => {
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        for (const key of DRAWER_SCOPE_KEYS) copy.delete(key);
        copy.set("view", view);
        return copy;
      },
      { replace: true },
    );
  };
  const clearAllFilters = () => {
    setSearchDraft("");
    setParams({ view }, { replace: true });
  };
  const drawerFilters: DrawerFilters = {
    applicationType: value("type"),
    institutionId: value("institution"),
    institutionName: value("institutionName"),
    programmeId: value("programme"),
    programmeName: value("programmeName"),
    scholarshipId: value("scholarship"),
    scholarshipName: value("scholarshipName"),
    deadlineFrom: value("deadlineFrom"),
    deadlineTo: value("deadlineTo"),
    tag: value("tag"),
    priority: value("priority"),
    archived: value("archived") === "true",
  };
  const drawerActiveCount = DRAWER_SCOPE_KEYS.filter(
    (key) => key !== "institutionName" && key !== "programmeName" && key !== "scholarshipName",
  ).filter((key) => Boolean(value(key))).length;
  const chips = buildFilterChips({
    stage: value("stage"),
    applicationType: value("type"),
    priority: value("priority"),
    institutionName: value("institutionName"),
    programmeName: value("programmeName"),
    scholarshipName: value("scholarshipName"),
    deadlineFrom: value("deadlineFrom"),
    deadlineTo: value("deadlineTo"),
    tag: value("tag"),
    archived: value("archived"),
  });
  const removeChip = (key: string) => {
    if (key === "stage") return setParam("stage", "");
    if (key === "type") return setParam("type", "");
    if (key === "priority") return setParam("priority", "");
    if (key === "institution") {
      setParam("institution", "");
      return setParam("institutionName", "");
    }
    if (key === "programme") {
      setParam("programme", "");
      return setParam("programmeName", "");
    }
    if (key === "scholarship") {
      setParam("scholarship", "");
      return setParam("scholarshipName", "");
    }
    if (key === "deadlineFrom") return setParam("deadlineFrom", "");
    if (key === "deadlineTo") return setParam("deadlineTo", "");
    if (key === "tag") return setParam("tag", "");
    if (key === "archived") return setParam("archived", "");
  };
  const applySummaryAction = (summaryAction: SummaryAction) => {
    const copy = new URLSearchParams(params);
    for (const key of DRAWER_SCOPE_KEYS) copy.delete(key);
    copy.delete("stage");
    copy.set("view", view);
    const now = new Date();
    if (summaryAction.kind === "due-this-month") {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
      copy.set("deadlineFrom", start.toISOString().slice(0, 10));
      copy.set("deadlineTo", end.toISOString().slice(0, 10));
    } else if (summaryAction.kind === "needs-attention") {
      const end = new Date(now.getTime() + 3 * 86_400_000);
      copy.set("deadlineTo", end.toISOString().slice(0, 10));
      copy.set("sort", "deadline_asc");
    } else if (summaryAction.kind === "ready") {
      copy.set("stage", "ready_to_submit");
    }
    setSearchDraft("");
    setParams(copy, { replace: true });
  };
  const noFiltersActive =
    !searchDraft &&
    !value("stage") &&
    !DRAWER_SCOPE_KEYS.some((key) => value(key));
  const resultCount =
    view === "list"
      ? (listQuery.data?.pages[0]?.total ?? null)
      : boardApps.length;
  const knownTags = useMemo(
    () => collectKnownTags([...listApps, ...boardApps]),
    [listApps, boardApps],
  );

  if (activeQuery.isPending) return <ApplicationsSkeleton />;
  if (activeQuery.isError)
    return (
      <div className="apps-page-error" role="alert">
        <h1>We couldn’t load your applications.</h1>
        <p>{readableApiError(activeQuery.error)}</p>
        <button className="primary" onClick={() => activeQuery.refetch()}>
          Try again
        </button>
      </div>
    );

  const showOnboarding =
    noFiltersActive &&
    (view === "board" ? boardApps.length === 0 : listApps.length === 0) &&
    !listQuery.isFetchingNextPage;

  return (
    <div className="page apps-page">
      <PageHeader
        title="Applications"
        description="Manage deadlines, requirements, documents and submission progress."
        meta={
          resultCount !== null
            ? `${resultCount} application${resultCount === 1 ? "" : "s"}`
            : null
        }
        actions={
          <>
            <Link
              to="/app/applications/import"
              className="apps-icon-button"
              aria-label="Import an application"
              title="Import application"
            >
              <Upload aria-hidden="true" />
            </Link>
            <button
              className="primary"
              type="button"
              onClick={() => setCreating(true)}
            >
              <Plus aria-hidden="true" /> Add application
            </button>
          </>
        }
      />

      <ApplicationsSummary onApply={applySummaryAction} />

      <div className="apps-card apps-toolbar">
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
            <ListIcon aria-hidden="true" /> List
          </button>
        </div>
        <div className="apps-toolbar-search">
          <Search aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="search"
            aria-label="Search applications, institutions or programmes"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search applications, institutions or programmes"
          />
          {searchDraft ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchDraft("")}
            >
              <X aria-hidden="true" />
            </button>
          ) : (
            <kbd>/</kbd>
          )}
        </div>
        <QuickSelectFilter
          text="Stage"
          label={label}
          value={value("stage")}
          onChange={(next: string) => setParam("stage", next)}
          options={stages}
        />
        <QuickSelectFilter
          text="Type"
          label={label}
          value={value("type")}
          onChange={(next: string) => setParam("type", next)}
          options={types}
        />
        <QuickSelectFilter
          text="Priority"
          label={label}
          value={value("priority")}
          onChange={(next: string) => setParam("priority", next)}
          options={priorities}
        />
        <button
          type="button"
          className="apps-filters-trigger"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
        >
          <FilterIcon aria-hidden="true" /> Filters
          {drawerActiveCount ? (
            <span className="apps-filters-badge">{drawerActiveCount}</span>
          ) : null}
        </button>
        <label className="apps-sort">
          Sort
          <Select
            value={selectedSort}
            onChange={(val: any) => setParam("sort", typeof val === "string" ? val : (val?.target?.value ?? "deadline_asc"))}
            options={SORT_OPTIONS.map((option) => ({
              value: option.value,
              label: option.text,
            }))}
          />
        </label>
      </div>

      <ActiveFilterChips chips={chips} onRemove={removeChip} onClearAll={clearAllFilters} />

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

      <BulkActionBar
        count={view === "list" ? selected.size : 0}
        bulkStage={bulkStage}
        setBulkStage={setBulkStage}
        bulkPriority={bulkPriority}
        setBulkPriority={setBulkPriority}
        bulkTags={bulkTags}
        setBulkTags={setBulkTags}
        pending={bulk.isPending}
        onApply={() => bulk.mutate(newMutationId())}
        onClear={() => setSelected(new Set())}
      />

      {showOnboarding ? (
        <OnboardingEmptyState onCreate={() => setCreating(true)} />
      ) : view === "board" ? (
        <ApplicationsBoard
          visibleStages={visibleStages}
          appsByStage={appsByStage}
          boardApps={boardApps}
          collapsedStages={collapsedStages}
          toggleStage={toggleStage}
          draggedId={draggedId}
          setDraggedId={setDraggedId}
          draggedIdRef={draggedIdRef}
          dragOverStage={dragOverStage}
          setDragOverStage={setDragOverStage}
          moveApplication={moveApplication}
          updatePending={update.isPending}
          onAction={runAction}
        />
      ) : (
        <ApplicationsTable
          apps={listApps}
          selected={selected}
          setSelected={setSelected}
          pending={action.isPending}
          onAction={runAction}
          onClearFilters={clearAllFilters}
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
      {view === "board" && !showOnboarding ? (
        <p className="keyboard-tip">
          Drag cards between stages, or Tab to a card’s “Move to” control and
          use the arrow keys. Collapse stages you do not need right now.
        </p>
      ) : null}

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={drawerFilters}
        setFilter={(key, val) => setParam(DRAWER_KEYS[key], val as string | boolean)}
        knownTags={knownTags}
        resultCount={resultCount}
        onReset={resetDrawerFilters}
      />

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
      {deletingApp ? (
        <DeleteApplicationDialog
          app={deletingApp}
          pending={action.isPending}
          onCancel={() => setDeletingApp(null)}
          onConfirm={() =>
            action.mutate(
              { app: deletingApp, kind: "delete" },
              { onSuccess: () => setDeletingApp(null) },
            )
          }
          onArchiveInstead={() => {
            const app = deletingApp;
            setDeletingApp(null);
            action.mutate({ app, kind: "archive" });
          }}
        />
      ) : null}
    </div>
  );
}

function getPlural(word: string) {
  const lower = word.toLowerCase();
  if (lower.endsWith("y")) return lower.slice(0, -1) + "ies";
  if (lower.endsWith("s") || lower.endsWith("ch") || lower.endsWith("sh")) return lower + "es";
  return lower + "s";
}

function QuickSelectFilter({
  text,
  label: labelFn,
  value,
  onChange,
  options,
}: {
  text: string;
  label: (code: string) => string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="apps-quick-filter">
      <span>{text}</span>
      <Select
        value={value}
        onChange={(val: any) => onChange(typeof val === "string" ? val : (val?.target?.value ?? ""))}
        options={[
          { value: "", label: `All ${getPlural(text)}` },
          ...options.map((item) => ({
            value: item,
            label: labelFn(item),
          })),
        ]}
      />
    </label>
  );
}
