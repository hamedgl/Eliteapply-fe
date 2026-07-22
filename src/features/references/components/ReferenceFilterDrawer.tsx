import { useRef } from "react";
import { X } from "lucide-react";
import { Select } from "../../../components/ui/select";
import { EntityCombobox } from "../../../components/filters/EntityCombobox";
import { useFocusTrap } from "../../../lib/dom-hooks";
import { applicationsApi } from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";
import { referenceModes, methodLabel, type ReferenceFilters } from "../model";

const REFEREE_ROLES = ["professor", "supervisor", "teacher", "employer", "mentor"];

export function ReferenceFilterDrawer({
  open,
  onClose,
  filters,
  setFilter,
  resultCount,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  filters: ReferenceFilters;
  setFilter: <K extends keyof ReferenceFilters>(key: K, value: ReferenceFilters[K]) => void;
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
        aria-labelledby="reference-filter-drawer-title"
        ref={panelRef}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <header className="apps-drawer-header">
          <h2 id="reference-filter-drawer-title">Filters</h2>
          <button type="button" onClick={onClose} aria-label="Close filters">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="apps-drawer-body">
          <section className="apps-drawer-group">
            <h3>Reference details</h3>
            <EntityCombobox
              queryKey={queryKeys.applications}
              search={async (search) =>
                (await applicationsApi.list({ search, limit: 10 })).items.map((app) => ({
                  id: app.id,
                  name: app.title,
                }))
              }
              label="Application"
              placeholder="Search your applications…"
              value={filters.applicationId}
              valueLabel={filters.applicationName}
              onChange={(id, name) => {
                setFilter("applicationId", id);
                setFilter("applicationName", name);
              }}
            />
            <label>
              Institution
              <input
                value={filters.institution}
                onChange={(event) => setFilter("institution", event.target.value)}
                placeholder="e.g. University of Oxford"
              />
            </label>
            <label>
              Referee role
              <Select
                value={filters.role}
                onChange={(val: any) => setFilter("role", typeof val === "string" ? val : (val?.target?.value ?? ""))}
                options={[
                  { value: "", label: "All roles" },
                  ...REFEREE_ROLES.map((role) => ({ value: role, label: role })),
                ]}
              />
            </label>
            <label>
              Method
              <Select
                value={filters.mode}
                onChange={(val: any) => setFilter("mode", typeof val === "string" ? val : (val?.target?.value ?? ""))}
                options={[
                  { value: "", label: "All methods" },
                  ...referenceModes.map((mode) => ({ value: mode, label: methodLabel(mode) })),
                ]}
              />
            </label>
            <label>
              Confidentiality mode
              <Select
                value={filters.visibility}
                onChange={(val: any) =>
                  setFilter("visibility", typeof val === "string" ? val : (val?.target?.value ?? ""))
                }
                options={[
                  { value: "", label: "Any" },
                  { value: "student_authored", label: "Student can review" },
                  { value: "referee_confidential", label: "Referee confidential" },
                  { value: "uploaded_document", label: "Uploaded official reference" },
                ]}
              />
            </label>
          </section>

          <section className="apps-drawer-group">
            <h3>Requested date</h3>
            <label>
              After
              <input
                type="date"
                value={filters.requestedFrom}
                onChange={(event) => setFilter("requestedFrom", event.target.value)}
              />
            </label>
            <label>
              Before
              <input
                type="date"
                value={filters.requestedTo}
                onChange={(event) => setFilter("requestedTo", event.target.value)}
              />
            </label>
          </section>

          <section className="apps-drawer-group">
            <h3>Due date</h3>
            <label>
              After
              <input type="date" value={filters.dueFrom} onChange={(event) => setFilter("dueFrom", event.target.value)} />
            </label>
            <label>
              Before
              <input type="date" value={filters.dueTo} onChange={(event) => setFilter("dueTo", event.target.value)} />
            </label>
            <label className="check-field">
              <input
                type="checkbox"
                checked={filters.includeRevoked}
                onChange={(event) => setFilter("includeRevoked", event.target.checked)}
              />{" "}
              Include revoked
            </label>
          </section>
        </div>
        <footer className="apps-drawer-footer">
          <button type="button" onClick={onReset}>
            Reset filters
          </button>
          <button type="button" className="primary" onClick={onClose}>
            {resultCount === null ? "Show results" : `Show ${resultCount} reference${resultCount === 1 ? "" : "s"}`}
          </button>
        </footer>
      </section>
    </div>
  );
}
