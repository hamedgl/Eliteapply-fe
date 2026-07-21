import { label, priorities, stages } from "../model";
import { Select } from "../../../components/ui/select";

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
        <Select
          value={bulkStage}
          onChange={(val: any) => setBulkStage(typeof val === "string" ? val : (val?.target?.value ?? ""))}
          options={[
            { value: "", label: "Keep stage" },
            ...stages.map((item) => ({
              value: item,
              label: label(item),
            })),
          ]}
        />
      </label>
      <label>
        Change priority
        <Select
          value={bulkPriority}
          onChange={(val: any) => setBulkPriority(typeof val === "string" ? val : (val?.target?.value ?? ""))}
          options={[
            { value: "", label: "Keep priority" },
            ...priorities.map((item) => ({
              value: item,
              label: label(item),
            })),
          ]}
        />
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
