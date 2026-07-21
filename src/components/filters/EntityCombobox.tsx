import { useId, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { useDismiss } from "../../lib/dom-hooks";

export type EntityOption = { id: string; name: string; hint?: string | null };

/**
 * Searchable combobox over any human-readable entity (institution, programme,
 * scholarship, application, ...). Filters/forms send only the selected id —
 * the label is shown for humans, never a raw UUID.
 */
export function EntityCombobox({
  queryKey,
  search,
  label: fieldLabel,
  placeholder,
  value,
  valueLabel,
  onChange,
}: {
  queryKey: readonly unknown[];
  search: (query: string, signal?: AbortSignal) => Promise<EntityOption[]>;
  label: string;
  placeholder: string;
  value: string;
  valueLabel: string;
  onChange: (id: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const query = useQuery({
    queryKey: [...queryKey, draft],
    queryFn: ({ signal }) => search(draft, signal),
    enabled: open,
    staleTime: 60_000,
  });
  const options = useMemo<EntityOption[]>(() => query.data ?? [], [query.data]);

  useDismiss([rootRef], () => setOpen(false), open);

  const selectOption = (option: EntityOption) => {
    onChange(option.id, option.name);
    setDraft("");
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div className="apps-combobox" ref={rootRef}>
      <label className="apps-combobox-label" htmlFor={`${listId}-input`}>
        {fieldLabel}
      </label>
      <div className="apps-combobox-control">
        <input
          id={`${listId}-input`}
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
          }
          value={open ? draft : value ? valueLabel : ""}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true);
            setDraft("");
          }}
          onChange={(event) => {
            setDraft(event.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => Math.min(index + 1, options.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              const option = options[activeIndex];
              if (option) selectOption(option);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {value ? (
          <button
            type="button"
            className="apps-combobox-clear"
            aria-label={`Clear ${fieldLabel}`}
            onClick={() => {
              onChange("", "");
              setDraft("");
              inputRef.current?.focus();
            }}
          >
            <X aria-hidden="true" />
          </button>
        ) : (
          <ChevronDown aria-hidden="true" className="apps-combobox-chevron" />
        )}
      </div>
      {open ? (
        <ul className="apps-combobox-list" role="listbox" id={listId}>
          {query.isPending ? (
            <li className="apps-combobox-status">
              <Loader2 aria-hidden="true" className="apps-spin" /> Searching…
            </li>
          ) : options.length ? (
            options.map((option, index) => (
              <li
                key={option.id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={option.id === value}
                className={`apps-combobox-option${index === activeIndex ? " is-active" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectOption(option);
                }}
              >
                <span>
                  {option.name}
                  {option.hint ? (
                    <span className="apps-combobox-hint"> · {option.hint}</span>
                  ) : null}
                </span>
                {option.id === value ? <Check aria-hidden="true" /> : null}
              </li>
            ))
          ) : (
            <li className="apps-combobox-status">No results</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
