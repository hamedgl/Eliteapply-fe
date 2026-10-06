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
    <div className="apps-summary" role="group" aria-label="Summary">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const className = `apps-summary-item${metric.attention ? " apps-summary-item-attention" : ""}`;
        const content = (
          <>
            <Icon aria-hidden="true" />
            <span className="apps-summary-value">{metric.value}</span>
            <span className="apps-summary-label">{metric.label}</span>
          </>
        );
        return metric.onClick ? (
          <button type="button" key={metric.key} className={className} onClick={metric.onClick}>
            {content}
          </button>
        ) : (
          <div key={metric.key} className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
