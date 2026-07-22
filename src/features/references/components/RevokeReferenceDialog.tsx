import { ConfirmationDialog } from "../../../components/actions/ConfirmationDialog";
import type { Reference } from "../model";

/** Revoking is destructive and distinct from cancelling — explained in full before it happens. */
export function RevokeReferenceDialog({
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
      title={`Revoke the request to ${reference.referee_name}?`}
      confirmLabel="Revoke reference request"
      pendingLabel="Revoking…"
      pending={pending}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <p>
        {reference.referee_name} will no longer be able to submit through their existing link. Any
        content they already submitted or that was approved is retained according to the product's audit
        rules — revoking does not delete audit evidence. The application using this reference may be
        affected.
      </p>
    </ConfirmationDialog>
  );
}
