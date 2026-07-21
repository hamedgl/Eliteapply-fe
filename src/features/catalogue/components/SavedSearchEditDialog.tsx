import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { discoveryApi } from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";
import { CountryCombobox } from "../../../components/filters/CountryCombobox";
import type { SavedSearch } from "../discoveryModel";

export function SavedSearchEditDialog({ search, onClose }: { search: SavedSearch; onClose: () => void }) {
  const qc = useQueryClient();
  const filters = (search.filters ?? {}) as Record<string, unknown>;
  const [searchTerm, setSearchTerm] = useState(String(filters.search ?? ""));
  const [country, setCountry] = useState(String(filters.country ?? ""));
  const [degreeLevel, setDegreeLevel] = useState(String(filters.degree_level ?? ""));
  const [fieldOfStudy, setFieldOfStudy] = useState(String(filters.field_of_study ?? ""));
  const [verifiedOnly, setVerifiedOnly] = useState(filters.verified === true);
  const [notifyOnMatches, setNotifyOnMatches] = useState(search.notify_on_new_matches);
  const [frequency, setFrequency] = useState(search.notification_frequency);

  const update = useMutation({
    mutationFn: () =>
      discoveryApi.updateSavedSearch(search.id, {
        filters: {
          search: searchTerm || null,
          country: country || null,
          institution_id: (filters.institution_id as string) || null,
          degree_level: degreeLevel || null,
          field_of_study: fieldOfStudy || null,
          verified: verifiedOnly || null,
        },
        notify_on_new_matches: notifyOnMatches,
        notification_frequency: frequency as "instant" | "daily" | "weekly" | "never",
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.savedSearches });
      onClose();
    },
  });

  return (
    <div className="apps-dialog-backdrop" role="presentation" onClick={onClose}>
      <section
        className="apps-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-saved-search-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="apps-dialog-header">
          <h2 id="edit-saved-search-title">Edit “{search.name}”</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            update.mutate();
          }}
        >
          <label className="wide">
            Search term
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
          </label>
          <div>
            <CountryCombobox label="Country" value={country} onChange={setCountry} />
          </div>
          <label>
            Degree level
            <input value={degreeLevel} onChange={(event) => setDegreeLevel(event.target.value)} />
          </label>
          <label className="wide">
            Field of study
            <input value={fieldOfStudy} onChange={(event) => setFieldOfStudy(event.target.value)} />
          </label>
          <label className="check-field wide">
            <input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} />
            Verified only
          </label>
          <label className="check-field wide">
            <input
              type="checkbox"
              checked={notifyOnMatches}
              onChange={(event) => setNotifyOnMatches(event.target.checked)}
            />
            Notify me when new matches appear
          </label>
          {notifyOnMatches ? (
            <label>
              Notification frequency
              <select value={frequency} onChange={(event) => setFrequency(event.target.value)}>
                <option value="instant">Instant</option>
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly digest</option>
              </select>
            </label>
          ) : null}
          <div className="dialog-actions wide">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
