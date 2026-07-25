import { useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle2, Info, Quote, Wand2, X } from "lucide-react";
import { ProgressBar } from "../../components/data-display/ProgressBar";
import { StatusBadge, type BadgeTone } from "../../components/data-display/StatusBadge";
import type { components } from "../../generated/api/schema";

type Analysis = components["schemas"]["QualityAnalysisResponse"];

/*
 * The backend types `scores` as a free-form object and `findings` /
 * `claim_warnings` as arrays of unknown, so every field below is probed
 * defensively: a shape we do not recognise still renders as readable text
 * instead of disappearing.
 */
const TITLE_KEYS = ["title", "label", "issue", "name", "heading", "summary"];
const BODY_KEYS = [
  "detail",
  "description",
  "message",
  "explanation",
  "reason",
  "body",
  "text",
];
const FIX_KEYS = [
  "suggestion",
  "recommendation",
  "recommended_action",
  "fix",
  "action",
  "advice",
];
const QUOTE_KEYS = ["excerpt", "quote", "evidence", "snippet", "span", "claim"];
const SEVERITY_KEYS = ["severity", "level", "priority", "status", "type", "category"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** First key holding a non-empty string; returns the key too so it can be skipped later. */
function pickText(record: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim())
      return { key, value: value.trim() };
  }
  return null;
}

function readable(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) return value.map(readable).filter(Boolean).join(", ");
  if (isRecord(value))
    return Object.entries(value)
      .map(([key, entry]) => `${humanKey(key)}: ${readable(entry)}`)
      .join(" · ");
  return String(value);
}

function humanKey(key: string) {
  return key
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

const SEVERITY_TONES: { match: RegExp; tone: BadgeTone; icon: typeof Info }[] = [
  { match: /crit|sever|high|error|fail|block/i, tone: "red", icon: AlertTriangle },
  { match: /medium|moder|warn|caution/i, tone: "amber", icon: AlertTriangle },
  { match: /pass|ok\b|good|strong|resolved|met/i, tone: "green", icon: CheckCircle2 },
  { match: /low|minor|info|note|nit|hint/i, tone: "blue", icon: Info },
];

function severityStyle(word: string) {
  return (
    SEVERITY_TONES.find((entry) => entry.match.test(word)) ?? {
      tone: "neutral" as BadgeTone,
      icon: Info,
    }
  );
}

/**
 * Scores arrive on unknown scales (0–1, 0–10, 0–100, or `{value, max}`), so the
 * bar is normalised while the caption keeps the number the backend actually sent.
 */
function scoreValue(
  raw: unknown,
): { percent: number; caption: string | null } | null {
  let value: number | null = null;
  let max: number | null = null;
  if (typeof raw === "number") value = raw;
  else if (isRecord(raw)) {
    const candidate = raw.value ?? raw.score ?? raw.rating;
    if (typeof candidate === "number") value = candidate;
    if (typeof raw.max === "number") max = raw.max;
  }
  if (value == null || !Number.isFinite(value)) return null;
  const scale = max && max > 0 ? max : value <= 1 ? 1 : value <= 10 ? 10 : 100;
  const rounded = Math.round(value * 100) / 100;
  return {
    percent: (value / scale) * 100,
    // ProgressBar already prints the percentage; only other scales add information.
    caption: scale === 100 ? null : `${rounded} / ${scale}`,
  };
}

function AnalysisItem({ item }: { item: unknown }) {
  if (!isRecord(item))
    return (
      <li className="writing-quality-item">
        <p>{readable(item) || "Not provided"}</p>
      </li>
    );

  const title = pickText(item, TITLE_KEYS);
  const body = pickText(item, BODY_KEYS);
  const fix = pickText(item, FIX_KEYS);
  const quote = pickText(item, QUOTE_KEYS);
  const severity = pickText(item, SEVERITY_KEYS);
  const used = new Set(
    [title, body, fix, quote, severity].flatMap((entry) =>
      entry ? [entry.key] : [],
    ),
  );
  used.add("id");
  const extras = Object.entries(item).filter(
    ([key, value]) => !used.has(key) && readable(value).trim(),
  );
  const { tone, icon: SeverityIcon } = severityStyle(severity?.value ?? "");

  return (
    <li className="writing-quality-item">
      <div className="writing-quality-item-head">
        <h4>{title?.value ?? body?.value ?? "Finding"}</h4>
        {severity ? (
          <StatusBadge tone={tone} icon={SeverityIcon}>
            {humanKey(severity.value)}
          </StatusBadge>
        ) : null}
      </div>
      {body && body.value !== (title?.value ?? "") ? <p>{body.value}</p> : null}
      {quote ? (
        <blockquote>
          <Quote aria-hidden="true" />
          <span>{quote.value}</span>
        </blockquote>
      ) : null}
      {fix ? (
        <p className="writing-quality-fix">
          <Wand2 aria-hidden="true" />
          <span>{fix.value}</span>
        </p>
      ) : null}
      {extras.length ? (
        <dl className="writing-quality-extras">
          {extras.map(([key, value]) => (
            <div key={key}>
              <dt>{humanKey(key)}</dt>
              <dd>{readable(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </li>
  );
}

function ItemList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: unknown[];
  emptyLabel: string;
}) {
  return (
    <section className="writing-quality-section">
      <h3>
        {title} <span>({items.length})</span>
      </h3>
      {items.length ? (
        <ul className="writing-quality-list">
          {items.map((item, index) => (
            <AnalysisItem key={index} item={item} />
          ))}
        </ul>
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

  const scores = Object.entries(analysis.scores ?? {});

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
              {scores.map(([key, raw]) => {
                const score = scoreValue(raw);
                return (
                  <div key={key} className="writing-quality-score">
                    <span className="writing-quality-score-name">
                      {humanKey(key)}
                    </span>
                    {score ? (
                      <>
                        <ProgressBar
                          percent={score.percent}
                          label={`${humanKey(key)} score`}
                        />
                        {score.caption ? (
                          <span className="writing-quality-score-caption">
                            {score.caption}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="writing-quality-score-caption">
                        {readable(raw) || "Not provided"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
        <ItemList
          title="Findings"
          items={analysis.findings ?? []}
          emptyLabel="No issues were flagged in this pass."
        />
        <ItemList
          title="Claim warnings"
          items={analysis.claim_warnings ?? []}
          emptyLabel="No claims needed evidence review."
        />
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
