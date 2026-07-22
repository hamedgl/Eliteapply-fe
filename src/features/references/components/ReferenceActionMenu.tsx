import { Award, Bell, Download, Link2, Pencil, Send, ShieldOff, XCircle } from "lucide-react";
import { OverflowMenu } from "../../../components/actions/OverflowMenu";
import { terminalReferenceStatuses, type Reference } from "../model";

export type ReferenceActionKind =
  | "remind"
  | "resend"
  | "edit"
  | "certificate"
  | "download"
  | "attach"
  | "cancel"
  | "revoke";

/**
 * Real per-action gating, matching what the API actually allows:
 * remind/resend while non-terminal, edit only while `invited`, certificate
 * once approved, letter download once approved and non-confidential, attach
 * only once approved, cancel while non-terminal, revoke unless already
 * revoked.
 */
export function ReferenceActionMenu({
  reference,
  pending,
  onAction,
}: {
  reference: Reference;
  pending: boolean;
  onAction: (kind: ReferenceActionKind) => void;
}) {
  const active = !terminalReferenceStatuses.has(reference.status);
  const editable = reference.status === "invited";
  const approved = Boolean(reference.approved_at);
  const revoked = Boolean(reference.revoked_at) || reference.status === "revoked";

  const topItems = [
    active
      ? { key: "remind", label: "Send reminder", icon: Bell, disabled: pending, onClick: () => onAction("remind") }
      : null,
    active
      ? { key: "resend", label: "Resend invitation", icon: Send, disabled: pending, onClick: () => onAction("resend") }
      : null,
    editable
      ? { key: "edit", label: "Edit request", icon: Pencil, disabled: pending, onClick: () => onAction("edit") }
      : null,
    approved
      ? {
          key: "certificate",
          label: "Download verification certificate",
          icon: Award,
          disabled: pending,
          onClick: () => onAction("certificate"),
        }
      : null,
    approved && !reference.confidential
      ? {
          key: "download",
          label: "Download reference letter",
          icon: Download,
          disabled: pending,
          onClick: () => onAction("download"),
        }
      : null,
    approved
      ? {
          key: "attach",
          label: "Attach to application",
          icon: Link2,
          disabled: pending,
          onClick: () => onAction("attach"),
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  const bottomItems = [
    active
      ? { key: "cancel", label: "Cancel request", icon: XCircle, disabled: pending, onClick: () => onAction("cancel") }
      : null,
    !revoked
      ? {
          key: "revoke",
          label: "Revoke request",
          icon: ShieldOff,
          danger: true,
          disabled: pending,
          onClick: () => onAction("revoke"),
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  const items = [
    ...topItems,
    ...(topItems.length && bottomItems.length ? [{ key: "divider", divider: true as const }] : []),
    ...bottomItems,
  ];

  if (!items.length) return null;
  return <OverflowMenu label={`More actions for ${reference.referee_name}`} items={items} />;
}
