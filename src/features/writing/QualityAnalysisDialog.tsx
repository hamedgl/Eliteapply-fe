import { useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle2, Info, Quote, Wand2, X } from "lucide-react";
import { ProgressBar } from "../../components/data-display/ProgressBar";
import { StatusBadge, type BadgeTone } from "../../components/data-display/StatusBadge";
import type { components } from "../../generated/api/schema";

type S = components["schemas"];
type Analysis = S["QualityAnalysisResponse"];
type Severity = S["QualityAnalysisFinding"]["severity"];

const SEVERITY_STYLES: Record<
  NonNullable<Severity>,
  { tone: BadgeTone; icon: typeof Info; label: string }
> = {
  critical: { tone: "red", icon: AlertTriangle, label: "Critical" },
  high: { tone: "red", icon: AlertTriangle, label: "High" },
  medium: { tone: "amber", icon: AlertTriangle, label: "Medium" },
  low: { tone: "blue", icon: Info, label: "Low" },
  info: { tone: "neutral", icon: CheckCircle2, label: "Info" },
};

const severityStyle = (severity: Severity) =>
  SEVERITY_STYLES[severity ?? "medium"] ?? SEVERITY_STYLES.medium;

function humanKey(key: string) {
  return key
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function Finding({ finding }: { finding: S["QualityAnalysisFinding"] }) {
  const { tone, icon: Icon, label } = severityStyle(finding.severity);
  return (
    <li className="writing-quality-item">
      <div className="writing-quality-item-head">
        <h4>{finding.title}</h4>
        <StatusBadge tone={tone} icon={Icon}>
          {label}
        </StatusBadge>
      </div>
      <p>{finding.detail}</p>
      {finding.excerpt ? (
        <blockquote>
          <Quote aria-hidden="true" />
          <span>{finding.excerpt}</span>
        </blockquote>
      ) : null}
      <p className="writing-quality-fix">
        <Wand2 aria-hidden="true" />
        <span>{finding.suggestion}</span>
      </p>
      <p className="writing-quality-meta">
        {humanKey(finding.category ?? "general")}
        {finding.location
          ? ` · Paragraph ${finding.location.paragraph}`
          : null}
      </p>
    </li>
  );
}

function ClaimWarning({
  warning,
}: {
  warning: S["QualityAnalysisClaimWarning"];
}) {
  const { tone, icon: Icon, label } = severityStyle(warning.severity);
  return (
    <li className="writing-quality-item">
      <div className="writing-quality-item-head">
        <h4>{warning.claim}</h4>
        <StatusBadge tone={tone} icon={Icon}>
          {label}
        </StatusBadge>
      </div>
      <p>{warning.reason}</p>
      {warning.suggested_evidence_type ? (
        <p className="writing-quality-fix">
          <Wand2 aria-hidden="true" />
          <span>
            Back this up with {humanKey(warning.suggested_evidence_type)}.
          </span>
        </p>
      ) : null}
    </li>
  );
}

function Section({
  title,
  count,
  emptyLabel,
  children,
}: {
  title: string;
  count: number;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="writing-quality-section">
      <h3>
        {title} <span>({count})</span>
      </h3>
      {count ? (
        <ul className="writing-quality-list">{children}</ul>
      ) : (
        <p className="apps-dialog-subtext">{emptyLabel}</p>
      )}
    </section>
  );
}

/** Readable view of one quality analysis: scores as bars, findings and claim warnings as cards. */
export function QualityAnalysisDialog({
  analysis,
  onClose,
}: {
  analysis: Analysis;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialogRef.current;
    if (node && !node.open) node.showModal();
  }, []);

  const scores = analysis.scores ?? [];
  const findings = analysis.findings ?? [];
  const claims = analysis.claim_warnings ?? [];

  return (
    <dialog
      ref={dialogRef}
      className="apps-dialog writing-quality-dialog"
      aria-labelledby="quality-analysis-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header>
        <div>
          <h2 id="quality-analysis-title">Quality analysis</h2>
          <p className="apps-dialog-subtext">
            {new Intl.DateTimeFormat(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(analysis.created_at))}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close">
          <X aria-hidden="true" />
        </button>
      </header>
      <div className="apps-dialog-body">
        {scores.length ? (
          <section className="writing-quality-section">
            <h3>Scores</h3>
            <div className="writing-quality-scores">
              {scores.map((score) => {
                const max = score.max || 100;
                return (
                  <div key={score.key} className="writing-quality-score">
                    <span className="writing-quality-score-name">
                      {score.label}
                    </span>
                    <ProgressBar
                      percent={(score.value / max) * 100}
                      label={`${score.label} score`}
                    />
                    {max === 100 ? null : (
                      <span className="writing-quality-score-caption">
                        {score.value} / {max}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
        <Section
          title="Findings"
          count={findings.length}
          emptyLabel="No issues were flagged in this pass."
        >
          {findings.map((finding, index) => (
            <Finding key={finding.id ?? index} finding={finding} />
          ))}
        </Section>
        <Section
          title="Claim warnings"
          count={claims.length}
          emptyLabel="No claims needed evidence review."
        >
          {claims.map((warning, index) => (
            <ClaimWarning key={warning.id ?? index} warning={warning} />
          ))}
        </Section>
      </div>
      <div className="apps-dialog-footer">
        <p className="apps-dialog-subtext writing-quality-disclaimer">
          Guidance only — not an admission guarantee.
        </p>
        <button type="button" className="primary" onClick={onClose}>
          Close
        </button>
      </div>
    </dialog>
  );
}
