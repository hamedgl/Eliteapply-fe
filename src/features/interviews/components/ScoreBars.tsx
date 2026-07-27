import { scoreCategoryLabel, scoreTone } from "../model";

/** Numeric entries only — `scoring`/`category_scores` are open objects. */
export function numericScores(source: Record<string, unknown> | undefined) {
  return Object.entries(source ?? {}).flatMap(([key, value]) =>
    typeof value === "number" && Number.isFinite(value) ? [[key, value] as const] : [],
  );
}

export const averageScore = (scores: readonly (readonly [string, number])[]) =>
  scores.length
    ? Math.round(scores.reduce((total, [, value]) => total + value, 0) / scores.length)
    : null;

/** One scale for per-answer feedback and the session report, so 50 always looks the same. */
export function ScoreBars({ scores }: { scores: readonly (readonly [string, number])[] }) {
  if (!scores.length) return null;
  return (
    <ul className="iv-score-list">
      {scores.map(([key, value]) => (
        <li key={key}>
          <span className="iv-score-label">{scoreCategoryLabel(key)}</span>
          <span className="iv-score-track" aria-hidden="true">
            <span
              className={`iv-score-fill is-${scoreTone(value)}`}
              style={{ inlineSize: `${Math.max(0, Math.min(100, value))}%` }}
            />
          </span>
          <span className="iv-score-value">{value}</span>
        </li>
      ))}
    </ul>
  );
}
