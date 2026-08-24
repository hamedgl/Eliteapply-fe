import { ConfirmationDialog } from "../../../components/actions/ConfirmationDialog";
import type { Application } from "../model";

/** Applications' archive confirmation, built on the shared ConfirmationDialog. */
export function ArchiveApplicationDialog({
  app,
  pending,
  onCancel,
  onConfirm,
}: {
  app: Application;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmationDialog
      title={`Archive “${app.title}”?`}
      confirmLabel="Archive application"
      pendingLabel="Archiving…"
      pending={pending}
      danger={false}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <p>Its current stage will be kept for a future restore.</p>
    </ConfirmationDialog>
  );
}
