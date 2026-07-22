import { ConfirmationDialog } from "../../../components/actions/ConfirmationDialog";
import { formatDate } from "../../applications/model";
import type { Reference } from "../model";

/** Shows the last reminder date so the student doesn't accidentally spam the referee. */
export function SendReminderDialog({
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
      title={`Send a reminder to ${reference.referee_name}?`}
      confirmLabel="Send reminder now"
      pendingLabel="Sending…"
      pending={pending}
      danger={false}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <p>
        {reference.last_reminded_at
          ? `Last reminded on ${formatDate(reference.last_reminded_at)}.`
          : "No reminder has been sent for this request yet."}
      </p>
    </ConfirmationDialog>
  );
}
