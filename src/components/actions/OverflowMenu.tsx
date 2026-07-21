import { useRef, useState } from "react";
import type { ComponentType } from "react";
import { MoreHorizontal } from "lucide-react";
import { useDismiss } from "../../lib/dom-hooks";

export type OverflowMenuItem =
  | {
      key: string;
      label: string;
      icon: ComponentType<{ "aria-hidden"?: boolean | "true" | "false" }>;
      onClick: () => void;
      disabled?: boolean;
      danger?: boolean;
    }
  | { key: string; divider: true };

/** Shared three-dot overflow menu for a row's secondary actions. */
export function OverflowMenu({
  items,
  label,
}: {
  items: OverflowMenuItem[];
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useDismiss([rootRef], () => setOpen(false), open);

  return (
    <div className="apps-row-menu" ref={rootRef}>
      <button
        type="button"
        className="apps-row-menu-trigger"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal aria-hidden="true" />
      </button>
      {open ? (
        <ul className="apps-row-menu-list" role="menu">
          {items.map((item) =>
            "divider" in item ? (
              <li key={item.key} className="apps-row-menu-divider" role="separator" />
            ) : (
              <li key={item.key} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className={item.danger ? "apps-row-menu-danger" : undefined}
                  disabled={item.disabled}
                  onClick={() => {
                    setOpen(false);
                    item.onClick();
                  }}
                >
                  <item.icon aria-hidden="true" /> {item.label}
                </button>
              </li>
            ),
          )}
        </ul>
      ) : null}
    </div>
  );
}
