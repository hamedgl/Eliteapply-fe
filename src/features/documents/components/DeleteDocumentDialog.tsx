import { ConfirmationDialog } from "../../../components/actions/ConfirmationDialog";
import type { AcademicDocument } from "../model";

export function DeleteDocumentDialog({
  document,
  pending,
  onCancel,
  onConfirm,
}: {
  document: AcademicDocument;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmationDialog
      title={`Delete “${document.display_name}”?`}
      confirmLabel="Delete document"
      pendingLabel="Deleting…"
      pending={pending}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <p>
        This permanently removes the file. Any application links to this
        document will also be removed, and any requirement it satisfied will
        show as missing evidence again. This cannot be undone.
      </p>
    </ConfirmationDialog>
  );
}
