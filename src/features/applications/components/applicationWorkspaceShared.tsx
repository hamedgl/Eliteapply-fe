import { useEffect, useRef, type ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  Link,
} from "react-router-dom";
import { ApiError } from "../../../lib/api/errors";
import { useFocusTrap } from "../hooks";
import { ApplicationWorkspacePageSkeleton } from "../../../components/page/PageSkeleton";
import "../../../styles/workspace.css";


import type { Tab } from "../ApplicationWorkspace";

export const REQUIREMENT_DONE = new Set(["ready", "complete", "submitted", "waived"]);
export const TASK_DONE = new Set(["completed", "cancelled"]);


export function WorkspaceDrawer({
  title,
  description,
  wide = false,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLElement>(null);
  useFocusTrap(panel, true);
  return (
    <div
      className="apps-drawer-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={panel}
        className={`apps-drawer detail-drawer${wide ? " apps-drawer-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-drawer-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <header className="apps-drawer-header">
          <div>
            <h2 id="detail-drawer-title">{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label={`Close ${title}`}>
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="apps-drawer-body">{children}</div>
      </section>
    </div>
  );
}


export function DrawerActions({
  pending,
  submitLabel,
  onCancel,
}: {
  pending: boolean;
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="apps-drawer-footer detail-inline-footer">
      <button type="button" onClick={onCancel} disabled={pending}>
        Cancel
      </button>
      <button type="submit" className="primary" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}


export function ResourceHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="detail-resource-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {actions ? (
        <div className="detail-resource-actions">{actions}</div>
      ) : null}
    </header>
  );
}

export function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="detail-section-heading">
      <h2>{title}</h2>
      {action}
    </header>
  );
}

export function Definition({ term, value }: { term: string; value: ReactNode }) {
  return (
    <div>
      <dt>{term}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function SummaryChip({
  label: text,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "danger";
}) {
  return (
    <span className={tone === "danger" ? "detail-chip-danger" : undefined}>
      {text} <strong>{value}</strong>
    </span>
  );
}

export function IssueList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="detail-issue-list">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="detail-inline-error" role="alert">
      <AlertCircle aria-hidden="true" />
      <p>{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function FeedbackToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);
  return message ? (
    <div className="detail-toast" role="status">
      <CheckCircle2 aria-hidden="true" />
      {message}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <X aria-hidden="true" />
      </button>
    </div>
  ) : null;
}


export function ApplicationWorkspaceSkeleton({ tab }: { tab: Tab }) {
  return <ApplicationWorkspacePageSkeleton tab={tab} />;
}

export function ResourceRowsSkeleton() {
  return (
    <div
      className="detail-rows-skeleton"
      aria-busy="true"
      aria-label="Loading items"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="skeleton" key={index} />
      ))}
    </div>
  );
}

export function EligibilitySkeleton() {
  return (
    <section
      className="detail-section"
      aria-busy="true"
      aria-label="Loading eligibility analysis"
    >
      <div className="skeleton detail-skeleton-row" />
      <div className="detail-skeleton-layout">
        <ResourceRowsSkeleton />
        <div className="skeleton detail-skeleton-aside" />
      </div>
    </section>
  );
}

export function ReadinessSkeleton() {
  return (
    <div
      className="detail-rows-skeleton"
      aria-busy="true"
      aria-label="Checking readiness"
    >
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}

export function PageError({
  title,
  description = "Open a valid application workspace and try again.",
  onRetry,
}: {
  title: string;
  description?: string;
  onRetry: () => void;
}) {
  return (
    <div className="page apps-page">
      <section className="detail-page-error">
        <AlertCircle aria-hidden="true" />
        <h1>{title}</h1>
        <p>{description}</p>
        <button type="button" className="primary" onClick={onRetry}>
          Try again
        </button>
        <Link to="/app/applications">Back to applications</Link>
      </section>
    </div>
  );
}


export function readableError(error: unknown) {
  if (error instanceof ApiError)
    return error.message || "The change could not be saved.";
  if (error instanceof Error) return error.message;
  return "The change could not be saved. Your previous data is unchanged.";
}

export function selectValue(value: unknown) {
  return typeof value === "string"
    ? value
    : value && typeof value === "object" && "target" in value
      ? String((value as { target?: { value?: unknown } }).target?.value ?? "")
      : "";
}

export function dateValue(value: FormDataEntryValue | null) {
  const text = String(value || "");
  return text ? new Date(`${text}T12:00:00Z`).toISOString() : null;
}

export function dateTimeValue(value: FormDataEntryValue | null) {
  const text = String(value || "");
  return text ? new Date(text).toISOString() : null;
}

export function optional(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}

export function formatDateTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not available";
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(
    new Date(value),
  );
}

