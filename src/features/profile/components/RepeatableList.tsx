import { useState, type ComponentType, type ReactNode } from "react";
import { ChevronDown, Copy, Plus, Trash2 } from "lucide-react";
import { OverflowMenu } from "../../../components/actions/OverflowMenu";
import { EmptyState } from "../../../components/data-display/EmptyState";
import { newId } from "../model";

/** Shared repeatable-entry editor for Education / Tests / Languages / Research / Honors. */
export function RepeatableList<T extends { id: string }>({
  entries,
  onChange,
  createEntry,
  renderSummary,
  renderMeta,
  renderFields,
  addLabel,
  emptyIcon,
  emptyHeading,
  emptyText,
}: {
  entries: T[];
  onChange: (next: T[]) => void;
  createEntry: () => T;
  renderSummary: (entry: T) => ReactNode;
  /** Optional second line on the collapsed row, so the list stays scannable. */
  renderMeta?: (entry: T) => ReactNode;
  renderFields: (entry: T, update: (patch: Partial<T>) => void) => ReactNode;
  addLabel: string;
  emptyIcon: ComponentType<{
    "aria-hidden"?: boolean | "true" | "false";
    className?: string;
  }>;
  emptyHeading: string;
  emptyText: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<T>) =>
    onChange(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  const remove = (id: string) => onChange(entries.filter((entry) => entry.id !== id));
  const duplicate = (entry: T) => {
    const copy = { ...entry, id: newId() };
    onChange([...entries, copy]);
    setExpandedId(copy.id);
  };
  const add = () => {
    const entry = createEntry();
    onChange([...entries, entry]);
    setExpandedId(entry.id);
  };

  if (!entries.length)
    return (
      <EmptyState
        variant="filtered"
        icon={emptyIcon}
        heading={emptyHeading}
        description={emptyText}
        primaryAction={{ label: addLabel, onClick: add }}
      />
    );

  return (
    <div className="profile-repeatable">
      <ul className="profile-entry-list">
        {entries.map((entry) => {
          const expanded = expandedId === entry.id;
          const meta = renderMeta?.(entry);
          return (
            <li
              className={`profile-entry-card${expanded ? " is-open" : ""}`}
              key={entry.id}
            >
              <div className="profile-entry-head">
                <button
                  type="button"
                  className="profile-entry-summary"
                  aria-expanded={expanded}
                  onClick={() => setExpandedId(expanded ? null : entry.id)}
                >
                  <ChevronDown aria-hidden="true" className="profile-entry-caret" />
                  <span className="profile-entry-text">
                    <span className="profile-entry-title">{renderSummary(entry)}</span>
                    {meta ? <span className="profile-entry-meta">{meta}</span> : null}
                  </span>
                </button>
                <OverflowMenu
                  label="Entry actions"
                  items={[
                    { key: "duplicate", label: "Duplicate", icon: Copy, onClick: () => duplicate(entry) },
                    { key: "divider", divider: true },
                    { key: "delete", label: "Delete", icon: Trash2, danger: true, onClick: () => remove(entry.id) },
                  ]}
                />
              </div>
              {expanded ? (
                <div className="profile-entry-fields form-grid">
                  {renderFields(entry, (patch) => update(entry.id, patch))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      <button type="button" className="profile-add-button" onClick={add}>
        <Plus aria-hidden="true" /> {addLabel}
      </button>
    </div>
  );
}
