import { useRef, useState } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "../../../lib/dom-hooks";
import { CountryCombobox } from "../../../components/filters/CountryCombobox";

export type MatchPreferences = {
  degreeLevel: string;
  fieldOfStudy: string;
  countryCode: string;
  limit: number;
};

export function MatchPreferencesDrawer({
  initial,
  pending,
  onClose,
  onSubmit,
}: {
  initial: MatchPreferences;
  pending: boolean;
  onClose: () => void;
  onSubmit: (prefs: MatchPreferences) => void;
}) {
  const [prefs, setPrefs] = useState(initial);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, true);

  return (
    <div className="apps-drawer-backdrop" role="presentation" onClick={onClose}>
      <section
        className="apps-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-preferences-title"
        ref={panelRef}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="apps-drawer-header">
          <h2 id="match-preferences-title">Match preferences</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(prefs);
          }}
        >
          <div className="apps-drawer-body">
            <label>
              Degree level
              <input
                value={prefs.degreeLevel}
                onChange={(event) => setPrefs({ ...prefs, degreeLevel: event.target.value })}
                placeholder="Master's"
              />
            </label>
            <label>
              Field of study
              <input
                value={prefs.fieldOfStudy}
                onChange={(event) => setPrefs({ ...prefs, fieldOfStudy: event.target.value })}
                placeholder="Public policy"
              />
            </label>
            <CountryCombobox
              label="Country"
              value={prefs.countryCode}
              onChange={(code) => setPrefs({ ...prefs, countryCode: code })}
            />
            <label>
              Number of results
              <select
                value={prefs.limit}
                onChange={(event) => setPrefs({ ...prefs, limit: Number(event.target.value) })}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </label>
          </div>
          <footer className="apps-drawer-footer">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" disabled={pending}>
              {pending ? "Finding matches…" : "Refresh recommendations"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
