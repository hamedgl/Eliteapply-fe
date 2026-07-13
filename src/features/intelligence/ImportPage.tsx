import { useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Check, Link2, RefreshCw, Trash2, X } from "lucide-react";
import type { components } from "../../generated/api/schema";
import { intelligenceApi } from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
type Import = components["schemas"]["OpportunityImportResponse"];
const terminal = new Set([
  "completed",
  "complete",
  "ready",
  "failed",
  "partial",
  "cancelled",
  "canceled",
]);
const display = (value: unknown) =>
  typeof value === "string" || typeof value === "number"
    ? String(value)
    : value == null
      ? ""
      : JSON.stringify(value);

export function ImportPage() {
  const qc = useQueryClient(),
    mutationId = useRef(crypto.randomUUID()),
    [sourceType, setSourceType] = useState<"text" | "url" | "pdf_text">("url"),
    [selected, setSelected] = useState<string | null>(null),
    [error, setError] = useState("");
  const history = useInfiniteQuery({
    queryKey: queryKeys.imports,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      intelligenceApi.imports(pageParam, signal),
    getNextPageParam: (page) => (page.has_more ? page.next_cursor : undefined),
  });
  const current = useQuery({
    queryKey: selected
      ? queryKeys.opportunityImport(selected)
      : ["opportunity-import", "none"],
    queryFn: ({ signal }) => intelligenceApi.getImport(selected!, signal),
    enabled: Boolean(selected),
    refetchInterval: (q) => {
      const status = q.state.data?.status.toLowerCase();
      return status && !terminal.has(status) && !document.hidden ? 2500 : false;
    },
  });
  const action = useMutation<
    Import | void,
    Error,
    { id: string; kind: "retry" | "cancel" | "delete" }
  >({
    mutationFn: async ({ id, kind }) =>
      kind === "retry"
        ? intelligenceApi.retryImport(id)
        : kind === "cancel"
          ? intelligenceApi.cancelImport(id)
          : intelligenceApi.deleteImport(id),
    onSuccess: (data) => {
      if (data)
        selected &&
          qc.setQueryData(queryKeys.opportunityImport(selected), data);
      else setSelected(null);
      void qc.invalidateQueries({ queryKey: queryKeys.imports });
    },
  });
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const d = new FormData(e.currentTarget);
    try {
      const result = await intelligenceApi.createImport({
        mutation_id: mutationId.current,
        source_type: sourceType,
        source_url: sourceType === "url" ? String(d.get("source_url")) : null,
        raw_source_text:
          sourceType === "url" ? null : String(d.get("raw_source_text")),
      });
      setSelected(result.id);
      mutationId.current = crypto.randomUUID();
      void qc.invalidateQueries({ queryKey: queryKeys.imports });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Import failed.");
    }
  }
  const items = history.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <div className="page phase2-page import-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Opportunity intelligence</span>
          <h1>Import an opportunity</h1>
          <p>
            Bring in a web page or pasted source, then review each extracted
            field before it enters your application.
          </p>
        </div>
      </header>
      <div className="import-layout">
        <section className="import-create">
          <h2>New import</h2>
          <form className="settings-form" onSubmit={submit}>
            <label>
              Source type
              <select
                value={sourceType}
                onChange={(e) =>
                  setSourceType(e.target.value as typeof sourceType)
                }
              >
                <option value="url">Web page URL</option>
                <option value="text">Pasted text</option>
                <option value="pdf_text">Text extracted from a PDF</option>
              </select>
            </label>
            {sourceType === "url" ? (
              <label>
                Source URL
                <input
                  name="source_url"
                  type="url"
                  required
                  placeholder="https://…"
                />
              </label>
            ) : (
              <label>
                Source text
                <textarea
                  name="raw_source_text"
                  minLength={20}
                  maxLength={200000}
                  required
                  rows={12}
                />
              </label>
            )}
            <button className="primary">
              <Link2 />
              Start extraction
            </button>
            {error ? (
              <p role="alert" className="form-error">
                {error}
              </p>
            ) : null}
          </form>
        </section>
        <section className="import-history">
          <header>
            <div>
              <h2>Import history</h2>
              <p>Previous extraction attempts and their status.</p>
            </div>
          </header>
          {history.isPending ? (
            <p role="status">Loading imports…</p>
          ) : items.length ? (
            <ul>
              {items.map((item) => (
                <li
                  className={selected === item.id ? "selected" : ""}
                  key={item.id}
                >
                  <button onClick={() => setSelected(item.id)}>
                    <strong>
                      {item.source_url ||
                        `${item.source_type.replaceAll("_", " ")} import`}
                    </strong>
                    <span
                      className={`status-pill status-${item.status.toLowerCase()}`}
                    >
                      {item.status}
                    </span>
                    <small>
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(item.retrieved_at))}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No imports yet.</p>
          )}
          {history.hasNextPage ? (
            <button onClick={() => history.fetchNextPage()}>
              Load earlier imports
            </button>
          ) : null}
        </section>
      </div>
      {current.isPending && selected ? (
        <p role="status">Loading extraction…</p>
      ) : current.data ? (
        <ImportReview
          item={current.data}
          busy={action.isPending}
          onAction={(kind) => action.mutate({ id: current.data.id, kind })}
          onConfirmed={(item) => {
            qc.setQueryData(queryKeys.opportunityImport(item.id), item);
            void qc.invalidateQueries({ queryKey: queryKeys.imports });
          }}
        />
      ) : null}
    </div>
  );
}

function ImportReview({
  item,
  busy,
  onAction,
  onConfirmed,
}: {
  item: Import;
  busy: boolean;
  onAction: (kind: "retry" | "cancel" | "delete") => void;
  onConfirmed: (item: Import) => void;
}) {
  const [corrections, setCorrections] = useState<Record<string, unknown>>(
      () => ({ ...item.user_corrections }),
    ),
    fields = useMemo(
      () => Object.keys(item.extracted_fields),
      [item.extracted_fields],
    ),
    active = !terminal.has(item.status.toLowerCase());
  async function confirmFields() {
    onConfirmed(
      await intelligenceApi.confirmImport(item.id, {
        confirmed_fields: fields,
        corrections,
      }),
    );
  }
  return (
    <section className="import-review">
      <header>
        <div>
          <span className={`status-pill status-${item.status.toLowerCase()}`}>
            {item.status}
          </span>
          <h2>Review extracted fields</h2>
          <p>
            Confidence is an extraction aid, not a claim that the source is
            correct. Your edits are preserved as corrections.
          </p>
        </div>
        <div>
          {active ? (
            <button disabled={busy} onClick={() => onAction("cancel")}>
              <X />
              Cancel
            </button>
          ) : null}
          {item.status.toLowerCase() === "failed" ? (
            <button disabled={busy} onClick={() => onAction("retry")}>
              <RefreshCw />
              Retry
            </button>
          ) : null}
          <button
            className="danger-link"
            disabled={busy || active}
            onClick={() =>
              confirm("Delete this import record?") && onAction("delete")
            }
          >
            <Trash2 />
            Delete
          </button>
        </div>
      </header>
      {fields.length ? (
        <div className="extraction-fields">
          {fields.map((key) => {
            const value =
              key in corrections
                ? corrections[key]
                : item.extracted_fields[key];
            const confidence = item.field_confidence[key];
            return (
              <label key={key}>
                <span>
                  {key.replaceAll("_", " ")}
                  <small>
                    Confidence:{" "}
                    {confidence == null ? "not supplied" : display(confidence)}
                  </small>
                </span>
                <textarea
                  rows={2}
                  value={display(value)}
                  onChange={(e) =>
                    setCorrections((old) => ({ ...old, [key]: e.target.value }))
                  }
                />
              </label>
            );
          })}
        </div>
      ) : (
        <p>No fields are ready for review yet.</p>
      )}
      {fields.length && !active ? (
        <button className="primary" onClick={confirmFields}>
          <Check />
          Confirm reviewed fields
        </button>
      ) : null}
    </section>
  );
}
