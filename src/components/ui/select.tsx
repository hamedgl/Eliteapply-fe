"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type ChangeEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SPRING_PRESS, SPRING_PANEL } from "./be-ui-button";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface SelectProps {
  options?: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: any) => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  popoverClassName?: string;
  id?: string;
  required?: boolean;
  ariaLabel?: string;
  children?: ReactNode;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options: optionsProp,
      value: valueProp,
      defaultValue,
      onChange,
      name,
      placeholder = "Select an option...",
      disabled = false,
      className,
      triggerClassName,
      popoverClassName,
      id: idProp,
      required,
      ariaLabel,
      children,
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = idProp || generatedId;
    const containerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const [popoverRect, setPopoverRect] = useState<{
      left: number;
      width: number;
      placement: "top" | "bottom";
      anchor: number;
    } | null>(null);

    // Extract options from props or children (<option value="val">Label</option>)
    const parsedOptions: SelectOption[] = [];
    if (optionsProp) {
      parsedOptions.push(...optionsProp);
    } else if (children) {
      const childrenArray = Array.isArray(children) ? children : [children];
      childrenArray.forEach((child: any) => {
        if (child && child.type === "option") {
          parsedOptions.push({
            value: String(child.props.value ?? child.props.children ?? ""),
            label: String(child.props.children ?? child.props.value ?? ""),
            disabled: Boolean(child.props.disabled),
          });
        }
      });
    }

    const isControlled = valueProp !== undefined;
    const resetValue = defaultValue || (parsedOptions[0]?.value ?? "");
    const [internalValue, setInternalValue] = useState<string>(resetValue);
    const currentValue = isControlled ? valueProp : internalValue;

    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
      if (isControlled) return;
      const form = containerRef.current?.closest("form");
      if (!form) return;
      const reset = () => setInternalValue(resetValue);
      form.addEventListener("reset", reset);
      return () => form.removeEventListener("reset", reset);
    }, [isControlled, resetValue]);

    const selectedOption = parsedOptions.find(
      (opt) => String(opt.value) === String(currentValue),
    );

    const handleSelect = useCallback(
      (val: string) => {
        setIsOpen(false);
        if (!isControlled) {
          setInternalValue(val);
        }
        if (onChange) {
          const syntheticEvent = {
            target: { value: val, name: name || "" },
            currentTarget: { value: val, name: name || "" },
            preventDefault: () => {},
            stopPropagation: () => {},
          } as unknown as ChangeEvent<HTMLSelectElement>;

          // Call handler with string value or synthetic event depending on subscriber
          try {
            (onChange as any)(val, syntheticEvent);
          } catch {
            (onChange as any)(syntheticEvent);
          }
        }
      },
      [isControlled, name, onChange],
    );

    // Close popover on outside click
    useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        const target = event.target as Node;
        if (
          containerRef.current &&
          !containerRef.current.contains(target) &&
          popoverRef.current &&
          !popoverRef.current.contains(target)
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }, [isOpen]);

    // Track trigger position so the portaled popover stays anchored,
    // escaping any clipping/stacking-context from scrollable ancestors (e.g. kanban columns).
    useEffect(() => {
      if (!isOpen) return;
      const updateRect = () => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        // matches .custom-select-popover max-height in index.css
        const popoverMaxHeight = 260;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const placement: "top" | "bottom" =
          spaceBelow < popoverMaxHeight && spaceAbove > spaceBelow
            ? "top"
            : "bottom";
        setPopoverRect({
          left: rect.left,
          width: rect.width,
          placement,
          anchor:
            placement === "bottom"
              ? rect.bottom + 6
              : window.innerHeight - rect.top + 6,
        });
      };
      updateRect();
      window.addEventListener("scroll", updateRect, true);
      window.addEventListener("resize", updateRect);
      return () => {
        window.removeEventListener("scroll", updateRect, true);
        window.removeEventListener("resize", updateRect);
      };
    }, [isOpen]);

    // Handle keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (disabled) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (event.key === "Escape") {
        setIsOpen(false);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const currentIndex = parsedOptions.findIndex(
            (o) => String(o.value) === String(currentValue),
          );
          const nextIndex = Math.min(
            currentIndex + 1,
            parsedOptions.length - 1,
          );
          if (parsedOptions[nextIndex]) {
            handleSelect(String(parsedOptions[nextIndex].value));
          }
        }
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const currentIndex = parsedOptions.findIndex(
            (o) => String(o.value) === String(currentValue),
          );
          const prevIndex = Math.max(currentIndex - 1, 0);
          if (parsedOptions[prevIndex]) {
            handleSelect(String(parsedOptions[prevIndex].value));
          }
        }
      }
    };

    return (
      <div
        ref={containerRef}
        className={cn("custom-select-container", className)}
      >
        {/* Hidden input for HTML form integration */}
        {name && <input type="hidden" name={name} value={currentValue ?? ""} />}

        <motion.button
          ref={ref}
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          whileTap={disabled ? undefined : { scale: 0.97 }}
          transition={SPRING_PRESS}
          className={cn("custom-select-trigger", triggerClassName)}
        >
          <span className="custom-select-trigger-label">
            {selectedOption?.icon}
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn("custom-select-chevron", isOpen && "is-open")}
          />
        </motion.button>

        {isOpen &&
          popoverRect &&
          createPortal(
            <AnimatePresence>
              <motion.div
                ref={popoverRef}
                role="listbox"
                aria-activedescendant={
                  selectedOption
                    ? `${id}-opt-${selectedOption.value}`
                    : undefined
                }
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 4, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={SPRING_PANEL}
                className={cn("custom-select-popover", popoverClassName)}
                style={{
                  position: "fixed",
                  left: popoverRect.left,
                  width: popoverRect.width,
                  ...(popoverRect.placement === "bottom"
                    ? { top: popoverRect.anchor, bottom: "auto" }
                    : { top: "auto", bottom: popoverRect.anchor }),
                }}
              >
                {parsedOptions.map((option) => {
                  const isSelected =
                    String(option.value) === String(currentValue);
                  return (
                    <div
                      key={String(option.value)}
                      id={`${id}-opt-${option.value}`}
                      role="option"
                      aria-selected={isSelected}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!option.disabled) {
                          handleSelect(String(option.value));
                        }
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!option.disabled) {
                          handleSelect(String(option.value));
                        }
                      }}
                      className={cn(
                        "custom-select-option",
                        isSelected && "is-selected",
                        option.disabled && "is-disabled",
                      )}
                    >
                      <div className="custom-select-option-content">
                        {option.icon}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                          }}
                        >
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {option.label}
                          </span>
                          {option.description && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--app-muted, #64748b)",
                              }}
                            >
                              {option.description}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="custom-select-check" />}
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>,
            document.body,
          )}
      </div>
    );
  },
);

Select.displayName = "Select";
export default Select;
