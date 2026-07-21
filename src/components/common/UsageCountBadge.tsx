import { useState } from "react";
import { Link2 } from "lucide-react";
import { UsageModal } from "./UsageModal";

export function UsageCountBadge({
  entityType,
  entityId,
  entityTitle,
  count,
}: {
  entityType: string;
  entityId: string;
  entityTitle?: string;
  count: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="apps-chip"
        title="View places where this item is referenced"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Link2 aria-hidden="true" />
        <span>Used in {count} place{count === 1 ? "" : "s"}</span>
      </button>

      <UsageModal
        entityType={entityType}
        entityId={entityId}
        entityTitle={entityTitle}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
