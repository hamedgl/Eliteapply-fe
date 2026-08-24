import { useMemo, useState } from "react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Copy,
  Edit3,
  FilePlus2,
  Filter,
  ListChecks,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  useSearchParams,
} from "react-router-dom";
import {
  applicationsApi,
} from "../../../lib/api/phase2";
import { newMutationId } from "../../../lib/api/mutations";
import { ApiError } from "../../../lib/api/errors";
import { ConflictNotice } from "../../../components/ConflictNotice";
import { ConfirmationDialog } from "../../../components/actions/ConfirmationDialog";
import { OverflowMenu } from "../../../components/actions/OverflowMenu";
import { EmptyState } from "../../../components/data-display/EmptyState";
import { StatusBadge } from "../../../components/data-display/StatusBadge";
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
  REQUIREMENT_DONE,
  ResourceHeader,
  SummaryChip,
  selectValue,
  InlineError,
  readableError,
  WorkspaceDrawer,
  DrawerActions,
  dateValue,
  optional,
} from "./applicationWorkspaceShared";
import type { Tab } from "../ApplicationWorkspace";


type S = components["schemas"];

type BulkRequirementRow = {
  title: string;
  type: string;
  owner: "student" | "recommender" | "institution" | "advisor";
  due: string;
};


export function RequirementsTab({
  applicationId,
  items,
  links,
  onOpen,
  onToast,
}: {
  applicationId: string;
  items: S["RequirementResponse"][];
  links: S["DocumentLinkResponse"][];
  onOpen: (tab: Tab, additions?: Record<string, string>) => void;
  onToast: (message: string) => void;
}) {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [editor, setEditor] = useState<S["RequirementResponse"] | "new" | null>(
    null,
  );
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<S["RequirementResponse"] | null>(
    null,
  );
  const status = params.get("requirementStatus") ?? "";
  const owner = params.get("requirementOwner") ?? "";
  const type = params.get("requirementType") ?? "";
  const setFilter = (key: string, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        value ? next.set(key, value) : next.delete(key);
        return next;
      },
      { replace: true },
    );
  const filtered = items.filter(
    (item) =>
      (!status || item.status === status) &&
      (!owner || item.owner === owner) &&
      (!type || item.requirement_type === type),
  );
  const linkedByRequirement = useMemo(() => {
    const counts = new Map<string, number>();
    links.forEach(
      (link) =>
        link.requirement_id &&
        counts.set(
          link.requirement_id,
          (counts.get(link.requirement_id) ?? 0) + 1,
        ),
    );
    return counts;
  }, [links]);
  const refresh = () =>
    invalidateApplicationResource(qc, applicationId, "requirements");
  const save = useMutation({
    mutationFn: ({
      initial,
      body,
    }: {
      initial?: S["RequirementResponse"];
      body: S["RequirementCreate"] | S["RequirementUpdate"];
    }) =>
      initial
        ? applicationsApi.updateRequirement(applicationId, initial.id, {
            ...(body as S["RequirementUpdate"]),
            expected_version: initial.version,
          })
        : applicationsApi.addRequirement(
            applicationId,
            body as S["RequirementCreate"],
          ),
    onSuccess: async (_, variables) => {
      setEditor(null);
      onToast(
        variables.initial ? "Requirement updated." : "Requirement added.",
      );
      await refresh();
    },
  });
  const bulk = useMutation({
    mutationFn: (rows: S["RequirementCreate"][]) =>
      applicationsApi.addRequirements(applicationId, {
        mutation_id: newMutationId(),
        items: rows,
      }),
    onSuccess: async (_, rows) => {
      setBulkOpen(false);
      onToast(`${rows.length} requirements added.`);
      await refresh();
    },
  });
  const markReady = useMutation({
    mutationFn: (item: S["RequirementResponse"]) =>
      applicationsApi.updateRequirement(applicationId, item.id, {
        status: "complete",
        expected_version: item.version,
      }),
    onSuccess: async () => {
      onToast("Requirement marked complete.");
      await refresh();
    },
  });
  const duplicate = useMutation({
    mutationFn: (item: S["RequirementResponse"]) =>
      applicationsApi.addRequirement(applicationId, {
        requirement_type: item.requirement_type,
        title: `${item.title} (copy)`,
        status: "not_started",
        required: item.required,
        owner: item.owner,
        due_at: item.due_at,
        source_url: item.source_url,
        notes: item.notes,
      }),
    onSuccess: async () => {
      onToast("Requirement duplicated.");
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (item: S["RequirementResponse"]) =>
      applicationsApi.deleteRequirement(applicationId, item.id),
    onSuccess: async () => {
      setDeleteItem(null);
      onToast("Requirement deleted.");
      await refresh();
    },
  });
  const error =
    save.error ||
    bulk.error ||
    markReady.error ||
    duplicate.error ||
    remove.error;
  const completed = items.filter((item) =>
    REQUIREMENT_DONE.has(item.status),
  ).length;
  const blocked = items.filter(
    (item) => item.readiness_state === "blocked",
  ).length;
  const types = [...new Set(items.map((item) => item.requirement_type))].sort();

  return (
    <section className="detail-section detail-resource-section">
      <ResourceHeader
        title="Requirements"
        description="Track every document, form and action needed for a complete submission."
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
              <Plus aria-hidden="true" /> Add requirement
            </button>
          </>
        }
      />
      <div className="detail-summary-chips" aria-label="Requirement summary">
        <SummaryChip label="Complete" value={completed} />
        <SummaryChip label="Needs attention" value={items.length - completed} />
        <SummaryChip
          label="Validation issues"
          value={blocked}
          tone={blocked ? "danger" : undefined}
        />
        <SummaryChip
          label="Required"
          value={items.filter((item) => item.required).length}
        />
      </div>
      <div className="detail-filter-bar">
        <Filter aria-hidden="true" />
        <Select
          value={status}
          onChange={(value) =>
            setFilter("requirementStatus", selectValue(value))
          }
          options={[
            { value: "", label: "All statuses" },
            ...[
              "not_started",
              "in_progress",
              "ready",
              "needs_review",
              "blocked",
              "complete",
              "submitted",
              "waived",
            ].map((value) => ({ value, label: label(value) })),
          ]}
        />
        <Select
          value={owner}
          onChange={(value) =>
            setFilter("requirementOwner", selectValue(value))
          }
          options={[
            { value: "", label: "All owners" },
            ...["student", "recommender", "institution", "advisor"].map(
              (value) => ({ value, label: label(value) }),
            ),
          ]}
        />
        <Select
          value={type}
          onChange={(value) => setFilter("requirementType", selectValue(value))}
          options={[
            { value: "", label: "All types" },
            ...types.map((value) => ({ value, label: label(value) })),
          ]}
        />
      </div>
      {error ? (
        error instanceof ApiError && error.code === "CONFLICT" ? (
          <ConflictNotice onRefresh={() => void refresh()} />
        ) : (
          <InlineError message={readableError(error)} />
        )
      ) : null}
      {filtered.length ? (
        <div className="detail-data-list" role="list">
          {filtered.map((item) => {
            const linked = linkedByRequirement.get(item.id) ?? 0;
            const needsResolution = ["blocked", "needs_review"].includes(
              item.readiness_state,
            );
            return (
              <article
                className="detail-data-row requirement-row"
                key={item.id}
                role="listitem"
              >
                <div className="detail-row-leading">
                  <RequirementStateIcon item={item} />
                </div>
                <div className="detail-row-main">
                  <div className="detail-row-title">
                    <strong>{item.title}</strong>
                    {item.required ? (
                      <StatusBadge tone="neutral">Required</StatusBadge>
                    ) : (
                      <span className="detail-optional">Optional</span>
                    )}
                  </div>
                  <div className="detail-row-meta">
                    <span>{label(item.requirement_type)}</span>
                    <span>{label(item.owner)}</span>
                    <span>{formatDate(item.due_at ?? null)}</span>
                    <span>
                      {linked} linked {linked === 1 ? "document" : "documents"}
                    </span>
                  </div>
                  <div className="detail-row-status">
                    <StatusBadge tone={requirementTone(item.status)}>
                      {label(item.status)}
                    </StatusBadge>
                    <span>{validationLabel(item.validation_state)}</span>
                    {item.related_task ? (
                      <span>Task: {item.related_task.title}</span>
                    ) : null}
                  </div>
                </div>
                <div className="detail-row-actions">
                  {needsResolution ? (
                    <button
                      type="button"
                      className="primary"
                      onClick={() => setEditor(item)}
                    >
                      Resolve issue
                    </button>
                  ) : item.required && linked === 0 ? (
                    <button
                      type="button"
                      className="primary"
                      onClick={() =>
                        onOpen("documents", { requirement: item.id })
                      }
                    >
                      <FilePlus2 aria-hidden="true" /> Add document
                    </button>
                  ) : !REQUIREMENT_DONE.has(item.status) ? (
                    <button
                      type="button"
                      className="primary"
                      disabled={markReady.isPending}
                      onClick={() => markReady.mutate(item)}
                    >
                      Mark complete
                    </button>
                  ) : (
                    <button type="button" onClick={() => setEditor(item)}>
                      Open requirement
                    </button>
                  )}
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
                        key: "duplicate",
                        label: "Duplicate",
                        icon: Copy,
                        disabled: duplicate.isPending,
                        onClick: () => duplicate.mutate(item),
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
            );
          })}
        </div>
      ) : items.length ? (
        <EmptyState
          icon={Filter}
          heading="No requirements match these filters"
          description="Adjust the status, owner or type filters to see more requirements."
          variant="filtered"
        />
      ) : (
        <EmptyState
          icon={ListChecks}
          heading="No requirements added yet"
          description="Add the documents, forms and actions needed for submission."
          primaryAction={{
            label: "Add requirement",
            onClick: () => setEditor("new"),
          }}
        />
      )}
      {editor ? (
        <RequirementDrawer
          initial={editor === "new" ? undefined : editor}
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
        <RequirementBulkDrawer
          pending={bulk.isPending}
          error={bulk.error}
          onClose={() => setBulkOpen(false)}
          onSubmit={(rows) => bulk.mutate(rows)}
        />
      ) : null}
      {deleteItem ? (
        <ConfirmationDialog
          title="Delete requirement?"
          confirmLabel="Delete requirement"
          pending={remove.isPending}
          onCancel={() => setDeleteItem(null)}
          onConfirm={() => remove.mutate(deleteItem)}
        >
          <p>
            “{deleteItem.title}” will be removed. Linked documents remain in the
            vault.
          </p>
        </ConfirmationDialog>
      ) : null}
    </section>
  );
}


function RequirementDrawer({
  initial,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  initial?: S["RequirementResponse"];
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (body: S["RequirementCreate"] | S["RequirementUpdate"]) => void;
}) {
  return (
    <WorkspaceDrawer
      title={initial ? "Edit requirement" : "Add requirement"}
      description="Keep the title specific enough to scan quickly."
      onClose={onClose}
    >
      <form
        className="detail-drawer-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          if (initial)
            onSubmit({
              title: String(data.get("title")).trim(),
              status: String(
                data.get("status"),
              ) as S["RequirementUpdate"]["status"],
              required: data.get("required") === "on",
              owner: String(
                data.get("owner"),
              ) as S["RequirementUpdate"]["owner"],
              due_at: dateValue(data.get("due_at")),
              notes: optional(data.get("notes")),
              validation_state: String(
                data.get("validation_state"),
              ) as S["RequirementUpdate"]["validation_state"],
            });
          else
            onSubmit({
              title: String(data.get("title")).trim(),
              requirement_type: String(data.get("requirement_type")).trim(),
              status: String(
                data.get("status"),
              ) as S["RequirementCreate"]["status"],
              required: data.get("required") === "on",
              owner: String(
                data.get("owner"),
              ) as S["RequirementCreate"]["owner"],
              due_at: dateValue(data.get("due_at")),
              source_url: optional(data.get("source_url")),
              notes: optional(data.get("notes")),
            });
        }}
      >
        <label>
          Requirement title
          <input
            name="title"
            required
            minLength={2}
            defaultValue={initial?.title}
            autoFocus
          />
        </label>
        <label>
          Type
          <input
            name="requirement_type"
            required={!initial}
            disabled={Boolean(initial)}
            defaultValue={initial?.requirement_type ?? ""}
          />
        </label>
        <div className="detail-field-pair">
          <label>
            Owner
            <Select
              name="owner"
              defaultValue={initial?.owner ?? "student"}
              options={["student", "recommender", "institution", "advisor"].map(
                (value) => ({ value, label: label(value) }),
              )}
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
        </div>
        <div className="detail-field-pair">
          <label>
            Status
            <Select
              name="status"
              defaultValue={initial?.status ?? "not_started"}
              options={[
                "not_started",
                "in_progress",
                "ready",
                "needs_review",
                "blocked",
                "complete",
                "submitted",
                "waived",
              ].map((value) => ({ value, label: label(value) }))}
            />
          </label>
          {initial ? (
            <label>
              Verification
              <Select
                name="validation_state"
                defaultValue={initial.validation_state}
                options={[
                  "unverified",
                  "valid",
                  "invalid",
                  "expired",
                  "pending_scan",
                  "pending_review",
                ].map((value) => ({ value, label: validationLabel(value) }))}
              />
            </label>
          ) : (
            <label>
              Source URL
              <input name="source_url" type="url" />
            </label>
          )}
        </div>
        <label className="detail-check-field">
          <input
            name="required"
            type="checkbox"
            defaultChecked={initial?.required ?? true}
          />{" "}
          Required for submission
        </label>
        <label>
          Notes
          <textarea name="notes" rows={5} defaultValue={initial?.notes ?? ""} />
        </label>
        {error ? <InlineError message={readableError(error)} /> : null}
        <DrawerActions
          pending={pending}
          submitLabel={initial ? "Save changes" : "Add requirement"}
          onCancel={onClose}
        />
      </form>
    </WorkspaceDrawer>
  );
}


function RequirementBulkDrawer({
  pending,
  error,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (rows: S["RequirementCreate"][]) => void;
}) {
  const [review, setReview] = useState(false);
  const [rows, setRows] = useState<BulkRequirementRow[]>([
    { title: "", type: "", owner: "student", due: "" },
  ]);
  const valid = rows.filter(
    (row) => row.title.trim().length >= 2 && row.type.trim().length >= 2,
  );
  const payload = valid.map((row) => ({
    title: row.title.trim(),
    requirement_type: row.type.trim(),
    owner: row.owner,
    due_at: dateValue(row.due),
    status: "not_started" as const,
    required: true,
    source_url: null,
    notes: null,
  }));
  return (
    <WorkspaceDrawer
      wide
      title="Add multiple requirements"
      description="Create structured rows, then review them before saving."
      onClose={onClose}
    >
      <div className="detail-drawer-form">
        {review ? (
          <div className="bulk-review">
            <h3>Review {valid.length} requirements</h3>
            {valid.map((row, index) => (
              <article key={`${row.title}-${index}`}>
                <strong>{row.title}</strong>
                <span>
                  {label(row.type)} · {label(row.owner)} ·{" "}
                  {row.due ? formatDate(dateValue(row.due)) : "No due date"}
                </span>
              </article>
            ))}
            <button type="button" onClick={() => setReview(false)}>
              Back to edit
            </button>
          </div>
        ) : (
          <div className="bulk-grid">
            <div className="bulk-grid-head">
              <span>Title</span>
              <span>Type</span>
              <span>Owner</span>
              <span>Due date</span>
              <span />
            </div>
            {rows.map((row, index) => (
              <div className="bulk-grid-row" key={index}>
                <input
                  aria-label={`Requirement ${index + 1} title`}
                  value={row.title}
                  onChange={(event) =>
                    setRows(
                      updateRow(rows, index, { title: event.target.value }),
                    )
                  }
                />
                <input
                  aria-label={`Requirement ${index + 1} type`}
                  value={row.type}
                  onChange={(event) =>
                    setRows(
                      updateRow(rows, index, { type: event.target.value }),
                    )
                  }
                />
                <Select
                  aria-label={`Requirement ${index + 1} owner`}
                  value={row.owner}
                  onChange={(value) =>
                    setRows(
                      updateRow(rows, index, {
                        owner: selectValue(
                          value,
                        ) as BulkRequirementRow["owner"],
                      }),
                    )
                  }
                  options={[
                    "student",
                    "recommender",
                    "institution",
                    "advisor",
                  ].map((value) => ({ value, label: label(value) }))}
                />
                <input
                  aria-label={`Requirement ${index + 1} due date`}
                  type="date"
                  value={row.due}
                  onChange={(event) =>
                    setRows(updateRow(rows, index, { due: event.target.value }))
                  }
                />
                <button
                  type="button"
                  aria-label={`Remove requirement row ${index + 1}`}
                  disabled={rows.length === 1}
                  onClick={() =>
                    setRows(rows.filter((_, rowIndex) => rowIndex !== index))
                  }
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setRows([
                  ...rows,
                  { title: "", type: "", owner: "student", due: "" },
                ])
              }
            >
              <Plus aria-hidden="true" /> Add row
            </button>
          </div>
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
              disabled={pending || !valid.length}
              onClick={() => onSubmit(payload)}
            >
              {pending ? "Adding…" : `Add ${valid.length} requirements`}
            </button>
          ) : (
            <button
              type="button"
              className="primary"
              disabled={!valid.length}
              onClick={() => setReview(true)}
            >
              Review requirements
            </button>
          )}
        </div>
      </div>
    </WorkspaceDrawer>
  );
}


function requirementTone(
  status: string,
): "neutral" | "blue" | "green" | "amber" | "red" {
  return REQUIREMENT_DONE.has(status)
    ? "green"
    : status === "blocked"
      ? "red"
      : status === "needs_review"
        ? "amber"
        : status === "in_progress"
          ? "blue"
          : "neutral";
}

export function RequirementStateIcon({ item }: { item: S["RequirementResponse"] }) {
  return item.readiness_state === "ready" ? (
    <CheckCircle2 aria-hidden="true" />
  ) : item.readiness_state === "blocked" ? (
    <AlertCircle aria-hidden="true" />
  ) : (
    <Circle aria-hidden="true" />
  );
}

function validationLabel(value: string) {
  const names: Record<string, string> = {
    valid: "Verified",
    unverified: "Not verified",
    invalid: "Verification failed",
    expired: "Evidence expired",
    pending_scan: "Security scan in progress",
    pending_review: "Needs review",
  };
  return names[value] || label(value);
}

function updateRow<T>(rows: T[], index: number, patch: Partial<T>) {
  return rows.map((row, rowIndex) =>
    rowIndex === index ? { ...row, ...patch } : row,
  );
}

