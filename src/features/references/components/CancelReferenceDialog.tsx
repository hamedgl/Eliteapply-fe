import { ConfirmationDialog } from "../../../components/actions/ConfirmationDialog";
import type { Reference } from "../model";

export function CancelReferenceDialog({
  reference,
  pending,
  onCancel,
  onConfirm,
}: {
  reference: Reference;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmationDialog
      title={`Cancel the request to ${reference.referee_name}?`}
      confirmLabel="Cancel request"
      pendingLabel="Cancelling…"
      pending={pending}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <p>{reference.referee_name} will no longer be able to respond to this request.</p>
    </ConfirmationDialog>
  );
}
