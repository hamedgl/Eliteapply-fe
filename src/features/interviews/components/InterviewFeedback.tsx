import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import {
  feedbackBlocks,
  scoreCategoryLabel,
  scoreTone,
  warningList,
  type InterviewTurn,
} from "../model";
import { averageScore, numericScores, ScoreBars } from "./ScoreBars";
import { InterviewWarnings } from "./InterviewWarnings";
import "../interview-feedback.css";

export function InterviewFeedback({
  turn,
  defaultOpen,
}: {
  turn: InterviewTurn;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const scores = numericScores(turn.scoring);
  const blocks = feedbackBlocks(turn.feedback);
  const warnings = warningList(turn.contradiction_warnings);
  const average = averageScore(scores);

  if (!scores.length && !blocks.length && !warnings.length) return null;

  return (
    <details
      className="iv-feedback"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <ChevronDown aria-hidden="true" className="iv-feedback-caret" />
        <Sparkles aria-hidden="true" />
        <span>Coach feedback</span>
        {average !== null ? (
          <span className={`iv-score-chip apps-tone-${scoreTone(average)}`}>{average}</span>
        ) : null}
        {warnings.length ? (
          <span className="iv-feedback-flag">
            {warnings.length} to review
          </span>
        ) : null}
      </summary>

      <div className="iv-feedback-body">
        <ScoreBars scores={scores} />

        {blocks.map((block) => (
          <section className="iv-feedback-block" key={block.key}>
            <h4>{block.label}</h4>
            {block.kind === "list" ? (
              <ul>
                {block.items.map((item) => (
                  <li key={item}>{scoreCategoryLabel(item)}</li>
                ))}
              </ul>
            ) : block.key === "example_upgrade" ? (
              <blockquote>{block.text}</blockquote>
            ) : (
              <p>{block.text}</p>
            )}
          </section>
        ))}

        <InterviewWarnings warnings={warnings} />
      </div>
    </details>
  );
}
