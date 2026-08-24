import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Circle,
  Edit3,
  FileText,
  Link2,
  ListChecks,
  Users,
} from "lucide-react";
import {
  Link,
} from "react-router-dom";
import { EmptyState } from "../../../components/data-display/EmptyState";
import { ProgressBar } from "../../../components/data-display/ProgressBar";
import { StatusBadge } from "../../../components/data-display/StatusBadge";
import {
  deadlineInfo,
  formatDate,
  label,
} from "../model";
import type { components } from "../../../generated/api/schema";
import "../../../styles/workspace.css";
import {
  REQUIREMENT_DONE,
  TASK_DONE,
  SectionHeading,
  Definition,
  ResourceHeader,
  SummaryChip,
  IssueList,
  ReadinessSkeleton,
  formatDateTime,
} from "./applicationWorkspaceShared";
import { taskDueLabel, dateSort } from "./TasksTab";
import type { Tab } from "../ApplicationWorkspace";


type S = components["schemas"];

type LinkedResource = S["ApplicationLinkedResourceResponse"];


export function OverviewTab({
  workspace,
  readiness,
  readinessPending,
  eligibility,
  onEdit,
  onOpen,
}: {
  workspace: S["ApplicationWorkspaceResponse"];
  readiness?: S["ApplicationReadinessResponse"];
  readinessPending: boolean;
  eligibility?: S["EligibilityResponse"];
  onEdit: () => void;
  onOpen: (tab: Tab) => void;
}) {
  const { application, requirements, tasks, document_links: links } = workspace;
  const linkedResources = workspace.linked_resources ?? [];
  const needsAttention = requirements.filter(
    (item) => item.required && !REQUIREMENT_DONE.has(item.status),
  );
  const upcomingTasks = tasks
    .filter((item) => !TASK_DONE.has(item.status))
    .sort(dateSort)
    .slice(0, 4);
  const readyRequirements = requirements.filter((item) =>
    REQUIREMENT_DONE.has(item.status),
  ).length;
  const completedTasks = tasks.filter(
    (item) => item.status === "completed",
  ).length;
  const linkedRequired = new Set(
    links.map((item) => item.requirement_id).filter(Boolean),
  ).size;
  const requiredCount = requirements.filter((item) => item.required).length;
  const nextAction =
    readiness?.recommended_next_actions[0] ?? "Review application details";
  const deadline = deadlineInfo(
    application.primary_deadline_at,
    application.stage,
  );

  return (
    <div className="detail-overview-grid">
      <div className="detail-overview-main">
        <section className="detail-section detail-details-section">
          <SectionHeading
            title="Application details"
            action={
              <button type="button" onClick={onEdit}>
                <Edit3 aria-hidden="true" /> Edit
              </button>
            }
          />
          <dl className="detail-definition-grid">
            <Definition term="Stage" value={label(application.stage)} />
            <Definition term="Priority" value={label(application.priority)} />
            <Definition
              term="Institution or provider"
              value={
                application.institution_display_name ||
                application.institution_name ||
                application.scholarship_display_name ||
                application.scholarship_name ||
                "Not linked"
              }
            />
            <Definition
              term="Programme or scholarship"
              value={
                application.programme_display_name ||
                application.programme_name ||
                application.scholarship_display_name ||
                application.scholarship_name ||
                application.title
              }
            />
            <Definition term="Intake" value={application.intake || "Not set"} />
            <Definition
              term="Deadline"
              value={formatDate(application.primary_deadline_at)}
            />
            <Definition
              term="Source"
              value={
                application.source_url ? (
                  <a
                    href={application.source_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open source
                  </a>
                ) : (
                  "Not added"
                )
              }
            />
            <Definition
              term="Last updated"
              value={formatDateTime(application.updated_at)}
            />
          </dl>
          {application.notes ? (
            <div className="detail-application-notes">
              <h3>Notes</h3>
              <p>{application.notes}</p>
            </div>
          ) : null}
        </section>

        <section className="detail-next-action">
          <div className="detail-next-icon">
            <ChevronRight aria-hidden="true" />
          </div>
          <div>
            <h2>Next recommended action</h2>
            <p>{nextAction}</p>
          </div>
          <button
            className="primary"
            type="button"
            onClick={() =>
              onOpen(needsAttention.length ? "requirements" : "eligibility")
            }
          >
            Open next step
          </button>
        </section>

        <div className="detail-overview-split">
          <section className="detail-section">
            <SectionHeading title="Upcoming deadline" />
            <div
              className={`detail-deadline-block detail-deadline-${deadline.urgency}`}
            >
              <CalendarClock aria-hidden="true" />
              <div>
                <strong>{deadline.primary}</strong>
                <span>
                  {deadline.secondary || "No immediate deadline pressure"}
                </span>
              </div>
            </div>
          </section>
          <section className="detail-section">
            <SectionHeading
              title="Requirements needing attention"
              action={
                <button type="button" onClick={() => onOpen("requirements")}>
                  View all
                </button>
              }
            />
            {needsAttention.length ? (
              <ul className="detail-compact-list">
                {needsAttention.slice(0, 4).map((item) => (
                  <li key={item.id}>
                    <Circle aria-hidden="true" />
                    <span>
                      {item.title}
                      <small>{label(item.status)}</small>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="detail-quiet-success">
                <CheckCircle2 aria-hidden="true" /> Required items are ready.
              </p>
            )}
          </section>
        </div>

        <div className="detail-overview-split">
          <section className="detail-section">
            <SectionHeading
              title="Upcoming tasks"
              action={
                <button type="button" onClick={() => onOpen("tasks")}>
                  View all
                </button>
              }
            />
            {upcomingTasks.length ? (
              <ul className="detail-compact-list">
                {upcomingTasks.map((item) => (
                  <li key={item.id}>
                    <Circle aria-hidden="true" />
                    <span>
                      {item.title}
                      <small>{taskDueLabel(item)}</small>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="detail-muted-copy">You have no open tasks.</p>
            )}
          </section>
          <section className="detail-section">
            <SectionHeading
              title="Recently linked documents"
              action={
                <button type="button" onClick={() => onOpen("documents")}>
                  View all
                </button>
              }
            />
            {links.length ? (
              <ul className="detail-compact-list">
                {links.slice(0, 4).map((item) => (
                  <li key={item.id}>
                    <FileText aria-hidden="true" />
                    <span>
                      {item.document?.display_name || "Linked document"}
                      <small>
                        {item.requirement
                          ? item.requirement.title
                          : "Application-wide"}
                      </small>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="detail-muted-copy">
                No documents are linked to this application.
              </p>
            )}
          </section>
        </div>

        <section className="detail-section">
          <SectionHeading
            title="Linked resources"
            action={
              <button type="button" onClick={() => onOpen("linked")}>
                View all
              </button>
            }
          />
          {linkedResources.length ? (
            <ul className="detail-compact-list">
              {linkedResources.slice(0, 5).map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  {linkedResourceIcon(item.kind)}
                  <span>
                    <Link to={linkedResourceHref(item)}>{item.title}</Link>
                    <small>
                      {linkedResourceKindLabel(item.kind)} · {label(item.status)}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="detail-muted-copy">
              No references, writing, stories, interviews or reminders are linked.
            </p>
          )}
        </section>
      </div>

      <aside className="detail-readiness-panel">
        <div className="detail-readiness-heading">
          <div>
            <h2>Submission readiness</h2>
            <p>
              {readiness
                ? label(readiness.overall_state)
                : "Checking current state"}
            </p>
          </div>
          <strong>{readiness?.readiness_percent ?? 0}%</strong>
        </div>
        <ProgressBar
          percent={readiness?.readiness_percent ?? 0}
          label="Submission readiness"
        />
        {readinessPending ? (
          <ReadinessSkeleton />
        ) : (
          <>
            <dl className="detail-readiness-list">
              <Definition
                term="Requirements complete"
                value={`${readiness?.counts?.requirements_complete ?? readyRequirements} of ${readiness?.counts?.requirements_total ?? requirements.length}`}
              />
              <Definition
                term="Tasks complete"
                value={`${readiness?.counts?.tasks_complete ?? completedTasks} of ${readiness?.counts?.tasks_total ?? tasks.length}`}
              />
              <Definition
                term="Required documents linked"
                value={`${readiness?.counts?.required_documents_linked ?? linkedRequired} of ${readiness?.counts?.required_documents_total ?? requiredCount}`}
              />
              <Definition
                term="Eligibility checks"
                value={
                  eligibility
                    ? `${eligibility.findings.length} reviewed`
                    : "Not analysed"
                }
              />
              <Definition
                term="Blocking issues"
                value={String(readiness?.blocking_issues.length ?? 0)}
              />
            </dl>
            {readiness?.deadline_state === "expired" ? (
              <div className="detail-critical-blocker">
                <AlertCircle aria-hidden="true" />
                <span>
                  <strong>Deadline passed</strong>
                  <small>
                    Update the deadline or review whether this application
                    should remain active.
                  </small>
                </span>
              </div>
            ) : null}
            {readiness?.blocking_issues.length ? (
              <IssueList
                title="Blocking issues"
                items={readiness.blocking_issues}
              />
            ) : null}
            {readiness?.recommended_next_actions.length ? (
              <IssueList
                title="Recommended next steps"
                items={readiness.recommended_next_actions}
              />
            ) : null}
          </>
        )}
      </aside>
    </div>
  );
}


export function LinkedResourcesTab({ items }: { items: LinkedResource[] }) {
  return (
    <section className="detail-section detail-resource-section">
      <ResourceHeader
        title="Linked resources"
        description="References, writing, stories, interviews and reminders connected to this application."
      />
      <div className="detail-summary-chips">
        {(
          [
            "reference",
            "writing_document",
            "story",
            "interview",
            "reminder",
          ] as const
        ).map((kind) => (
          <SummaryChip
            key={kind}
            label={linkedResourceKindLabel(kind)}
            value={items.filter((item) => item.kind === kind).length}
          />
        ))}
      </div>
      {items.length ? (
        <div className="detail-data-list">
          {items.map((item) => (
            <article
              className="detail-data-row"
              key={`${item.kind}-${item.id}`}
            >
              <div className="detail-file-icon">
                {linkedResourceIcon(item.kind)}
              </div>
              <div className="detail-row-main">
                <div className="detail-row-title">
                  <strong>{item.title}</strong>
                  <StatusBadge tone="neutral">{label(item.status)}</StatusBadge>
                </div>
                <div className="detail-row-meta">
                  <span>{linkedResourceKindLabel(item.kind)}</span>
                  {item.detail ? <span>{item.detail}</span> : null}
                  <span>{formatDate(item.updated_at)}</span>
                </div>
              </div>
              <div className="detail-row-actions">
                <Link to={linkedResourceHref(item)}>Open</Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Link2}
          heading="No linked resources yet"
          description="References, writing, stories, interviews and reminders connected to this application will appear here."
        />
      )}
    </section>
  );
}

function linkedResourceKindLabel(kind: LinkedResource["kind"]) {
  return {
    reference: "References",
    writing_document: "Writing",
    story: "Stories",
    interview: "Interviews",
    reminder: "Reminders",
  }[kind];
}

function linkedResourceHref(item: LinkedResource) {
  return {
    reference: `/app/references/${item.id}`,
    writing_document: `/app/writing/${item.id}`,
    story: `/app/stories?id=${item.id}`,
    interview: `/app/interviews/${item.id}`,
    reminder: "/app/reminders",
  }[item.kind];
}

function linkedResourceIcon(kind: LinkedResource["kind"]) {
  const Icon = {
    reference: Users,
    writing_document: FileText,
    story: ListChecks,
    interview: Users,
    reminder: CalendarClock,
  }[kind];
  return <Icon aria-hidden="true" />;
}


