import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { documentsApi } from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";
import { formatDate } from "../../applications/model";
import { formatBytes, type AcademicDocument } from "../model";

export function DocumentVersionsDrawer({
  doc,
  open,
  onClose,
}: {
  doc: AcademicDocument | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !doc) return null;
  return <VersionsContent doc={doc} onClose={onClose} />;
}

function VersionsContent({
  doc,
  onClose,
}: {
  doc: AcademicDocument;
  onClose: () => void;
}) {
  const versionsQuery = useQuery({
    queryKey: queryKeys.documentVersions(doc.id),
    queryFn: () => documentsApi.versions(doc.id),
  });

  const versions = versionsQuery.data ?? [];

  return (
    <div className="apps-drawer-backdrop" role="presentation" onClick={onClose}>
      <section
        className="apps-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="versions-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="apps-drawer-header">
          <h2 id="versions-drawer-title">Version History</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="apps-drawer-body">
          <p className="apps-dialog-subtext">
            Version history for <strong>{doc.display_name}</strong>
          </p>
          {versionsQuery.isPending ? (
            <div className="apps-column-empty">Loading version history…</div>
          ) : !versions.length ? (
            <div className="apps-column-empty">No previous versions found.</div>
          ) : (
            <ul className="docs-history-list">
              {versions.map((ver) => (
                <li key={ver.id} className="docs-history-item">
                  <div className="docs-history-badge">v{ver.version_number}</div>
                  <div className="docs-history-details">
                    <strong>
                      Version {ver.version_number} {ver.version_number === doc.version ? "(Current)" : ""}
                    </strong>
                    <span>
                      {formatBytes(ver.size_bytes)} · {ver.content_type}
                    </span>
                    <small>Uploaded {formatDate(ver.created_at)}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="apps-drawer-footer">
          <button type="button" className="primary" onClick={onClose}>
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}
