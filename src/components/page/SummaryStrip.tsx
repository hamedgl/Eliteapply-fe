import type { ComponentType } from "react";

export type SummaryMetric = {
  key: string;
  icon: ComponentType<{ "aria-hidden"?: boolean | "true" | "false" }>;
  value: string | number;
  label: string;
  attention?: boolean;
  onClick?: () => void;
};

/** Compact row of at-a-glance metrics; each is clickable when it can apply a filter. */
export function SummaryStrip({ metrics }: { metrics: SummaryMetric[] }) {
  return (
    <div className="apps-summary" aria-label="Summary">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <button
            type="button"
            key={metric.key}
            className={`apps-summary-item${metric.attention ? " apps-summary-item-attention" : ""}`}
            onClick={metric.onClick}
            disabled={!metric.onClick}
          >
            <Icon aria-hidden="true" />
            <span className="apps-summary-value">{metric.value}</span>
            <span className="apps-summary-label">{metric.label}</span>
          </button>
        );
      })}
    </div>
  );
}
