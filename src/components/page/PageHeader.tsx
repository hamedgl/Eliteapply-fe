import type { ReactNode } from "react";

/** Shared page header: optional eyebrow, title, one-line description, optional metadata, actions on the right. */
export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="apps-header">
      <div>
        {eyebrow ? <p className="apps-header-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
        {meta ? <span className="apps-header-count">{meta}</span> : null}
      </div>
      {actions ? <div className="apps-header-actions">{actions}</div> : null}
    </header>
  );
}
