import { useState } from "react";
import { X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "../../../lib/api/phase2";
import { uploadToSignedUrl } from "../../../lib/api/signedTransport";
import { queryKeys } from "../../../lib/api/queryKeys";
import type { AcademicDocument } from "../model";

export function ReplaceVersionDialog({
  doc,
  open,
  onClose,
}: {
  doc: AcademicDocument | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !doc) return null;
  return <ReplaceForm doc={doc} onClose={onClose} />;
}

function ReplaceForm({
  doc,
  onClose,
}: {
  doc: AcademicDocument;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const replace = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Please select a file to upload.");
      setStatus("Obtaining upload URL…");
      const signed = await documentsApi.uploadUrl({
        filename: file.name,
        content_type: file.type as
          | "application/pdf"
          | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          | "image/jpeg"
          | "image/png",
      });

      setStatus("Uploading new file version…");
      await uploadToSignedUrl({
        uploadUrl: signed.upload_url,
        method: signed.upload_method,
        fields: signed.upload_fields,
        file,
        contentType: file.type,
        maxSizeBytes: signed.max_size_bytes,
      });

      setStatus("Registering new version…");
      return documentsApi.replace(doc.id, {
        storage_key: signed.storage_key,
        display_name: file.name,
        content_type: file.type,
        size_bytes: file.size,
        reason: reason || undefined,
      });
    },
    onSuccess: () => {
      void Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.documents }),
        qc.invalidateQueries({ queryKey: queryKeys.document(doc.id) }),
        qc.invalidateQueries({ queryKey: queryKeys.documentVersions(doc.id) }),
        qc.invalidateQueries({ queryKey: queryKeys.documentActivity(doc.id) }),
      ]);
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to upload new document version.");
      setStatus("");
    },
  });

  return (
    <div className="apps-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="apps-dialog"
        role="dialog"
        aria-labelledby="replace-version-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="apps-dialog-header">
          <h2 id="replace-version-title">Upload New File Version</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            replace.mutate();
          }}
        >
          <div className="apps-dialog-body">
            {error ? <div className="apps-notice is-danger">{error}</div> : null}
            <p className="apps-dialog-subtext">
              Replacing <strong>{doc.display_name}</strong> will create version{" "}
              <strong>v{doc.version + 1}</strong>.
            </p>
            <label>
              Select replacement file
              <input
                type="file"
                required
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <label>
              Reason for replacement (optional)
              <input
                type="text"
                placeholder="Updated transcript with final semester grades"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            {status ? (
              <div className="apps-notice is-info">{status}</div>
            ) : null}
          </div>
          <footer className="apps-dialog-footer">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="primary"
              disabled={!file || replace.isPending}
            >
              {replace.isPending ? "Uploading…" : "Upload Version"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
