import { useRef } from "react";
import { Check, Circle, X } from "lucide-react";
import type { ProfileCompletionBreakdown } from "../../../lib/api/platform";
import { useModalDialog } from "../../../lib/dom-hooks";

export type ExplainedStep = {
  label: string;
  explain: string;
  done: boolean;
  pending: boolean;
};

/**
 * Explains where the two numbers on the dashboard come from: the profile score
 * returned by the server and the workspace guide count computed here. Every
 * step lists the exact rule that marks it complete, so a step that looks wrong
 * can be checked against real data instead of guessed at.
 */
export function ProgressExplainerDialog({
  profilePercent,
  profileSections,
  phases,
  onClose,
}: {
  profilePercent: number;
  profileSections: ProfileCompletionBreakdown["sections"];
  phases: { title: string; steps: ExplainedStep[] }[];
  onClose: () => void;
}) {
  const steps = phases.flatMap((phase) => phase.steps);
  const completed = steps.filter((step) => step.done).length;
  const guidePercent = steps.length
    ? Math.round((completed / steps.length) * 100)
    : 0;
  const panelRef = useRef<HTMLDivElement>(null);
  useModalDialog(panelRef, onClose);

  return (
    <div className="apps-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className="apps-dialog progress-explainer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="progress-explainer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="apps-dialog-header">
          <h2 id="progress-explainer-title">How your progress is measured</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="apps-dialog-body">
          <section className="progress-explainer-block">
            <h3>
              Profile progress <strong>{profilePercent}%</strong>
            </h3>
            {profileSections.length ? (
              <>
                <p>
                  Each profile section carries a weight, and your score is the
                  weights of the sections you have completed — recalculated on
                  the server every time you save.
                </p>
                <ul className="progress-explainer-weights">
                  {profileSections.map((section) => (
                    <li
                      key={section.key}
                      className={section.complete ? "is-done" : undefined}
                    >
                      <span aria-hidden="true">
                        {section.complete ? <Check /> : <Circle />}
                      </span>
                      <span>{section.label}</span>
                      <strong>
                        {section.complete ? "+" : ""}
                        {section.weight}
                      </strong>
                    </li>
                  ))}
                </ul>
                <p className="progress-explainer-sum">
                  {profileSections
                    .filter((section) => section.complete)
                    .map((section) => section.weight)
                    .join(" + ") || "0"}{" "}
                  = {profilePercent}% of a possible{" "}
                  {profileSections.reduce(
                    (total, section) => total + section.weight,
                    0,
                  )}
                  .
                </p>
              </>
            ) : (
              <p>
                Scored on the server from your saved academic profile: the more
                of it you fill in, the higher it goes. It is recalculated every
                time you save, so it never needs updating by hand.
              </p>
            )}
          </section>

          <section className="progress-explainer-block">
            <h3>
              Workspace guide{" "}
              <strong>
                {completed} of {steps.length} steps
              </strong>
            </h3>
            <p>
              {completed} completed ÷ {steps.length} steps × 100 ={" "}
              {guidePercent}%. Each step is checked live against your
              applications, documents and profile — nothing is ticked off
              manually, so a step reopens if the data behind it changes.
            </p>
            {phases.map((phase) => (
              <div className="progress-explainer-phase" key={phase.title}>
                <h4>{phase.title}</h4>
                <ul>
                  {phase.steps.map((step) => (
                    <li
                      key={step.label}
                      className={step.done ? "is-done" : undefined}
                    >
                      <span aria-hidden="true">
                        {step.done ? <Check /> : <Circle />}
                      </span>
                      <div>
                        <strong>
                          {step.label}
                          <em>
                            {step.pending
                              ? "Checking…"
                              : step.done
                                ? "Complete"
                                : "Not yet"}
                          </em>
                        </strong>
                        <small>{step.explain}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>
        <div className="apps-dialog-footer">
          <button type="button" className="primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
