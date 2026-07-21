import { ConfirmationDialog } from "../../../components/actions/ConfirmationDialog";

export function DeleteProfileDialog({
  pending,
  onCancel,
  onConfirm,
}: {
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmationDialog
      title="Delete your academic profile?"
      confirmLabel="Delete profile"
      pendingLabel="Deleting…"
      pending={pending}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <p>This removes your goals, education history, tests, languages, research and honors — everything used to power catalogue matching and application pre-fill.</p>
      <p>
        Your applications, documents and stories are not deleted. Recommendation
        quality may drop until you rebuild your profile.
      </p>
    </ConfirmationDialog>
  );
}
