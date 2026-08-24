import { useEffect, useRef } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  FilePlus2,
  FileText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  Link,
} from "react-router-dom";
import {
  intelligenceApi,
} from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";
import { newMutationId } from "../../../lib/api/mutations";
import { EmptyState } from "../../../components/data-display/EmptyState";
import { ProgressBar } from "../../../components/data-display/ProgressBar";
import { StatusBadge } from "../../../components/data-display/StatusBadge";
import {
  formatDate,
  label,
} from "../model";
import type { components } from "../../../generated/api/schema";
import "../../../styles/workspace.css";
import {
  EligibilitySkeleton,
  ResourceHeader,
  InlineError,
  readableError,
  formatDateTime,
  Definition,
  ResourceRowsSkeleton,
  IssueList,
} from "./applicationWorkspaceShared";


type S = components["schemas"];

type NormalFinding = {
  id: string;
  title: string;
  status: string;
  evidence: string;
  explanation: string;
  nextAction: string;
};



export function EligibilityTab({
  applicationId,
  onToast,
}: {
  applicationId: string;
  onToast: (message: string) => void;
}) {
  const qc = useQueryClient();
  const upgradedMissingAnalysis = useRef(false);
  const current = useQuery({
    queryKey: queryKeys.eligibility(applicationId),
    queryFn: () => intelligenceApi.currentEligibility(applicationId),
    retry: false,
  });
  const history = useQuery({
    queryKey: queryKeys.eligibilityHistory(applicationId),
    queryFn: () => intelligenceApi.eligibilityHistory(applicationId),
  });
  const refresh = useMutation({
    mutationFn: () =>
      intelligenceApi.recalculateEligibility(applicationId, {
        mutation_id: newMutationId(),
      }),
    onSuccess: async (value) => {
      qc.setQueryData(queryKeys.eligibility(applicationId), value);
      onToast("Eligibility analysis refreshed.");
      await Promise.all([
        qc.invalidateQueries({
          queryKey: queryKeys.eligibilityHistory(applicationId),
        }),
        qc.invalidateQueries({ queryKey: queryKeys.readiness(applicationId) }),
      ]);
    },
  });
  const recommendations = useMutation({
    mutationFn: () =>
      intelligenceApi.eligibilityRecommendations(applicationId),
    onSuccess: () => onToast("Recommendations are ready."),
  });
  useEffect(() => {
    if (
      upgradedMissingAnalysis.current ||
      !isEligibilityResponse(current.data) ||
      !current.data.findings.some(
        (finding) => finding.id === "official-criteria-missing",
      )
    )
      return;
    upgradedMissingAnalysis.current = true;
    refresh.mutate();
  }, [current.data, refresh]);
  if (current.isPending) return <EligibilitySkeleton />;
  if (current.isError || !isEligibilityResponse(current.data))
    return (
      <section className="detail-section">
        <ResourceHeader
          title="Eligibility"
          description="Review evidence used to support application preparation."
          actions={
            <>
              <Link
                className="detail-secondary-link"
                to={`/app/applications/import?application_id=${encodeURIComponent(applicationId)}#missing-eligibility-details`}
              >
                <FilePlus2 aria-hidden="true" /> Add missing data
              </Link>
              <button
                type="button"
                className="primary"
                disabled={refresh.isPending}
                onClick={() => refresh.mutate()}
              >
                <ShieldCheck aria-hidden="true" />{" "}
                {refresh.isPending ? "Analysing…" : "Refresh analysis"}
              </button>
            </>
          }
        />
        <EmptyState
          icon={ShieldCheck}
          heading="No eligibility analysis yet"
          description="Refresh the analysis to review available profile and application evidence."
          primaryAction={{
            label: "Refresh analysis",
            onClick: () => refresh.mutate(),
          }}
        />
        {refresh.error ? (
          <InlineError message={readableError(refresh.error)} />
        ) : null}
      </section>
    );
  const result = current.data;
  const historyItems = Array.isArray(history.data?.items)
    ? history.data.items
    : [];
  const findings = result.findings.map(normalizeFinding);
  const status = label(result.overall_status);
  const sources = result.data_sources;
  const factors = result.factors ?? [];
  return (
    <section className="detail-section detail-resource-section eligibility-workspace">
      <ResourceHeader
        title="Eligibility review"
        description="Evidence-based preparation guidance, with the source and reasoning visible for every check."
        actions={
          <>
            <Link
              className="detail-secondary-link"
              to={`/app/applications/import?application_id=${encodeURIComponent(applicationId)}#missing-eligibility-details`}
            >
              <FilePlus2 aria-hidden="true" /> Add missing data
            </Link>
            <a className="detail-secondary-link" href="#eligibility-score-report">
              <FileText aria-hidden="true" /> See report
            </a>
            <button
              type="button"
              className="detail-secondary-link"
              disabled={recommendations.isPending}
              onClick={() => recommendations.mutate()}
            >
              <Sparkles aria-hidden="true" />{" "}
              {recommendations.isPending
                ? "Preparing recommendations…"
                : "Ask AI for recommendations"}
            </button>
            <button
              type="button"
              className="primary"
              disabled={refresh.isPending}
              onClick={() => refresh.mutate()}
            >
              <RefreshCw aria-hidden="true" />{" "}
              {refresh.isPending ? "Refreshing analysis…" : "Refresh analysis"}
            </button>
          </>
        }
      />
      <div className="eligibility-summary-band">
        <div>
          <span>Overall readiness</span>
          <strong>{result.readiness_score}/100</strong>
        </div>
        <div>
          <span>Eligibility status</span>
          <StatusBadge
            tone={
              status === "Meets requirement"
                ? "green"
                : status === "Does not meet"
                  ? "red"
                  : "amber"
            }
          >
            {status}
          </StatusBadge>
        </div>
        <div>
          <span>Last calculated</span>
          <strong>{formatDateTime(result.last_calculated_at)}</strong>
        </div>
      </div>
      <div className="eligibility-layout">
        <div className="eligibility-main">
          <section
            id="eligibility-score-report"
            className="eligibility-factor-report"
          >
            <div className="eligibility-section-intro">
              <div>
                <h3>How this score is calculated</h3>
                <p>
                  The readiness score is the weighted result of the applicable
                  preparation factors below. It is not an admission probability.
                </p>
              </div>
              <strong>{result.readiness_score}/100</strong>
            </div>
            <div className="eligibility-factor-list">
              {factors.map((factor) => (
                <article key={factor.key}>
                  <div>
                    <strong>{factor.label}</strong>
                    <span>{factor.score}/100</span>
                  </div>
                  <ProgressBar
                    percent={factor.score}
                    label={`${factor.label} score`}
                  />
                  <p>{factor.reason}</p>
                  <small>
                    Weight {factor.weight}%
                    {factor.sources?.length
                      ? ` · Sources: ${factor.sources.map(label).join(", ")}`
                      : ""}
                  </small>
                </article>
              ))}
            </div>
          </section>
          {recommendations.data ? (
            <section className="eligibility-ai-report" aria-live="polite">
              <div className="eligibility-section-intro">
                <div>
                  <h3>
                    <Sparkles aria-hidden="true" /> Recommended next steps
                  </h3>
                  <p>{recommendations.data.summary}</p>
                </div>
                <StatusBadge
                  tone={
                    recommendations.data.generated_by === "ai"
                      ? "blue"
                      : "neutral"
                  }
                >
                  {recommendations.data.generated_by === "ai"
                    ? "AI guidance"
                    : "Report guidance"}
                </StatusBadge>
              </div>
              <ol>
                {recommendations.data.recommendations.map((item, index) => (
                  <li key={`${item}-${index}`}>
                    <CheckCircle2 aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
              <small>{recommendations.data.disclaimer}</small>
            </section>
          ) : recommendations.isPending ? (
            <section
              className="eligibility-ai-report eligibility-ai-loading"
              role="status"
            >
              <Sparkles aria-hidden="true" />
              <span>
                Reviewing the saved factors and evidence. This may take a
                moment.
              </span>
            </section>
          ) : null}
          {recommendations.error ? (
            <InlineError message={readableError(recommendations.error)} />
          ) : null}
          <section>
            <h3>Checks and evidence</h3>
            <div className="eligibility-checks">
              {findings.length ? (
                findings.map((item, index) => (
                  <article key={`${item.title}-${index}`}>
                    <div className="eligibility-check-head">
                      <strong>{item.title}</strong>
                      <StatusBadge tone={eligibilityTone(item.status)}>
                        {item.status}
                      </StatusBadge>
                    </div>
                    <dl>
                      <Definition
                        term="Evidence used"
                        value={
                          item.evidence ||
                          "No supporting evidence was available"
                        }
                      />
                      <Definition
                        term="Why this result"
                        value={
                          item.explanation ||
                          "The analysis did not return additional reasoning"
                        }
                      />
                      <Definition
                        term="What to do next"
                        value={item.nextAction}
                      />
                    </dl>
                    {item.id === "official-criteria-missing" ? (
                      <Link
                        className="detail-secondary-link"
                        to={`/app/applications/import?application_id=${encodeURIComponent(applicationId)}`}
                      >
                        Import official criteria
                      </Link>
                    ) : null}
                    {/eligible (programme|program) levels:|eligible nationalities:/i.test(
                      item.title,
                    ) ? (
                      <Link
                        className="detail-secondary-link"
                        to="/app/academic-profile?section=goals"
                      >
                        Update your study level and nationality
                      </Link>
                    ) : null}
                  </article>
                ))
              ) : (
                <p className="detail-muted-copy">
                  No individual checks were returned.
                </p>
              )}
            </div>
          </section>
          <section>
            <h3>Analysis history</h3>
            {history.isPending ? (
              <ResourceRowsSkeleton />
            ) : historyItems.length ? (
              <div className="eligibility-history-list">
                {historyItems.map((item, index, all) => (
                  <details key={item.id}>
                    <summary>
                      <span>
                        <strong>{item.readiness_score}/100</strong>
                        <small>{formatDateTime(item.created_at)}</small>
                      </span>
                      <span>
                        {item.important_changes[0] ||
                          scoreChange(item, all[index + 1])}
                      </span>
                    </summary>
                    <div className="eligibility-history-details">
                      <Definition
                        term="Trigger"
                        value={label(item.trigger_source)}
                      />
                      {Object.entries(item.readiness_components).map(
                        ([key, value]) => (
                          <Definition
                            key={key}
                            term={label(key)}
                            value={`${String(value)}%`}
                          />
                        ),
                      )}
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <p className="detail-muted-copy">
                Previous analyses will appear here after the next refresh.
              </p>
            )}
          </section>
        </div>
        <aside className="eligibility-aside">
          <section>
            <h3>Data sources used</h3>
            <ul>
              {sources.length ? (
                sources.map((source) => (
                  <li key={`${source.source}-${source.source_id ?? ""}`}>
                    <CheckCircle2 aria-hidden="true" />
                    <span>
                      {source.label}
                      {source.last_updated_at ? (
                        <small>
                          Updated {formatDate(source.last_updated_at)}
                        </small>
                      ) : null}
                    </span>
                  </li>
                ))
              ) : (
                <li>
                  <AlertCircle aria-hidden="true" /> No confirmed data sources
                  were available
                </li>
              )}
            </ul>
          </section>
          <section>
            <h3>Factors used</h3>
            {factors.map((factor) => (
              <div className="eligibility-component" key={factor.key}>
                <span>
                  {factor.label} <small>{factor.score}%</small>
                </span>
                <ProgressBar
                  percent={factor.score}
                  label={`${factor.label} factor`}
                />
              </div>
            ))}
          </section>
          {result.risks.length ? (
            <IssueList
              title="Blocking issues and warnings"
              items={result.risks.map(renderFindingValue)}
            />
          ) : null}
          {result.questions.length ? (
            <IssueList
              title="Recommended actions"
              items={result.questions.map(renderFindingValue)}
            />
          ) : null}
        </aside>
      </div>
      <p className="eligibility-disclaimer">
        This analysis supports preparation and does not guarantee admission,
        eligibility or funding.
      </p>
      {refresh.error ? (
        <InlineError message={readableError(refresh.error)} />
      ) : null}
    </section>
  );
}


function eligibilityTone(
  status: string,
): "green" | "blue" | "amber" | "red" | "grey" {
  return status === "Meets requirement"
    ? "green"
    : status === "Likely meets"
      ? "blue"
      : status === "Does not meet"
        ? "red"
        : status === "Unknown"
          ? "grey"
          : "amber";
}

export function isEligibilityResponse(
  value: S["EligibilityResponse"] | undefined,
): value is S["EligibilityResponse"] {
  return Boolean(
    value &&
      Array.isArray(value.findings) &&
      Array.isArray(value.risks) &&
      Array.isArray(value.questions) &&
      value.readiness_components &&
      typeof value.readiness_components === "object",
  );
}

function normalizeFinding(value: unknown): NormalFinding {
  const raw =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const certainty = String(raw.certainty || raw.status || "unknown");
  const statuses: Record<string, string> = {
    met: "Meets requirement",
    meets_requirement: "Meets requirement",
    possibly_met: "Likely meets",
    likely_meets: "Likely meets",
    needs_review: "Needs review",
    missing_evidence: "Missing evidence",
    unmet: "Does not meet",
    does_not_meet: "Does not meet",
    unknown: "Unknown",
  };
  const status = statuses[certainty] || "Unknown";
  const evidence = Array.isArray(raw.evidence)
    ? raw.evidence
        .map((item) =>
          item && typeof item === "object"
            ? String((item as Record<string, unknown>).summary || "")
            : "",
        )
        .filter(Boolean)
        .join("; ")
    : typeof raw.evidence === "string"
      ? raw.evidence
      : "";
  return {
    id: String(raw.id || ""),
    title: String(
      raw.checked || raw.criterion || raw.title || "Eligibility criterion",
    ),
    status,
    evidence,
    explanation: String(raw.reason || raw.explanation || ""),
    nextAction:
      typeof raw.recommended_action === "string"
        ? raw.recommended_action
        : status === "Meets requirement"
          ? "Keep this evidence current."
          : status === "Likely meets"
            ? "Confirm the matched evidence before submission."
            : status === "Does not meet"
              ? "Review this criterion before proceeding."
              : "Add or verify supporting information.",
  };
}

function scoreChange(
  current: S["EligibilityResponse"],
  previous?: S["EligibilityResponse"],
) {
  if (!previous) return "Baseline";
  const change = current.readiness_score - previous.readiness_score;
  return change === 0
    ? "No score change"
    : `${change > 0 ? "+" : ""}${change} points`;
}

function renderFindingValue(value: unknown) {
  return typeof value === "string"
    ? value
    : value && typeof value === "object"
      ? Object.values(value as Record<string, unknown>)
          .filter((item) => typeof item === "string")
          .join(" · ") || "Review available evidence"
      : "Review available evidence";
}

