import { useState } from "react";
import { X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Select } from "../../../components/ui/select";
import { documentsApi } from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";
import { documentCategories, type AcademicDocument } from "../model";

export function EditMetadataDialog({
  doc,
  open,
  onClose,
}: {
  doc: AcademicDocument | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !doc) return null;
  return <EditForm doc={doc} onClose={onClose} />;
}

function EditForm({
  doc,
  onClose,
}: {
  doc: AcademicDocument;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState(doc.display_name);
  const [category, setCategory] = useState(doc.category);
  const [tagsInput, setTagsInput] = useState((doc.tags ?? []).join(", "));
  const [expiresAt, setExpiresAt] = useState(
    doc.expires_at ? doc.expires_at.slice(0, 10) : "",
  );
  const [error, setError] = useState("");

  const update = useMutation({
    mutationFn: () => {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      return documentsApi.update(doc.id, {
        display_name: displayName,
        category,
        tags,
        expires_at: expiresAt ? `${expiresAt}T23:59:59Z` : null,
      });
    },
    onSuccess: () => {
      void Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.documents }),
        qc.invalidateQueries({ queryKey: queryKeys.document(doc.id) }),
      ]);
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to update document metadata");
    },
  });

  return (
    <div className="apps-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="apps-dialog"
        role="dialog"
        aria-labelledby="edit-doc-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="apps-dialog-header">
          <h2 id="edit-doc-title">Edit Document Metadata</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            update.mutate();
          }}
        >
          <div className="apps-dialog-body">
            {error ? <div className="apps-notice is-danger">{error}</div> : null}
            <label>
              Display name
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
            <label>
              Category
              <Select
                value={category}
                onChange={(val: any) => setCategory(typeof val === "string" ? val : (val?.target?.value ?? ""))}
                options={documentCategories.map((cat) => ({
                  value: cat,
                  label: cat.replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase()),
                }))}
              />
            </label>
            <label>
              Tags (comma-separated)
              <input
                type="text"
                placeholder="academic, transcript, verified"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </label>
            <label>
              Expires at
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </label>
          </div>
          <footer className="apps-dialog-footer">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="primary"
              disabled={update.isPending}
            >
              {update.isPending ? "Saving…" : "Save Changes"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
