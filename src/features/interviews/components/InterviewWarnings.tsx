import { AlertTriangle } from "lucide-react";
import type { ContradictionWarning } from "../model";

/** Shared between per-answer feedback and the session report. */
export function InterviewWarnings({ warnings }: { warnings: ContradictionWarning[] }) {
  if (!warnings.length) return null;
  return (
    <section className="iv-warnings">
      <h4>
        <AlertTriangle aria-hidden="true" />
        Claims to check before a real interview
      </h4>
      <ul>
        {warnings.map((warning) => (
          <li key={`${warning.type}-${warning.claim}`}>
            <strong>{warning.claim}</strong>
            <span>
              {warning.type === "contradiction"
                ? "Contradicts your submitted materials"
                : "Not found in your submitted materials"}
              {warning.reason ? ` · ${warning.reason}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
