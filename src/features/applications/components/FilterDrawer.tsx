import { useRef } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "../hooks";
import { catalogueApi } from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";
import { label, priorities, types, type Application } from "../model";
import { EntityCombobox } from "../../../components/filters/EntityCombobox";

export type DrawerFilters = {
  applicationType: string;
  institutionId: string;
  institutionName: string;
  programmeId: string;
  programmeName: string;
  scholarshipId: string;
  scholarshipName: string;
  deadlineFrom: string;
  deadlineTo: string;
  tag: string;
  priority: string;
  archived: boolean;
};

export function FilterDrawer({
  open,
  onClose,
  filters,
  setFilter,
  knownTags,
  resultCount,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  filters: DrawerFilters;
  setFilter: <K extends keyof DrawerFilters>(
    key: K,
    value: DrawerFilters[K],
  ) => void;
  knownTags: string[];
  resultCount: number | null;
  onReset: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  if (!open) return null;

  return (
    <div className="apps-drawer-backdrop" role="presentation" onClick={onClose}>
      <section
        className="apps-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-drawer-title"
        ref={panelRef}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <header className="apps-drawer-header">
          <h2 id="filter-drawer-title">Filters</h2>
          <button type="button" onClick={onClose} aria-label="Close filters">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="apps-drawer-body">
          <section className="apps-drawer-group">
            <h3>Application details</h3>
            <EntityCombobox
              queryKey={queryKeys.catalogue("institutions", {})}
              search={async (search, signal) =>
                (await catalogueApi.institutions({ search }, signal)).items.map(
                  (item) => ({ id: item.id, name: item.name, hint: item.country_code }),
                )
              }
              label="Institution"
              placeholder="Search institutions…"
              value={filters.institutionId}
              valueLabel={filters.institutionName}
              onChange={(id, name) => {
                setFilter("institutionId", id);
                setFilter("institutionName", name);
              }}
            />
            <EntityCombobox
              queryKey={queryKeys.catalogue("programmes", {})}
              search={async (search, signal) =>
                (await catalogueApi.programmes({ search }, signal)).items.map(
                  (item) => ({ id: item.id, name: item.name, hint: item.degree_level }),
                )
              }
              label="Programme"
              placeholder="Search programmes…"
              value={filters.programmeId}
              valueLabel={filters.programmeName}
              onChange={(id, name) => {
                setFilter("programmeId", id);
                setFilter("programmeName", name);
              }}
            />
            <EntityCombobox
              queryKey={queryKeys.catalogue("scholarships", {})}
              search={async (search, signal) =>
                (await catalogueApi.scholarships({ search }, signal)).items.map(
                  (item) => ({ id: item.id, name: item.name, hint: item.provider_name }),
                )
              }
              label="Scholarship"
              placeholder="Search scholarships…"
              value={filters.scholarshipId}
              valueLabel={filters.scholarshipName}
              onChange={(id, name) => {
                setFilter("scholarshipId", id);
                setFilter("scholarshipName", name);
              }}
            />
            <label>
              Application type
              <select
                value={filters.applicationType}
                onChange={(event) =>
                  setFilter("applicationType", event.target.value)
                }
              >
                <option value="">All types</option>
                {types.map((item) => (
                  <option value={item} key={item}>
                    {label(item)}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="apps-drawer-group">
            <h3>Timing</h3>
            <label>
              Deadline from
              <input
                type="date"
                value={filters.deadlineFrom}
                onChange={(event) =>
                  setFilter("deadlineFrom", event.target.value)
                }
              />
            </label>
            <label>
              Deadline to
              <input
                type="date"
                value={filters.deadlineTo}
                onChange={(event) => setFilter("deadlineTo", event.target.value)}
              />
            </label>
          </section>

          <section className="apps-drawer-group">
            <h3>Organisation</h3>
            <label>
              Tag
              <select
                value={filters.tag}
                onChange={(event) => setFilter("tag", event.target.value)}
              >
                <option value="">All tags</option>
                {knownTags.map((tag) => (
                  <option value={tag} key={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select
                value={filters.priority}
                onChange={(event) => setFilter("priority", event.target.value)}
              >
                <option value="">All priorities</option>
                {priorities.map((item) => (
                  <option value={item} key={item}>
                    {label(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="check-field">
              <input
                type="checkbox"
                checked={filters.archived}
                onChange={(event) => setFilter("archived", event.target.checked)}
              />{" "}
              Include archived
            </label>
          </section>
        </div>
        <footer className="apps-drawer-footer">
          <button type="button" onClick={onReset}>
            Reset filters
          </button>
          <button type="button" className="primary" onClick={onClose}>
            {resultCount === null
              ? "Show results"
              : `Show ${resultCount} application${resultCount === 1 ? "" : "s"}`}
          </button>
        </footer>
      </section>
    </div>
  );
}

/** Tags observed across the currently loaded applications, for the tag filter's options. */
export function collectKnownTags(apps: Application[]) {
  return [...new Set(apps.flatMap((app) => app.tags))].sort();
}
