import { useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useApplicationReadiness, useDismiss } from "../hooks";
import { label, type ApplicationReadinessSummary } from "../model";

/**
 * Compact readiness indicator for a single application. The ring and
 * percentage use the readiness summary already embedded in the applications
 * list/board response — free. The detailed issue list (blocking issues,
 * missing documents, warnings) isn't in that summary, so it's fetched only
 * when the user actually opens the popover, not eagerly for every row.
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

  const readinessQuery = useApplicationReadiness(appId, open);

  useDismiss([rootRef], () => setOpen(false), open);

  const readiness_percent =
    readinessQuery.data?.readiness_percent !== undefined
      ? readinessQuery.data.readiness_percent
      : (readinessData?.overall_score ?? readinessPercent ?? 0);

  const overall_state =
    readinessQuery.data?.overall_state ??
    readinessData?.overall_state ??
    (readiness_percent >= 80 ? "ready" : readiness_percent >= 40 ? "in_progress" : "not_ready");

  const blocking_issues = readinessQuery.data?.blocking_issues ?? [];
  const missing_required_documents = readinessQuery.data?.missing_required_documents ?? [];
  const warnings = readinessQuery.data?.warnings ?? [];
  const issues = [...blocking_issues, ...missing_required_documents, ...warnings];
  const needsAttention = overall_state === "blocked" || overall_state === "not_ready";
  const hasEmbeddedData = readinessPercent !== undefined || Boolean(readinessData);
  const isLoading = !hasEmbeddedData && open && readinessQuery.isPending;

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
        aria-label={`${readiness_percent}% ready, ${label(overall_state)}. ${needsAttention ? "Show missing items" : ""}`}
        onClick={() => needsAttention && setOpen((v) => !v)}
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
      {open ? (
        <div className="apps-readiness-popover" role="dialog" aria-label="Missing items">
          <strong>{label(overall_state)}</strong>
          {readinessQuery.isPending ? (
            <p>Checking…</p>
          ) : issues.length ? (
            <ul>
              {issues.slice(0, 5).map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
