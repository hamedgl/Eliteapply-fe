import { label, priorities, stages } from "../model";

export function BulkActionBar({
  count,
  bulkStage,
  setBulkStage,
  bulkPriority,
  setBulkPriority,
  bulkTags,
  setBulkTags,
  pending,
  onApply,
  onClear,
}: {
  count: number;
  bulkStage: string;
  setBulkStage: (value: string) => void;
  bulkPriority: string;
  setBulkPriority: (value: string) => void;
  bulkTags: string;
  setBulkTags: (value: string) => void;
  pending: boolean;
  onApply: () => void;
  onClear: () => void;
}) {
  if (!count) return null;
  return (
    <div
      className="apps-bulk-bar"
      role="region"
      aria-label="Bulk application actions"
    >
      <strong>{count} selected</strong>
      <label>
        Change stage
        <select value={bulkStage} onChange={(event) => setBulkStage(event.target.value)}>
          <option value="">Keep stage</option>
          {stages.map((item) => (
            <option value={item} key={item}>
              {label(item)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Change priority
        <select
          value={bulkPriority}
          onChange={(event) => setBulkPriority(event.target.value)}
        >
          <option value="">Keep priority</option>
          {priorities.map((item) => (
            <option value={item} key={item}>
              {label(item)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Add tags
        <input
          value={bulkTags}
          onChange={(event) => setBulkTags(event.target.value)}
          placeholder="funding, UK"
        />
      </label>
      <button
        className="primary"
        type="button"
        disabled={(!bulkStage && !bulkPriority && !bulkTags.trim()) || pending}
        onClick={onApply}
      >
        Apply
      </button>
      <button type="button" onClick={onClear}>
        Clear selection
      </button>
    </div>
  );
}
