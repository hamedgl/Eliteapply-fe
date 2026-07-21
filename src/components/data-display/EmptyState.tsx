import type { ComponentType, ReactNode } from "react";

/** Shared empty/filtered-empty/error state. Pass `variant="filtered"` for a quieter, non-onboarding treatment. */
export function EmptyState({
  icon: Icon,
  heading,
  description,
  primaryAction,
  secondaryAction,
  variant = "onboarding",
}: {
  icon: ComponentType<{
    "aria-hidden"?: boolean | "true" | "false";
    className?: string;
  }>;
  heading: string;
  description?: ReactNode;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: ReactNode;
  variant?: "onboarding" | "filtered";
}) {
  return (
    <div
      className={`apps-empty apps-empty-${variant}`}
      role={variant === "filtered" ? "status" : undefined}
    >
      <Icon aria-hidden="true" className="apps-empty-icon" />
      <h2>{heading}</h2>
      {description ? <p>{description}</p> : null}
      {primaryAction || secondaryAction ? (
        <div className="apps-empty-actions">
          {primaryAction ? (
            <button type="button" className="primary" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </button>
          ) : null}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
