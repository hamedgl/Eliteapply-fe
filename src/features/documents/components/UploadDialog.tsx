import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { uploadAcademicDocument } from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";
import { documentCategories, formatBytes } from "../model";
import { label } from "../../applications/model";

type FileState = {
  file: File;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

const ACCEPTED = ".pdf,.docx,.jpg,.jpeg,.png";

export function UploadDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [files, setFiles] = useState<FileState[]>([]);
  const [category, setCategory] = useState<string>(documentCategories[0]);
  const [tagsText, setTagsText] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((current) => [
      ...current,
      ...Array.from(list).map((file) => ({ file, status: "queued" as const })),
    ]);
  };

  async function upload() {
    if (!files.length || uploading) return;
    setUploading(true);
    const tags = tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "done") continue;
      setFiles((current) =>
        current.map((f, idx) => (idx === i ? { ...f, status: "uploading" } : f)),
      );
      try {
        await uploadAcademicDocument(files[i].file, category, undefined, {
          tags,
          expiresAt: expiresAt || null,
        });
        setFiles((current) =>
          current.map((f, idx) => (idx === i ? { ...f, status: "done" } : f)),
        );
      } catch (error) {
        setFiles((current) =>
          current.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "error",
                  error: error instanceof Error ? error.message : "Upload failed.",
                }
              : f,
          ),
        );
      }
    }
    setUploading(false);
    void Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.documents }),
      qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ]);
  }

  const allDone = files.length > 0 && files.every((f) => f.status === "done");

  return (
    <div className="apps-dialog-backdrop" role="presentation">
      <section
        className="apps-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
      >
        <header>
          <h2 id="upload-title">Upload document</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>

        <div
          className={`docs-dropzone${dragOver ? " is-drag-over" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            addFiles(event.dataTransfer.files);
          }}
        >
          <Upload aria-hidden="true" />
          <p>Drag files here, or</p>
          <button type="button" onClick={() => inputRef.current?.click()}>
            Choose files
          </button>
          <input
            ref={inputRef}
            hidden
            type="file"
            multiple
            accept={ACCEPTED}
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <small>PDF, DOCX, JPG or PNG</small>
        </div>

        {files.length ? (
          <ul className="docs-upload-list">
            {files.map((item, index) => (
              <li key={index}>
                <span className="docs-upload-name">{item.file.name}</span>
                <span className="docs-upload-size">{formatBytes(item.file.size)}</span>
                {item.status === "uploading" ? (
                  <Loader2 aria-hidden="true" className="apps-spin" />
                ) : item.status === "done" ? (
                  <CheckCircle2 aria-hidden="true" className="docs-upload-ok" />
                ) : item.status === "error" ? (
                  <span className="docs-upload-error" title={item.error}>
                    <AlertCircle aria-hidden="true" /> Failed
                  </span>
                ) : (
                  <button
                    type="button"
                    aria-label={`Remove ${item.file.name}`}
                    onClick={() =>
                      setFiles((current) => current.filter((_, i) => i !== index))
                    }
                    disabled={uploading}
                  >
                    <X aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="form-grid">
          <label>
            Document type
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              disabled={uploading}
            >
              {documentCategories.map((item) => (
                <option value={item} key={item}>
                  {label(item)}
                </option>
              ))}
            </select>
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

        <div className="dialog-actions">
          <button type="button" onClick={onClose}>
            {allDone ? "Done" : "Cancel"}
          </button>
          {!allDone ? (
            <button
              className="primary"
              type="button"
              disabled={!files.length || uploading}
              onClick={upload}
            >
              {uploading
                ? "Uploading…"
                : `Upload ${files.length || ""} document${files.length === 1 ? "" : "s"}`}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
