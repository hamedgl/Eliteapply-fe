import { useRef } from "react";
import { X } from "lucide-react";
import { Select } from "../../../components/ui/select";
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
  onChange,
  knownTags,
  resultCount,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  filters: DrawerFilters;
  onChange: (updates: Partial<DrawerFilters>) => void;
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
        className="apps-drawer applications-filter-drawer"
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
          <div>
            <h2 id="filter-drawer-title">Filters</h2>
            <p>Selections stay visible and update results instantly.</p>
          </div>
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
                onChange({ institutionId: id, institutionName: name });
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
                onChange({ programmeId: id, programmeName: name });
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
                onChange({ scholarshipId: id, scholarshipName: name });
              }}
            />
            <label>
              Application type
              <Select
                value={filters.applicationType}
                onChange={(val) =>
                  onChange({
                    applicationType:
                      typeof val === "string"
                        ? val
                        : (val?.target?.value ?? ""),
                  })
                }
                options={[
                  { value: "", label: "All types" },
                  ...types.map((item) => ({
                    value: item,
                    label: label(item),
                  })),
                ]}
              />
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
                  onChange({ deadlineFrom: event.target.value })
                }
              />
            </label>
            <label>
              Deadline to
              <input
                type="date"
                value={filters.deadlineTo}
                onChange={(event) =>
                  onChange({ deadlineTo: event.target.value })
                }
              />
            </label>
          </section>

          <section className="apps-drawer-group">
            <h3>Organisation</h3>
            <label>
              Tag
              <Select
                value={filters.tag}
                onChange={(val) =>
                  onChange({
                    tag:
                      typeof val === "string"
                        ? val
                        : (val?.target?.value ?? ""),
                  })
                }
                options={[
                  { value: "", label: "All tags" },
                  ...knownTags.map((tag) => ({
                    value: tag,
                    label: tag,
                  })),
                ]}
              />
            </label>
            <label>
              Priority
              <Select
                value={filters.priority}
                onChange={(val) =>
                  onChange({
                    priority:
                      typeof val === "string"
                        ? val
                        : (val?.target?.value ?? ""),
                  })
                }
                options={[
                  { value: "", label: "All priorities" },
                  ...priorities.map((item) => ({
                    value: item,
                    label: label(item),
                  })),
                ]}
              />
            </label>
            <label className="check-field">
              <input
                type="checkbox"
                checked={filters.archived}
                onChange={(event) =>
                  onChange({ archived: event.target.checked })
                }
              />{" "}
              Include archived
            </label>
          </section>
        </div>
        <footer className="apps-drawer-footer">
          <span className="apps-drawer-result" role="status" aria-live="polite">
            {resultCount === null
              ? "Updating results…"
              : `${resultCount} matching application${resultCount === 1 ? "" : "s"}`}
          </span>
          <div className="apps-drawer-actions">
            <button type="button" onClick={onReset}>
              Reset
            </button>
            <button type="button" className="primary" onClick={onClose}>
              Done
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

/** Tags observed across the currently loaded applications, for the tag filter's options. */
export function collectKnownTags(apps: Application[]) {
  return [...new Set(apps.flatMap((app) => app.tags))].sort();
}
