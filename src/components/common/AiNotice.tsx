import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import "./ai-notice.css";

/**
 * Transparency disclosure for every surface where an AI model produces or
 * changes user-facing content (EU AI Act Regulation (EU) 2024/1689, Art. 50:
 * people must be told when they interact with an AI system and when content is
 * AI-generated). `provenance` carries the run metadata the API returns —
 * model and prompt versions — so a suggestion can be traced back to the run
 * that produced it.
 */
export function AiNotice({
  children,
  provenance,
  compact = false,
  link = true,
  id,
  openInNewTab = false,
}: {
  children: ReactNode;
  provenance?: string | null;
  compact?: boolean;
  link?: boolean;
  /** Set when a control elsewhere points at this notice via aria-describedby. */
  id?: string;
  /**
   * The link is a plain anchor (see below), so following it is a full
   * navigation. Set this when the notice sits above unsaved, unrecoverable
   * form state — e.g. a draft with no autosave — so the disclosure can't
   * navigate that state away.
   */
  openInNewTab?: boolean;
}) {
  return (
    /* A plain div, not <aside>: these sit inside rails and dialogs that are
       already landmarks, and a nested complementary landmark adds noise. */
    <div className={`ai-notice${compact ? " is-compact" : ""}`}>
      <Sparkles aria-hidden="true" />
      <div>
        <p id={id}>{children}</p>
        {provenance ? <p className="ai-notice-provenance">{provenance}</p> : null}
        {link ? (
          /* Plain anchor: this notice also renders on public pages and inside
             dialogs rendered without a router in tests. */
          <a
            className="ai-notice-link"
            href="/ai-transparency"
            {...(openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : null)}
          >
            How EliteApply uses AI
          </a>
        ) : null}
      </div>
    </div>
  );
}

/** `Model v3 · Prompt v2`, skipping the versions the API left null. */
export function generationProvenance(
  run: { model_version?: string | null; prompt_version?: string | null } | null,
) {
  if (!run) return null;
  const parts = [
    run.model_version ? `Model ${run.model_version}` : null,
    run.prompt_version ? `Prompt ${run.prompt_version}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
