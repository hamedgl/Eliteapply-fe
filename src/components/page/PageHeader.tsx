import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { WorkspacePageGuideButton } from "../AppShell";

export function PageRefreshButton({
  onRefresh,
  refreshing = false,
}: {
  onRefresh: () => void;
  refreshing?: boolean;
}) {
  return (
    <button
      className="apps-icon-button"
      type="button"
      aria-label={refreshing ? "Refreshing page data" : "Refresh page data"}
      title={refreshing ? "Refreshing…" : "Refresh"}
      disabled={refreshing}
      onClick={onRefresh}
    >
      <RefreshCw className={refreshing ? "apps-spin" : ""} aria-hidden="true" />
    </button>
  );
}

/** Shared page header: optional eyebrow, title, one-line description, optional metadata, actions on the right. */
export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  onRefresh,
  refreshing = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <header className="apps-header">
      <div>
        {eyebrow ? <p className="apps-header-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
        {meta ? <span className="apps-header-count">{meta}</span> : null}
      </div>
      <div className="apps-header-actions">
        {onRefresh ? (
          <PageRefreshButton onRefresh={onRefresh} refreshing={refreshing} />
        ) : null}
        <WorkspacePageGuideButton />
        {actions}
      </div>
    </header>
  );
}
