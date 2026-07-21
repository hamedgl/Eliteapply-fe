import { Archive, Copy, Download, Trash2 } from "lucide-react";
import { OverflowMenu } from "../../../components/actions/OverflowMenu";
import type { Application } from "../model";

export type ActionKind = "duplicate" | "archive" | "delete" | "export";

/** Applications' row overflow menu, built on the shared OverflowMenu. */
export function RowActionMenu({
  app,
  pending,
  onAction,
}: {
  app: Application;
  pending: boolean;
  onAction: (kind: ActionKind) => void;
}) {
  return (
    <OverflowMenu
      label={`More actions for ${app.title}`}
      items={[
        { key: "duplicate", label: "Duplicate", icon: Copy, disabled: pending, onClick: () => onAction("duplicate") },
        { key: "export", label: "Export", icon: Download, disabled: pending, onClick: () => onAction("export") },
        { key: "archive", label: "Archive", icon: Archive, disabled: pending, onClick: () => onAction("archive") },
        { key: "divider", divider: true },
        { key: "delete", label: "Delete", icon: Trash2, danger: true, disabled: pending, onClick: () => onAction("delete") },
      ]}
    />
  );
}
