import { X, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { documentsApi } from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";
import { formatDate, label } from "../../applications/model";
import type { AcademicDocument } from "../model";

export function DocumentActivityDrawer({
  doc,
  open,
  onClose,
}: {
  doc: AcademicDocument | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !doc) return null;
  return <ActivityContent doc={doc} onClose={onClose} />;
}

function ActivityContent({
  doc,
  onClose,
}: {
  doc: AcademicDocument;
  onClose: () => void;
}) {
  const activityQuery = useQuery({
    queryKey: queryKeys.documentActivity(doc.id),
    queryFn: () => documentsApi.activity(doc.id),
  });

  const events = activityQuery.data ?? [];

  return (
    <div className="apps-drawer-backdrop" role="presentation" onClick={onClose}>
      <section
        className="apps-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="apps-drawer-header">
          <h2 id="activity-drawer-title">Audit Activity Log</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="apps-drawer-body">
          <p className="apps-dialog-subtext">
            Audit log for <strong>{doc.display_name}</strong>
          </p>
          {activityQuery.isPending ? (
            <div className="apps-column-empty">Loading audit activity log…</div>
          ) : !events.length ? (
            <div className="apps-column-empty">No activity recorded yet.</div>
          ) : (
            <ul className="docs-history-list">
              {events.map((evt) => (
                <li key={evt.id} className="docs-history-item">
                  <div className="docs-history-badge">
                    <Activity aria-hidden="true" size={14} />
                  </div>
                  <div className="docs-history-details">
                    <strong>{label(evt.event_type)}</strong>
                    <small>{formatDate(evt.created_at)}</small>
                    {evt.event_metadata && Object.keys(evt.event_metadata).length > 0 ? (
                      <pre className="docs-event-meta">
                        {JSON.stringify(evt.event_metadata, null, 2)}
                      </pre>
                    ) : null}
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
