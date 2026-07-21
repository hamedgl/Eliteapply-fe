import type { ComponentType, ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "blue"
  | "violet"
  | "teal"
  | "indigo"
  | "amber"
  | "green"
  | "red"
  | "grey";

/** Shared status/stage pill: colour + icon + text, never colour alone. */
export function StatusBadge({
  tone,
  icon: Icon,
  children,
}: {
  tone: BadgeTone;
  icon?: ComponentType<{ "aria-hidden"?: boolean | "true" | "false" }>;
  children: ReactNode;
}) {
  return (
    <span className={`apps-stage-pill apps-tone-${tone}`}>
      {Icon ? <Icon aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
