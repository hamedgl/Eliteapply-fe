import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from "lucide-react";
import { OverflowMenu } from "../../../components/actions/OverflowMenu";
import { newId } from "../model";

/** Shared repeatable-entry editor for Education / Tests / Languages / Research / Honors. */
export function RepeatableList<T extends { id: string }>({
  entries,
  onChange,
  createEntry,
  renderSummary,
  renderFields,
  addLabel,
  emptyText,
}: {
  entries: T[];
  onChange: (next: T[]) => void;
  createEntry: () => T;
  renderSummary: (entry: T) => ReactNode;
  renderFields: (entry: T, update: (patch: Partial<T>) => void) => ReactNode;
  addLabel: string;
  emptyText: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<T>) =>
    onChange(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  const remove = (id: string) => onChange(entries.filter((entry) => entry.id !== id));
  const duplicate = (entry: T) => {
    const copy = { ...entry, id: newId() };
    onChange([...entries, copy]);
  };
  const add = () => {
    const entry = createEntry();
    onChange([...entries, entry]);
    setExpandedId(entry.id);
  };

  return (
    <div className="profile-repeatable">
      {entries.length ? (
        <ul className="profile-entry-list">
          {entries.map((entry) => {
            const expanded = expandedId === entry.id;
            return (
              <li className="profile-entry-card" key={entry.id}>
                <button
                  type="button"
                  className="profile-entry-summary"
                  aria-expanded={expanded}
                  onClick={() => setExpandedId(expanded ? null : entry.id)}
                >
                  <span>{renderSummary(entry)}</span>
                  {expanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
                </button>
                {expanded ? (
                  <div className="profile-entry-fields form-grid">
                    {renderFields(entry, (patch) => update(entry.id, patch))}
                  </div>
                ) : null}
                <div className="profile-entry-actions">
                  <OverflowMenu
                    label="Entry actions"
                    items={[
                      { key: "duplicate", label: "Duplicate", icon: Copy, onClick: () => duplicate(entry) },
                      { key: "divider", divider: true },
                      { key: "delete", label: "Delete", icon: Trash2, danger: true, onClick: () => remove(entry.id) },
                    ]}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="profile-entry-empty">{emptyText}</p>
      )}
      <button type="button" className="apps-inline-link" onClick={add}>
        <Plus aria-hidden="true" /> {addLabel}
      </button>
    </div>
  );
}
