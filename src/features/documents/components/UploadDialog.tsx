import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  FileText,
  Loader2,
  RotateCcw,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Select } from "../../../components/ui/select";
import { uploadAcademicDocument } from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";
import {
  documentCategories,
  formatBytes,
  maxUploadBytes,
  normalizeUploadFile,
  uploadAccept,
} from "../model";
import { label } from "../../applications/model";

type Item = {
  id: string;
  file: File;
  category: string;
  status: "queued" | "uploading" | "done" | "error" | "rejected";
  percent: number;
  error?: string;
};

/** ponytail: 3 is enough to saturate a normal connection; raise if uploads queue visibly. */
const CONCURRENCY = 3;

let counter = 0;
const nextId = () => `upload-${++counter}`;

async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
) {
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) await worker(items[cursor++]);
    }),
  );
}

export function UploadDialog({
  onClose,
  initialFiles,
}: {
  onClose: () => void;
  initialFiles?: File[];
}) {
  const qc = useQueryClient();
  const [items, setItems] = useState<Item[]>([]);
  const [category, setCategory] = useState<string>(documentCategories[0]);
  const [tagsText, setTagsText] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const seeded = useRef(false);

  const patch = (id: string, changes: Partial<Item>) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );

  /**
   * `FileList` and `DataTransfer` are live views that the browser empties as soon
   * as the event handler returns (and `input.value = ""` clears them outright), so
   * the array MUST be materialised here rather than inside the state updater —
   * React runs updaters later, by which point the list is empty. That was the
   * "sometimes my selection is ignored" bug.
   */
  const addFiles = (list: FileList | File[] | null | undefined) => {
    if (!list) return;
    const incoming = Array.from(list);
    if (!incoming.length) return;
    setItems((current) => {
      const seen = new Set(
        current.map((item) => `${item.file.name}:${item.file.size}`),
      );
      const additions: Item[] = [];
      for (const raw of incoming) {
        const key = `${raw.name}:${raw.size}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const normalized = normalizeUploadFile(raw);
        const reason = !normalized
          ? "Unsupported file type — use PDF, DOCX, JPG or PNG."
          : raw.size > maxUploadBytes
            ? `Too large — the limit is ${formatBytes(maxUploadBytes)}.`
            : raw.size === 0
              ? "This file is empty."
              : null;
        additions.push(
          reason
            ? {
                id: nextId(),
                file: raw,
                category,
                status: "rejected",
                percent: 0,
                error: reason,
              }
            : {
                id: nextId(),
                file: normalized!,
                category,
                status: "queued",
                percent: 0,
              },
        );
      }
      return additions.length ? [...current, ...additions] : current;
    });
  };

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    if (initialFiles?.length) addFiles(initialFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !uploading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [uploading, onClose]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const counts = useMemo(() => {
    const uploadable = items.filter((item) => item.status !== "rejected");
    return {
      total: items.length,
      uploadable: uploadable.length,
      pending: uploadable.filter(
        (item) => item.status === "queued" || item.status === "error",
      ).length,
      done: items.filter((item) => item.status === "done").length,
      failed: items.filter((item) => item.status === "error").length,
      rejected: items.filter((item) => item.status === "rejected").length,
    };
  }, [items]);

  const overallPercent = counts.uploadable
    ? Math.round(
        items
          .filter((item) => item.status !== "rejected")
          .reduce(
            (sum, item) => sum + (item.status === "done" ? 100 : item.percent),
            0,
          ) / counts.uploadable,
      )
    : 0;

  async function upload() {
    if (uploading) return;
    const queue = items.filter(
      (item) => item.status === "queued" || item.status === "error",
    );
    if (!queue.length) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setUploading(true);

    const tags = tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    await runPool(queue, CONCURRENCY, async (item) => {
      if (controller.signal.aborted) return;
      patch(item.id, { status: "uploading", percent: 0, error: undefined });
      try {
        await uploadAcademicDocument(item.file, item.category, controller.signal, {
          tags,
          expiresAt: expiresAt || null,
          onProgress: (percent) => patch(item.id, { percent: Math.round(percent) }),
        });
        patch(item.id, { status: "done", percent: 100 });
      } catch (error) {
        patch(item.id, {
          status: "error",
          percent: 0,
          error:
            error instanceof Error && error.message
              ? error.message
              : "Upload failed. Try again.",
        });
      }
    });

    abortRef.current = null;
    setUploading(false);
    void Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.documents }),
      qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ]);
  }

  const allDone = counts.uploadable > 0 && counts.done === counts.uploadable;

  return (
    <div
      className="apps-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !uploading) onClose();
      }}
    >
      <section
        className="apps-dialog docs-upload-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
      >
        <header>
          <div className="docs-upload-heading">
            <h2 id="upload-title">Upload documents</h2>
            <p>Add several files at once — they share the details you set below.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" disabled={uploading}>
            <X aria-hidden="true" />
          </button>
        </header>

        <div
          className={`docs-dropzone${dragOver ? " is-drag-over" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node))
              setDragOver(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            addFiles(event.dataTransfer.files);
          }}
        >
          <span className="docs-dropzone-icon" aria-hidden="true">
            <UploadCloud />
          </span>
          <p>
            Drag files here, or{" "}
            <button type="button" onClick={() => inputRef.current?.click()}>
              browse your device
            </button>
          </p>
          <small>
            PDF, DOCX, JPG or PNG · up to {formatBytes(maxUploadBytes)} each
          </small>
          <input
            ref={inputRef}
            hidden
            type="file"
            multiple
            accept={uploadAccept}
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>

        {items.length ? (
          <div className="docs-upload-queue">
            <div className="docs-upload-queue-head">
              <h3>
                {counts.total} file{counts.total === 1 ? "" : "s"} selected
              </h3>
              <button
                type="button"
                className="docs-upload-clear"
                onClick={() => setItems([])}
                disabled={uploading}
              >
                Clear all
              </button>
            </div>

            <ul className="docs-upload-list">
              {items.map((item) => {
                const Icon = item.file.type.startsWith("image/") ? FileImage : FileText;
                return (
                  <li key={item.id} className={`is-${item.status}`}>
                    <Icon aria-hidden="true" className="docs-upload-icon" />
                    <div className="docs-upload-main">
                      <span className="docs-upload-name" title={item.file.name}>
                        {item.file.name}
                      </span>
                      <span className="docs-upload-meta">
                        {formatBytes(item.file.size)}
                        {item.error ? ` · ${item.error}` : ""}
                      </span>
                      {item.status === "uploading" ? (
                        <span className="docs-upload-track" aria-hidden="true">
                          <span
                            style={{ "--fill": item.percent / 100 } as CSSProperties}
                          />
                        </span>
                      ) : null}
                    </div>

                    {item.status === "rejected" ? null : (
                      <Select
                        className="docs-upload-type"
                        ariaLabel={`Document type for ${item.file.name}`}
                        value={item.category}
                        disabled={uploading || item.status === "done"}
                        onChange={(val: any) =>
                          patch(item.id, {
                            category:
                              typeof val === "string" ? val : (val?.target?.value ?? ""),
                          })
                        }
                        options={documentCategories.map((option) => ({
                          value: option,
                          label: label(option),
                        }))}
                      />
                    )}

                    <span className="docs-upload-status">
                      {item.status === "uploading" ? (
                        <>
                          <Loader2 aria-hidden="true" className="apps-spin" />
                          <span>{item.percent}%</span>
                        </>
                      ) : item.status === "done" ? (
                        <CheckCircle2 aria-hidden="true" className="docs-upload-ok" />
                      ) : item.status === "error" || item.status === "rejected" ? (
                        <AlertCircle aria-hidden="true" className="docs-upload-bad" />
                      ) : null}
                    </span>

                    {item.status === "uploading" || item.status === "done" ? null : (
                      <button
                        type="button"
                        className="docs-upload-remove"
                        aria-label={`Remove ${item.file.name}`}
                        onClick={() =>
                          setItems((current) =>
                            current.filter((entry) => entry.id !== item.id),
                          )
                        }
                        disabled={uploading}
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="docs-upload-defaults">
          <h3>Applied to every file</h3>
          <div className="form-grid">
            <label>
              Document type
              <Select
                value={category}
                disabled={uploading}
                onChange={(val: any) => {
                  const next =
                    typeof val === "string" ? val : (val?.target?.value ?? "");
                  setCategory(next);
                  setItems((current) =>
                    current.map((item) =>
                      item.status === "queued" || item.status === "error"
                        ? { ...item, category: next }
                        : item,
                    ),
                  );
                }}
                options={documentCategories.map((item) => ({
                  value: item,
                  label: label(item),
                }))}
              />
            </label>
            <label>
              Expiration date
              <input
                type="date"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                disabled={uploading}
              />
            </label>
            <label className="wide">
              Tags
              <input
                value={tagsText}
                onChange={(event) => setTagsText(event.target.value)}
                placeholder="UK, 2026 intake"
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        <footer className="docs-upload-footer">
          <p className="docs-upload-summary" role="status">
            {uploading
              ? `Uploading ${Math.min(counts.done + 1, counts.uploadable)} of ${counts.uploadable} · ${overallPercent}%`
              : allDone
                ? `All ${counts.done} document${counts.done === 1 ? "" : "s"} uploaded.`
                : counts.failed
                  ? `${counts.failed} upload${counts.failed === 1 ? "" : "s"} failed — retry below.`
                  : counts.rejected
                    ? `${counts.rejected} file${counts.rejected === 1 ? "" : "s"} can’t be uploaded.`
                    : counts.pending
                      ? `Ready to upload ${counts.pending} file${counts.pending === 1 ? "" : "s"}.`
                      : "No files selected yet."}
          </p>
          <div className="dialog-actions">
            {uploading ? (
              <button type="button" onClick={() => abortRef.current?.abort()}>
                Cancel uploads
              </button>
            ) : (
              <button type="button" onClick={onClose}>
                {allDone ? "Done" : "Cancel"}
              </button>
            )}
            {allDone ? null : (
              <button
                className="primary"
                type="button"
                disabled={!counts.pending || uploading}
                onClick={upload}
              >
                {counts.failed ? (
                  <>
                    <RotateCcw aria-hidden="true" /> Retry failed
                  </>
                ) : (
                  `Upload ${counts.pending || ""} file${counts.pending === 1 ? "" : "s"}`
                )}
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}
