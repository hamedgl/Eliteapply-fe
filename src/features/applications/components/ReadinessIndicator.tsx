import { useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useApplicationReadiness, useDismiss } from "../hooks";
import { label, type ApplicationReadinessSummary } from "../model";

/**
 * Compact readiness indicator for a single application. The percent/state
 * come from the embedded list-row summary (no network call); the detail
 * breakdown (blocking issues, missing docs, warnings) is only on the full
 * readiness endpoint, so that's still fetched lazily on open/hover.
 */
export function ReadinessIndicator({
  appId,
  readinessPercent,
  readinessData,
}: {
  appId: string;
  readinessPercent?: number | null;
  readinessData?: ApplicationReadinessSummary | null;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const readinessQuery = useApplicationReadiness(
    appId,
    open || (readinessPercent === undefined && !readinessData),
  );
  useDismiss([rootRef], () => setOpen(false), open);

  const hasEmbeddedData = readinessPercent !== undefined || Boolean(readinessData);
  const isLoading = !hasEmbeddedData && readinessQuery.isPending;

  const readiness_percent =
    readinessPercent ??
    readinessData?.overall_score ??
    readinessQuery.data?.readiness_percent ??
    0;

  const overall_state =
    readinessData?.overall_state ??
    readinessQuery.data?.overall_state ??
    (readiness_percent >= 80 ? "ready" : readiness_percent >= 40 ? "in_progress" : "not_ready");

  const blocking_issues = readinessQuery.data?.blocking_issues ?? [];
  const missing_required_documents = readinessQuery.data?.missing_required_documents ?? [];
  const warnings = readinessQuery.data?.warnings ?? [];
  const issues = [...blocking_issues, ...missing_required_documents, ...warnings];
  const needsAttention = overall_state === "blocked" || overall_state === "not_ready";

  if (isLoading)
    return (
      <span className="apps-readiness apps-readiness-loading">
        <Loader2 aria-hidden="true" className="apps-spin" />
      </span>
    );

  return (
    <div className="apps-readiness-wrap" ref={rootRef}>
      <button
        type="button"
        className={`apps-readiness apps-readiness-${overall_state}`}
        aria-expanded={open}
        aria-label={`${readiness_percent}% ready, ${label(overall_state)}. ${issues.length ? "Show missing items" : ""}`}
        onClick={() => issues.length && setOpen((v) => !v)}
      >
        <svg viewBox="0 0 32 32" className="apps-readiness-ring" aria-hidden="true">
          <circle cx="16" cy="16" r="13" className="apps-readiness-ring-track" />
          <circle
            cx="16"
            cy="16"
            r="13"
            className="apps-readiness-ring-value"
            style={{
              strokeDasharray: `${(readiness_percent / 100) * 81.68} 81.68`,
            }}
          />
        </svg>
        <span>
          {needsAttention ? (
            <AlertTriangle aria-hidden="true" className="apps-readiness-warn-icon" />
          ) : null}
          {readiness_percent}%
        </span>
      </button>
      {open && issues.length ? (
        <div className="apps-readiness-popover" role="dialog" aria-label="Missing items">
          <strong>{label(overall_state)}</strong>
          <ul>
            {issues.slice(0, 5).map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
