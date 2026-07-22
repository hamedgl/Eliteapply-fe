import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import "../../styles/workspace.css";

/**
 * Shared confirmation dialog for destructive/irreversible actions. Uses the
 * native <dialog> element so focus is trapped and restored automatically.
 */
export function ConfirmationDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  pendingLabel,
  pending,
  danger = true,
  onCancel,
  onConfirm,
}: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  pendingLabel?: string;
  pending: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = dialogRef.current;
    if (node && !node.open) node.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="apps-dialog apps-delete-dialog"
      aria-labelledby="confirmation-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <header>
        <h2 id="confirmation-dialog-title">{title}</h2>
        <button
          type="button"
          className="dialog-close"
          onClick={onCancel}
          aria-label="Close"
        >
          <X aria-hidden="true" />
        </button>
      </header>
      {children}
      <div className="dialog-actions">
        <button type="button" onClick={onCancel} disabled={pending}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={danger ? "apps-danger-button" : "primary"}
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? (pendingLabel ?? "Working…") : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
