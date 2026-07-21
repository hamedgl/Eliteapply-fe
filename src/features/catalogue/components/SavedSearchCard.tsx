import { Copy, Pencil, RefreshCw, SlidersHorizontal, Trash2 } from "lucide-react";
import { OverflowMenu } from "../../../components/actions/OverflowMenu";
import { formatDate } from "../../applications/model";
import { countryName } from "../../../lib/countries";
import { describeFilters, type SavedSearch } from "../discoveryModel";

export function SavedSearchCard({
  search,
  running,
  onRun,
  onRename,
  onEditFilters,
  onDuplicate,
  onDelete,
}: {
  search: SavedSearch;
  running: boolean;
  onRun: () => void;
  onRename: () => void;
  onEditFilters: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const filters = (search.filters ?? {}) as Record<string, unknown>;
  return (
    <article className="apps-card discovery-saved-card">
      <div>
        <h3>{search.name}</h3>
        <p className="discovery-saved-summary">{describeFilters(search.entity_type, filters, countryName)}</p>
        <p className="discovery-saved-meta">
          {search.last_run_at ? `Last run ${formatDate(search.last_run_at)}` : "Not run yet"}
          {" · "}
          {search.notify_on_new_matches
            ? `Notifications: ${search.notification_frequency}`
            : "Notifications off"}
        </p>
      </div>
      <div className="discovery-saved-actions">
        <button type="button" className="apps-row-open" disabled={running} onClick={onRun}>
          <RefreshCw aria-hidden="true" /> {running ? "Running…" : "Run search"}
        </button>
        <OverflowMenu
          label={`More actions for ${search.name}`}
          items={[
            { key: "rename", label: "Rename", icon: Pencil, onClick: onRename },
            { key: "filters", label: "Edit filters", icon: SlidersHorizontal, onClick: onEditFilters },
            { key: "duplicate", label: "Duplicate", icon: Copy, onClick: onDuplicate },
            { key: "divider", divider: true },
            { key: "delete", label: "Delete", icon: Trash2, danger: true, onClick: onDelete },
          ]}
        />
      </div>
    </article>
  );
}
