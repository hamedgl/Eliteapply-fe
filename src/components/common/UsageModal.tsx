import { X, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { usageApi } from "../../lib/api/phase3";
import { queryKeys } from "../../lib/api/queryKeys";

export function UsageModal({
  entityType,
  entityId,
  entityTitle,
  open,
  onClose,
}: {
  entityType: string;
  entityId: string;
  entityTitle?: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <UsageContent
      entityType={entityType}
      entityId={entityId}
      entityTitle={entityTitle}
      onClose={onClose}
    />
  );
}

function UsageContent({
  entityType,
  entityId,
  entityTitle,
  onClose,
}: {
  entityType: string;
  entityId: string;
  entityTitle?: string;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: queryKeys.entityUsage(entityType, entityId),
    queryFn: () => usageApi.get(entityType, entityId),
  });

  const data = query.data;
  const usages = data?.usages ?? [];

  const getTargetUrl = (type: string, id: string) => {
    switch (type) {
      case "application":
        return `/app/applications/${id}`;
      case "story":
        return `/app/stories?id=${id}`;
      case "document":
        return `/app/documents/${id}`;
      default:
        return `/app/dashboard`;
    }
  };

  return (
    <div className="apps-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="apps-dialog"
        role="dialog"
        aria-labelledby="usage-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="apps-dialog-header">
          <h2 id="usage-modal-title">Entity Relationships & Usages</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="apps-dialog-body">
          <p className="apps-dialog-subtext">
            References for <strong>{entityTitle || `${entityType} (${entityId.slice(0, 8)})`}</strong>
          </p>
          {query.isPending ? (
            <div className="apps-column-empty">Loading usage relationships…</div>
          ) : query.isError ? (
            <div className="apps-notice is-danger">Failed to load entity usage relationships.</div>
          ) : !usages.length ? (
            <div className="apps-column-empty">No cross-cutting references found.</div>
          ) : (
            <ul className="docs-history-list">
              {usages.map((usage, idx) => (
                <li key={idx} className="docs-history-item usage-modal-item">
                  <div className="docs-history-details">
                    <div className="usage-modal-row">
                      <strong>{usage.title || `${usage.target_entity_type} ID: ${usage.target_entity_id.slice(0, 8)}`}</strong>
                      <Link
                        to={getTargetUrl(usage.target_entity_type, usage.target_entity_id)}
                        onClick={onClose}
                        className="apps-chip"
                      >
                        Open <ExternalLink aria-hidden="true" />
                      </Link>
                    </div>
                    <small>
                      Type: {usage.usage_type.replaceAll("_", " ")} ({usage.target_entity_type})
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="apps-dialog-footer">
          <button type="button" className="primary" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
