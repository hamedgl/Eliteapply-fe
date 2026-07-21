import { X } from "lucide-react";
import { formatDate, label } from "../model";

export type FilterChip = { key: string; text: string };

export function ActiveFilterChips({
  chips,
  onRemove,
  onClearAll,
}: {
  chips: FilterChip[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}) {
  if (!chips.length) return null;
  return (
    <div className="apps-chip-row" aria-label="Active filters">
      {chips.map((chip) => (
        <button
          type="button"
          className="apps-chip"
          key={chip.key}
          onClick={() => onRemove(chip.key)}
        >
          {chip.text}
          <X aria-hidden="true" />
        </button>
      ))}
      <button type="button" className="apps-chip-clear" onClick={onClearAll}>
        Clear all
      </button>
    </div>
  );
}

/** Builds the chip list from the current URL-backed filter values. */
export function buildFilterChips(values: {
  stage: string;
  applicationType: string;
  priority: string;
  institutionName: string;
  programmeName: string;
  scholarshipName: string;
  deadlineFrom: string;
  deadlineTo: string;
  tag: string;
  archived: string;
}): FilterChip[] {
  const chips: FilterChip[] = [];
  if (values.stage) chips.push({ key: "stage", text: `Stage: ${label(values.stage)}` });
  if (values.applicationType)
    chips.push({ key: "type", text: `Type: ${label(values.applicationType)}` });
  if (values.priority)
    chips.push({ key: "priority", text: `Priority: ${label(values.priority)}` });
  if (values.institutionName)
    chips.push({ key: "institution", text: `Institution: ${values.institutionName}` });
  if (values.programmeName)
    chips.push({ key: "programme", text: `Programme: ${values.programmeName}` });
  if (values.scholarshipName)
    chips.push({ key: "scholarship", text: `Scholarship: ${values.scholarshipName}` });
  if (values.deadlineFrom)
    chips.push({
      key: "deadlineFrom",
      text: `Deadline: after ${formatDate(values.deadlineFrom)}`,
    });
  if (values.deadlineTo)
    chips.push({
      key: "deadlineTo",
      text: `Deadline: before ${formatDate(values.deadlineTo)}`,
    });
  if (values.tag) chips.push({ key: "tag", text: `Tag: ${values.tag}` });
  if (values.archived === "true")
    chips.push({ key: "archived", text: "Including archived" });
  return chips;
}
