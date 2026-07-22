import { forwardRef } from "react";
import { Filter as FilterIcon, Search, X } from "lucide-react";
import { Select } from "../../../components/ui/select";
import { referenceStatuses, referenceTypes, statusMeta, referenceTypeLabel } from "../model";

export const SORT_OPTIONS = [
  { value: "requested_desc", text: "Requested: newest" },
  { value: "requested_asc", text: "Requested: oldest" },
  { value: "due_asc", text: "Due: soonest" },
  { value: "due_desc", text: "Due: latest" },
  { value: "referee_asc", text: "Referee: A to Z" },
] as const;

export const ReferencesToolbar = forwardRef<
  HTMLInputElement,
  {
    search: string;
    onSearch: (value: string) => void;
    status: string;
    onStatus: (value: string) => void;
    referenceType: string;
    onReferenceType: (value: string) => void;
    sort: string;
    onSort: (value: string) => void;
    onOpenDrawer: () => void;
    drawerActiveCount: number;
  }
>(function ReferencesToolbar(
  { search, onSearch, status, onStatus, referenceType, onReferenceType, sort, onSort, onOpenDrawer, drawerActiveCount },
  searchRef,
) {
  return (
    <div className="apps-card apps-toolbar">
      <div className="apps-toolbar-search">
        <Search aria-hidden="true" />
        <input
          ref={searchRef}
          type="search"
          aria-label="Search referees, institutions or applications"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search referees, institutions or applications"
        />
        {search ? (
          <button type="button" aria-label="Clear search" onClick={() => onSearch("")}>
            <X aria-hidden="true" />
          </button>
        ) : (
          <kbd>/</kbd>
        )}
      </div>
      <label className="apps-quick-filter">
        <span>Status</span>
        <Select
          value={status}
          onChange={(val: any) => onStatus(typeof val === "string" ? val : (val?.target?.value ?? ""))}
          options={[
            { value: "", label: "All statuses" },
            ...referenceStatuses.map((item) => ({ value: item, label: statusMeta(item).label })),
          ]}
        />
      </label>
      <label className="apps-quick-filter">
        <span>Type</span>
        <Select
          value={referenceType}
          onChange={(val: any) => onReferenceType(typeof val === "string" ? val : (val?.target?.value ?? ""))}
          options={[
            { value: "", label: "All types" },
            ...referenceTypes.map((item) => ({ value: item, label: referenceTypeLabel(item) })),
          ]}
        />
      </label>
      <button type="button" className="apps-filters-trigger" onClick={onOpenDrawer} aria-haspopup="dialog">
        <FilterIcon aria-hidden="true" /> Filters
        {drawerActiveCount ? <span className="apps-filters-badge">{drawerActiveCount}</span> : null}
      </button>
      <label className="apps-sort">
        Sort
        <Select
          value={sort}
          onChange={(val: any) => onSort(typeof val === "string" ? val : (val?.target?.value ?? "requested_desc"))}
          options={SORT_OPTIONS.map((option) => ({ value: option.value, label: option.text }))}
        />
      </label>
    </div>
  );
});
