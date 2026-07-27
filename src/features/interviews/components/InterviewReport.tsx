import { ArrowUpRight, Check, Target } from "lucide-react";
import {
  scoreCategoryLabel,
  scoreTone,
  warningList,
  type InterviewReport as Report,
} from "../model";
import { numericScores, ScoreBars } from "./ScoreBars";
import { InterviewWarnings } from "./InterviewWarnings";
import "../interview-feedback.css";

const asStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];

export function InterviewReportPanel({ report }: { report: Report }) {
  const categories = numericScores(report.category_scores);
  const strengths = asStrings(report.strengths);
  const improvements = asStrings(report.improvement_areas);
  const actions = asStrings(report.suggested_practice_actions);
  const flagged = [
    ...warningList(report.contradictions ?? []),
    ...warningList(report.weak_claims ?? []),
  ];

  return (
    <section className="apps-card iv-report" aria-labelledby="iv-report-title">
      <header className="iv-report-head">
        <div>
          <h2 id="iv-report-title">Practice report</h2>
          <p>{report.rubric_explanation}</p>
        </div>
        <div className={`iv-report-score is-${scoreTone(report.overall_score ?? 0)}`}>
          <strong>{report.overall_score ?? 0}</strong>
          <span>/ 100</span>
        </div>
      </header>

      <ScoreBars scores={categories} />

      <div className="iv-report-columns">
        {strengths.length ? (
          <section>
            <h3>
              <Check aria-hidden="true" />
              Strengths
            </h3>
            <ul>
              {strengths.map((item) => (
                <li key={item}>{scoreCategoryLabel(item)}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {improvements.length ? (
          <section>
            <h3>
              <ArrowUpRight aria-hidden="true" />
              Focus next
            </h3>
            <ul>
              {improvements.map((item) => (
                <li key={item}>{scoreCategoryLabel(item)}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {actions.length ? (
        <section className="iv-report-actions">
          <h3>
            <Target aria-hidden="true" />
            Suggested practice
          </h3>
          <ul>
            {actions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <InterviewWarnings warnings={flagged} />

      <footer className="iv-report-foot">
        <p>{report.disclaimer}</p>
        <p className="iv-report-meta">
          Rubric {report.rubric_version} · Prompt {report.prompt_version} · Transcript{" "}
          {report.transcript_availability}
        </p>
      </footer>
    </section>
  );
}
