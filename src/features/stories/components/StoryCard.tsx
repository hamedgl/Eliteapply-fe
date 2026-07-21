import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Pencil,
  Trash2,
  Sparkles,
  Link2,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { StatusBadge } from "../../../components/data-display/StatusBadge";
import { OverflowMenu, type OverflowMenuItem } from "../../../components/actions/OverflowMenu";
import { UsageCountBadge } from "../../../components/common/UsageCountBadge";
import { formatDate } from "../../applications/model";
import { label, readEvidence, sensitivityMeta, storyReadiness, type Story } from "../model";

export function StoryCard({
  story,
  onEdit,
  onDuplicate,
  onDelete,
  onArchive,
  onUnarchive,
  onAiAssist,
  onLinkEntities,
}: {
  story: Story;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onAiAssist?: () => void;
  onLinkEntities?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const readiness = storyReadiness(story);
  const evidence = readEvidence(story.evidence);
  const sensitivity = sensitivityMeta[story.sensitivity];
  const isArchived = Boolean(story.is_archived);

  const linkedAppsCount = story.linked_application_ids?.length ?? 0;
  const linkedDocsCount = story.linked_document_ids?.length ?? 0;

  const menuItems: OverflowMenuItem[] = [
    { key: "edit", label: "Edit", icon: Pencil, onClick: onEdit },
    ...(onAiAssist
      ? [{ key: "ai_assist", label: "AI Polish & Assist", icon: Sparkles, onClick: onAiAssist }]
      : []),
    ...(onLinkEntities
      ? [{ key: "link_entities", label: "Link Apps & Docs", icon: Link2, onClick: onLinkEntities }]
      : []),
    { key: "duplicate", label: "Duplicate", icon: Copy, onClick: onDuplicate },
    { key: "divider1", divider: true },
    ...(isArchived && onUnarchive
      ? [{ key: "unarchive", label: "Unarchive Story", icon: ArchiveRestore, onClick: onUnarchive }]
      : !isArchived && onArchive
        ? [{ key: "archive", label: "Archive Story", icon: Archive, onClick: onArchive }]
        : []),
    { key: "divider2", divider: true },
    { key: "delete", label: "Delete", icon: Trash2, danger: true, onClick: onDelete },
  ];

  return (
    <article className={`apps-card story-card ${isArchived ? "is-archived" : ""}`}>
      <button
        type="button"
        className="story-card-summary"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="story-card-heading">
          <h3>{story.title}</h3>
          {isArchived ? (
            <StatusBadge tone="grey">Archived</StatusBadge>
          ) : (
            <StatusBadge tone={sensitivity.tone}>{sensitivity.label}</StatusBadge>
          )}
          <StatusBadge tone={readiness.ready ? "green" : "amber"}>{readiness.text}</StatusBadge>
        </div>
        <p className="story-card-outcome">{story.outcome}</p>
        <div className="story-card-meta">
          <span>{label(story.category)}</span>
          {story.skills_values?.length ? <span>{story.skills_values.join(", ")}</span> : null}
          <span>
            {evidence.length} evidence item{evidence.length === 1 ? "" : "s"}
          </span>
          {linkedAppsCount > 0 || linkedDocsCount > 0 ? (
            <span>
              🔗 {linkedAppsCount} app{linkedAppsCount === 1 ? "" : "s"}, {linkedDocsCount} doc{linkedDocsCount === 1 ? "" : "s"}
            </span>
          ) : null}
          <span>
            {story.updated_at ? `Updated ${formatDate(story.updated_at)}` : `Added ${formatDate(story.created_at)}`}
          </span>
        </div>
        {expanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
      </button>

      {expanded ? (
        <div className="story-card-body">
          <dl>
            <div>
              <dt>Situation</dt>
              <dd>{story.situation}</dd>
            </div>
            <div>
              <dt>Action</dt>
              <dd>{story.action}</dd>
            </div>
            <div>
              <dt>Outcome</dt>
              <dd>{story.outcome}</dd>
            </div>
            {story.reflection ? (
              <div>
                <dt>Reflection</dt>
                <dd>{story.reflection}</dd>
              </div>
            ) : null}
          </dl>
          {evidence.length ? (
            <div className="story-evidence">
              <h4>Evidence</h4>
              <ul>
                {evidence.map((item, index) => (
                  <li key={index}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        {item.label}
                      </a>
                    ) : (
                      item.label
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {story.prompt_types?.length ? (
            <p className="story-prompt-types">Suited for: {story.prompt_types.join(", ")}</p>
          ) : null}
        </div>
      ) : null}

      <div className="story-card-actions">
        <button type="button" className="apps-row-open" onClick={onEdit}>
          Open story
        </button>

        {onAiAssist ? (
          <button
            type="button"
            className="apps-row-open story-ai-assist-button"
            onClick={onAiAssist}
            title="AI Polish & Assist"
          >
            <Sparkles aria-hidden="true" />
            AI Assist
          </button>
        ) : null}

        <UsageCountBadge
          entityType="story"
          entityId={story.id}
          entityTitle={story.title}
          count={story.usage_count}
        />

        <OverflowMenu label={`More actions for ${story.title}`} items={menuItems} />
      </div>
    </article>
  );
}
