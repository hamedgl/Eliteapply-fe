import { useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { useDismiss } from "../../lib/dom-hooks";
import { countries, countryName } from "../../lib/countries";

/** Searchable country picker over the native Intl region list — no backend endpoint needed. */
export function CountryCombobox({
  label: fieldLabel,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  useDismiss([rootRef], () => setOpen(false), open);

  const options = useMemo(() => {
    const term = draft.trim().toLocaleLowerCase();
    const matches = term
      ? countries.filter((c) => c.name.toLocaleLowerCase().includes(term) || c.code.toLowerCase() === term)
      : countries;
    return matches.slice(0, 20);
  }, [draft]);

  const select = (code: string) => {
    onChange(code);
    setDraft("");
    setOpen(false);
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
          value={open ? draft : value ? `${countryName(value)} · ${value}` : ""}
          placeholder="Search countries…"
          onFocus={() => {
            setOpen(true);
            setDraft("");
          }}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && options[0]) {
              event.preventDefault();
              select(options[0].code);
            } else if (event.key === "Escape") setOpen(false);
          }}
        />
        {value ? (
          <button
            type="button"
            className="apps-combobox-clear"
            aria-label={`Clear ${fieldLabel}`}
            onClick={() => {
              onChange("");
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
          {options.length ? (
            options.map((country) => (
              <li
                key={country.code}
                role="option"
                aria-selected={country.code === value}
                className="apps-combobox-option"
                onMouseDown={(event) => {
                  event.preventDefault();
                  select(country.code);
                }}
              >
                <span>
                  {country.name} <span className="apps-combobox-hint">· {country.code}</span>
                </span>
                {country.code === value ? <Check aria-hidden="true" /> : null}
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
