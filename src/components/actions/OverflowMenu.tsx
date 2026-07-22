import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import { createPortal } from "react-dom";
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
  const menuRef = useRef<HTMLUListElement>(null);
  const [position, setPosition] = useState<{
    left: number;
    placement: "top" | "bottom";
    anchor: number;
  } | null>(null);
  useDismiss([rootRef, menuRef], () => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuWidth = 190;
      const menuMaxHeight = 320;
      const gap = 5;
      const viewportPadding = 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      const placement = spaceBelow < menuMaxHeight && rect.top > spaceBelow ? "top" : "bottom";
      setPosition({
        left: Math.min(
          window.innerWidth - menuWidth - viewportPadding,
          Math.max(viewportPadding, rect.right - menuWidth),
        ),
        placement,
        anchor: placement === "bottom" ? rect.bottom + gap : window.innerHeight - rect.top + gap,
      });
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

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
      {open && position ? createPortal(
        <ul
          ref={menuRef}
          className="apps-row-menu-list"
          role="menu"
          style={{
            left: position.left,
            ...(position.placement === "bottom" ? { top: position.anchor } : { bottom: position.anchor }),
          }}
        >
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
        </ul>,
        rootRef.current?.closest(".apps-drawer, .app-shell") ?? document.body,
      ) : null}
    </div>
  );
}
