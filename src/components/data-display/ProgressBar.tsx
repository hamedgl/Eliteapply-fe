import type { CSSProperties } from "react";

/** Shared slim progress bar — profile completion, document coverage, story readiness, etc. */
export function ProgressBar({
  percent,
  label,
}: {
  percent: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="apps-progress-bar">
      <progress
        className="visually-hidden"
        value={clamped}
        max={100}
        aria-label={label}
      >
        {clamped}%
      </progress>
      <div className="apps-progress-bar-track" aria-hidden="true">
        <div
          className="apps-progress-bar-fill"
          style={{ "--fill": clamped / 100 } as CSSProperties}
        />
      </div>
      <span className="apps-progress-bar-value">{clamped}%</span>
    </div>
  );
}
