import { ConfirmationDialog } from "../../../components/actions/ConfirmationDialog";
import type { Application } from "../model";

/** Applications' delete confirmation, built on the shared ConfirmationDialog. */
export function DeleteApplicationDialog({
  app,
  pending,
  onCancel,
  onConfirm,
  onArchiveInstead,
}: {
  app: Application;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onArchiveInstead: () => void;
}) {
  return (
    <ConfirmationDialog
      title={`Delete “${app.title}”?`}
      confirmLabel={`Delete “${app.title}”`}
      pendingLabel="Deleting…"
      pending={pending}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <p>
        This permanently removes the application, including its requirements,
        tasks, uploaded document links, and any draft motivation letters. This
        cannot be undone.
      </p>
      <p className="apps-delete-alternative">
        Prefer to keep the history?{" "}
        <button
          type="button"
          className="apps-inline-link"
          onClick={onArchiveInstead}
        >
          Archive it instead
        </button>{" "}
        to hide it without losing anything.
      </p>
    </ConfirmationDialog>
  );
}
