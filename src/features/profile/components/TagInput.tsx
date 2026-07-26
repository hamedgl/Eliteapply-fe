import { useId, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

/**
 * Chip editor for the free-text list fields (fields of study, interest tags).
 * A plain comma-joined text input can't work here: re-parsing on every
 * keystroke deletes the separator as the user types it.
 */
export function TagInput({
  label,
  hint,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  hint?: string;
  placeholder?: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [text, setText] = useState("");
  const inputId = useId();
  const hintId = `${inputId}-hint`;

  const commit = (raw: string) => {
    const added = raw
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag && !values.includes(tag));
    if (added.length) onChange([...values, ...added]);
    setText("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit(text);
      return;
    }
    if (event.key === "Backspace" && !text && values.length)
      onChange(values.slice(0, -1));
  };

  return (
    <div className="profile-tag-field">
      <label className="profile-field-label" htmlFor={inputId}>
        {label}
      </label>
      {values.length ? (
        <ul className="profile-tag-row">
          {values.map((tag) => (
            <li className="apps-chip" key={tag}>
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => onChange(values.filter((item) => item !== tag))}
              >
                <X aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <input
        id={inputId}
        value={text}
        placeholder={placeholder}
        aria-describedby={hint ? hintId : undefined}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(text)}
      />
      {hint ? (
        <p className="profile-field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
