"use client";

import {
  AnimatePresence,
  motion,
} from "motion/react";
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
    ref
  ) => {
    const generatedId = useId();
    const id = idProp || generatedId;
    const containerRef = useRef<HTMLDivElement>(null);

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
    const [internalValue, setInternalValue] = useState<string>(
      defaultValue || (parsedOptions[0]?.value ?? "")
    );
    const currentValue = isControlled ? valueProp : internalValue;

    const [isOpen, setIsOpen] = useState(false);

    const selectedOption = parsedOptions.find(
      (opt) => String(opt.value) === String(currentValue)
    );

    const handleSelect = useCallback(
      (val: string) => {
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
        setIsOpen(false);
      },
      [isControlled, name, onChange]
    );

    // Close popover on outside click
    useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
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
            (o) => String(o.value) === String(currentValue)
          );
          const nextIndex = Math.min(currentIndex + 1, parsedOptions.length - 1);
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
            (o) => String(o.value) === String(currentValue)
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
        className={cn("relative inline-block w-full text-left", className)}
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
          className={cn(
            "group relative flex min-h-[44px] w-full items-center justify-between gap-3 rounded-full border border-[var(--app-line-strong,#cfd7e6)] bg-[var(--app-surface,#ffffff)] px-4 py-2 text-sm font-medium text-[var(--app-ink,#1a202c)] shadow-sm transition-colors hover:border-[#7c8aa3] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[var(--app-blue,#2563eb)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            triggerClassName
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedOption?.icon}
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-4 w-4 shrink-0 text-[var(--app-muted,#64748b)] transition-transform duration-200",
              isOpen && "rotate-180 text-[var(--app-blue,#2563eb)]"
            )}
          />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              role="listbox"
              aria-activedescendant={
                selectedOption ? `${id}-opt-${selectedOption.value}` : undefined
              }
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 4, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={SPRING_PANEL}
              className={cn(
                "absolute left-0 top-full z-50 mt-1.5 max-h-64 w-full overflow-auto rounded-2xl border border-[var(--app-line,#e2e8f0)] bg-[var(--app-surface,#ffffff)] p-1.5 shadow-2xl backdrop-blur-md focus:outline-none",
                popoverClassName
              )}
              style={{
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,0.05)",
              }}
            >
              {parsedOptions.map((option) => {
                const isSelected = String(option.value) === String(currentValue);
                return (
                  <div
                    key={String(option.value)}
                    id={`${id}-opt-${option.value}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      if (!option.disabled) {
                        handleSelect(String(option.value));
                      }
                    }}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors",
                      option.disabled && "cursor-not-allowed opacity-40",
                      isSelected
                        ? "bg-[var(--app-blue-light,#eff6ff)] text-[var(--app-blue,#2563eb)] font-semibold"
                        : "text-[var(--app-ink,#1e293b)] hover:bg-[#f1f5f9] hover:text-[var(--app-blue,#2563eb)]"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {option.icon}
                      <div className="flex flex-col truncate">
                        <span className="truncate">{option.label}</span>
                        {option.description && (
                          <span className="text-xs text-[var(--app-muted,#64748b)]">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-[var(--app-blue,#2563eb)]" />
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
