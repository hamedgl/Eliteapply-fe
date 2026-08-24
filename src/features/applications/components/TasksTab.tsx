import { useState } from "react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  Circle,
  Edit3,
  Plus,
  Trash2,
} from "lucide-react";
import {
  applicationsApi,
} from "../../../lib/api/phase2";
import { newMutationId } from "../../../lib/api/mutations";
import { ApiError } from "../../../lib/api/errors";
import { ConflictNotice } from "../../../components/ConflictNotice";
import { ConfirmationDialog } from "../../../components/actions/ConfirmationDialog";
import { OverflowMenu } from "../../../components/actions/OverflowMenu";
import { EmptyState } from "../../../components/data-display/EmptyState";
import { Select } from "../../../components/ui/select";
import {
  formatDate,
  label,
} from "../model";
import {
  invalidateApplicationResource,
} from "../applicationQueries";
import type { components } from "../../../generated/api/schema";
import "../../../styles/workspace.css";
import {
  TASK_DONE,
  ResourceHeader,
  SummaryChip,
  InlineError,
  readableError,
  WorkspaceDrawer,
  DrawerActions,
  dateValue,
  dateTimeValue,
  optional,
} from "./applicationWorkspaceShared";


type S = components["schemas"];

export function TasksTab({
  applicationId,
  items,
  requirements,
  collaborators,
  onToast,
}: {
  applicationId: string;
  items: S["TaskResponse"][];
  requirements: S["RequirementResponse"][];
  collaborators: S["CollaboratorResponse"][];
  onToast: (message: string) => void;
}) {
  const qc = useQueryClient();
  const [editor, setEditor] = useState<S["TaskResponse"] | "new" | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<S["TaskResponse"] | null>(null);
  const refresh = () =>
    invalidateApplicationResource(qc, applicationId, "tasks");
  const save = useMutation({
    mutationFn: ({
      initial,
      body,
    }: {
      initial?: S["TaskResponse"];
      body: S["TaskCreate"] | S["TaskUpdate"];
    }) =>
      initial
        ? applicationsApi.updateTask(applicationId, initial.id, {
            ...(body as S["TaskUpdate"]),
            expected_version: initial.version,
          })
        : applicationsApi.addTask(applicationId, body as S["TaskCreate"]),
    onSuccess: async (_, variables) => {
      setEditor(null);
      onToast(variables.initial ? "Task updated." : "Task added.");
      await refresh();
    },
  });
  const bulk = useMutation({
    mutationFn: (rows: S["TaskCreate"][]) =>
      applicationsApi.addTasks(applicationId, {
        mutation_id: newMutationId(),
        items: rows,
      }),
    onSuccess: async (_, rows) => {
      setBulkOpen(false);
      onToast(`${rows.length} tasks added.`);
      await refresh();
    },
  });
  const toggle = useMutation({
    mutationFn: (item: S["TaskResponse"]) =>
      applicationsApi.updateTask(applicationId, item.id, {
        status: item.status === "completed" ? "open" : "completed",
        expected_version: item.version,
      }),
    onSuccess: async (_, item) => {
      onToast(
        item.status === "completed" ? "Task reopened." : "Task completed.",
      );
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (item: S["TaskResponse"]) =>
      applicationsApi.deleteTask(applicationId, item.id),
    onSuccess: async () => {
      setDeleteItem(null);
      onToast("Task deleted.");
      await refresh();
    },
  });
  const groups = taskGroups(items);
  const error = save.error || bulk.error || toggle.error || remove.error;

  return (
    <section className="detail-section detail-resource-section">
      <ResourceHeader
        title="Tasks"
        description="Plan the work that moves this application toward submission."
        actions={
          <>
            <button type="button" onClick={() => setBulkOpen(true)}>
              Add multiple
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => setEditor("new")}
            >
              <Plus aria-hidden="true" /> Add task
            </button>
          </>
        }
      />
      <div className="detail-summary-chips" aria-label="Task schedule summary">
        {(
          ["overdue", "today", "upcoming", "unscheduled", "completed"] as const
        ).map((group) => (
          <SummaryChip
            key={group}
            label={group === "unscheduled" ? "No due date" : label(group)}
            value={groups[group].length}
            tone={
              group === "overdue" && groups[group].length ? "danger" : undefined
            }
          />
        ))}
      </div>
      {error ? (
        error instanceof ApiError && error.code === "CONFLICT" ? (
          <ConflictNotice onRefresh={() => void refresh()} />
        ) : (
          <InlineError message={readableError(error)} />
        )
      ) : null}
      {items.length ? (
        <div className="detail-task-groups">
          {(
            [
              "overdue",
              "today",
              "upcoming",
              "unscheduled",
              "completed",
            ] as const
          ).map((group) =>
            groups[group].length ? (
              <section key={group} className="detail-task-group">
                <h3>
                  {group === "unscheduled" ? "No due date" : label(group)}{" "}
                  <span>{groups[group].length}</span>
                </h3>
                <div className="detail-data-list">
                  {groups[group].map((item) => (
                    <article className="detail-data-row task-row" key={item.id}>
                      <button
                        type="button"
                        className="detail-task-check"
                        aria-label={
                          item.status === "completed"
                            ? `Reopen ${item.title}`
                            : `Complete ${item.title}`
                        }
                        disabled={toggle.isPending}
                        onClick={() => toggle.mutate(item)}
                      >
                        {item.status === "completed" ? (
                          <Check aria-hidden="true" />
                        ) : (
                          <Circle aria-hidden="true" />
                        )}
                      </button>
                      <div className="detail-row-main">
                        <strong>{item.title}</strong>
                        <div className="detail-row-meta">
                          <span>{taskDueLabel(item)}</span>
                          <span>{label(item.status)}</span>
                          <span>{label(item.priority)}</span>
                          {item.related_requirement ? (
                            <span>{item.related_requirement.title}</span>
                          ) : null}
                          {item.assignee ? (
                            <span>
                              {item.assignee.name || item.assignee.email}
                            </span>
                          ) : null}
                          {item.reminder_status !== "none" ? (
                            <span>Reminder {label(item.reminder_status)}</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="detail-row-actions">
                        <button
                          type="button"
                          onClick={() => toggle.mutate(item)}
                          disabled={toggle.isPending}
                        >
                          {item.status === "completed" ? "Reopen" : "Complete"}
                        </button>
                        <OverflowMenu
                          label={`More actions for ${item.title}`}
                          items={[
                            {
                              key: "edit",
                              label: "Edit",
                              icon: Edit3,
                              onClick: () => setEditor(item),
                            },
                            {
                              key: "reschedule",
                              label: "Reschedule",
                              icon: CalendarClock,
                              onClick: () => setEditor(item),
                            },
                            { key: "divider", divider: true },
                            {
                              key: "delete",
                              label: "Delete",
                              icon: Trash2,
                              danger: true,
                              onClick: () => setDeleteItem(item),
                            },
                          ]}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null,
          )}
        </div>
      ) : (
        <EmptyState
          icon={CheckCircle2}
          heading="You have no open tasks"
          description="Add a task when there is a concrete next step, deadline or follow-up."
          primaryAction={{ label: "Add task", onClick: () => setEditor("new") }}
        />
      )}
      {editor ? (
        <TaskDrawer
          initial={editor === "new" ? undefined : editor}
          requirements={requirements}
          collaborators={collaborators}
          pending={save.isPending}
          error={save.error}
          onClose={() => setEditor(null)}
          onSubmit={(body) =>
            save.mutate({
              initial: editor === "new" ? undefined : editor,
              body,
            })
          }
        />
      ) : null}
      {bulkOpen ? (
        <TaskBulkDrawer
          pending={bulk.isPending}
          error={bulk.error}
          onClose={() => setBulkOpen(false)}
          onSubmit={(rows) => bulk.mutate(rows)}
        />
      ) : null}
      {deleteItem ? (
        <ConfirmationDialog
          title="Delete task?"
          confirmLabel="Delete task"
          pending={remove.isPending}
          onCancel={() => setDeleteItem(null)}
          onConfirm={() => remove.mutate(deleteItem)}
        >
          <p>“{deleteItem.title}” will be removed from this application.</p>
        </ConfirmationDialog>
      ) : null}
    </section>
  );
}


function TaskDrawer({
  initial,
  requirements,
  collaborators,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  initial?: S["TaskResponse"];
  requirements: S["RequirementResponse"][];
  collaborators: S["CollaboratorResponse"][];
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (body: S["TaskCreate"] | S["TaskUpdate"]) => void;
}) {
  return (
    <WorkspaceDrawer
      title={initial ? "Edit task" : "Add task"}
      description="Name the next concrete action and add a due date when it matters."
      onClose={onClose}
    >
      <form
        className="detail-drawer-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onSubmit({
            title: String(data.get("title")).trim(),
            due_at: dateValue(data.get("due_at")),
            requirement_id: optional(data.get("requirement_id")),
            assignee_user_id: optional(data.get("assignee_user_id")),
            priority: String(
              data.get("priority"),
            ) as S["TaskCreate"]["priority"],
            reminder_at: dateTimeValue(data.get("reminder_at")),
            ...(initial
              ? {
                  status: String(
                    data.get("status"),
                  ) as S["TaskUpdate"]["status"],
                }
              : {}),
          });
        }}
      >
        <label>
          Task title
          <input
            name="title"
            required
            minLength={2}
            defaultValue={initial?.title}
            autoFocus
          />
        </label>
        <label>
          Due date
          <input
            name="due_at"
            type="date"
            defaultValue={initial?.due_at?.slice(0, 10) ?? ""}
          />
        </label>
        <label>
          Related requirement <span className="detail-optional">Optional</span>
          <Select
            name="requirement_id"
            defaultValue={initial?.requirement_id ?? ""}
            options={[
              { value: "", label: "No related requirement" },
              ...requirements.map((item) => ({
                value: item.id,
                label: item.title,
              })),
            ]}
          />
        </label>
        <div className="detail-field-pair">
          <label>
            Priority
            <Select
              name="priority"
              defaultValue={initial?.priority ?? "normal"}
              options={["low", "normal", "high", "critical"].map((value) => ({
                value,
                label: label(value),
              }))}
            />
          </label>
          <label>
            Assignee <span className="detail-optional">Optional</span>
            <Select
              name="assignee_user_id"
              defaultValue={initial?.assignee_user_id ?? ""}
              options={[
                { value: "", label: "Unassigned" },
                ...collaborators
                  .filter(
                    (item) =>
                      item.status === "active" && item.collaborator_user_id,
                  )
                  .map((item) => ({
                    value: item.collaborator_user_id as string,
                    label: item.name || item.invited_email,
                  })),
              ]}
            />
          </label>
        </div>
        <label>
          Reminder <span className="detail-optional">Optional</span>
          <input
            name="reminder_at"
            type="datetime-local"
            defaultValue={initial?.reminder_at?.slice(0, 16) ?? ""}
          />
        </label>
        {initial ? (
          <label>
            Status
            <Select
              name="status"
              defaultValue={initial.status}
              options={["open", "in_progress", "completed", "cancelled"].map(
                (value) => ({ value, label: label(value) }),
              )}
            />
          </label>
        ) : null}
        {error ? <InlineError message={readableError(error)} /> : null}
        <DrawerActions
          pending={pending}
          submitLabel={initial ? "Save changes" : "Add task"}
          onCancel={onClose}
        />
      </form>
    </WorkspaceDrawer>
  );
}


function TaskBulkDrawer({
  pending,
  error,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (rows: S["TaskCreate"][]) => void;
}) {
  const [text, setText] = useState("");
  const [review, setReview] = useState(false);
  const rows = parseTasks(text);
  return (
    <WorkspaceDrawer
      title="Add multiple tasks"
      description="Enter one task per line. Add an optional date after a vertical bar."
      onClose={onClose}
    >
      <div className="detail-drawer-form">
        {review ? (
          <div className="bulk-review">
            <h3>Review {rows.length} tasks</h3>
            {rows.map((row, index) => (
              <article key={`${row.title}-${index}`}>
                <strong>{row.title}</strong>
                <span>
                  {row.due_at ? formatDate(row.due_at) : "No due date"}
                </span>
              </article>
            ))}
            <button type="button" onClick={() => setReview(false)}>
              Back to edit
            </button>
          </div>
        ) : (
          <label>
            Tasks
            <textarea
              rows={10}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={
                "Request transcript | 2026-08-15\nReview personal statement"
              }
            />
            <small>
              Dates use YYYY-MM-DD. You will review every task before creation.
            </small>
          </label>
        )}
        {error ? <InlineError message={readableError(error)} /> : null}
        <div className="apps-drawer-footer detail-inline-footer">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          {review ? (
            <button
              type="button"
              className="primary"
              disabled={pending || !rows.length}
              onClick={() => onSubmit(rows)}
            >
              {pending ? "Adding…" : `Add ${rows.length} tasks`}
            </button>
          ) : (
            <button
              type="button"
              className="primary"
              disabled={!rows.length}
              onClick={() => setReview(true)}
            >
              Review tasks
            </button>
          )}
        </div>
      </div>
    </WorkspaceDrawer>
  );
}


export function taskDueLabel(task: S["TaskResponse"]) {
  const group = taskGroup(task);
  if (group === "today") return "Due today";
  if (group === "overdue")
    return `${formatDate(task.due_at ?? null)} · Overdue`;
  if (group === "unscheduled") return "No due date";
  return formatDate(task.due_at ?? null);
}

function taskGroup(
  task: S["TaskResponse"],
): "overdue" | "today" | "upcoming" | "unscheduled" | "completed" {
  if (TASK_DONE.has(task.status)) return "completed";
  if (!task.due_at) return "unscheduled";
  const due = new Date(task.due_at);
  const now = new Date();
  const dueDay = Date.UTC(
    due.getUTCFullYear(),
    due.getUTCMonth(),
    due.getUTCDate(),
  );
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return dueDay < today ? "overdue" : dueDay === today ? "today" : "upcoming";
}

function taskGroups(items: S["TaskResponse"][]) {
  const groups = {
    overdue: [] as S["TaskResponse"][],
    today: [] as S["TaskResponse"][],
    upcoming: [] as S["TaskResponse"][],
    unscheduled: [] as S["TaskResponse"][],
    completed: [] as S["TaskResponse"][],
  };
  [...items]
    .sort(dateSort)
    .forEach((item) => groups[taskGroup(item)].push(item));
  return groups;
}

export function dateSort(
  a: { due_at?: string | null },
  b: { due_at?: string | null },
) {
  return (
    (a.due_at ? Date.parse(a.due_at) : Number.MAX_SAFE_INTEGER) -
    (b.due_at ? Date.parse(b.due_at) : Number.MAX_SAFE_INTEGER)
  );
}

function parseTasks(text: string): S["TaskCreate"][] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const [rawTitle, rawDate] = line.split("|").map((value) => value.trim());
      if (rawTitle.length < 2) return [];
      const validDate =
        rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
          ? dateValue(rawDate)
          : null;
      return [{ title: rawTitle, due_at: validDate, priority: "normal" }];
    });
}

