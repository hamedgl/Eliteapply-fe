import { Link, useNavigate } from "react-router-dom";
import { formatDate, type Application } from "../model";
import { useApplicationSubtitle } from "../hooks";
import { StagePill, TypeTag, PriorityDot, DeadlineCell } from "./Badges";
import { ReadinessIndicator } from "./ReadinessIndicator";
import { RowActionMenu, type ActionKind } from "./RowActionMenu";
import { FilteredEmptyState } from "./EmptyStates";

export function ApplicationsTable({
  apps,
  selected,
  setSelected,
  pending,
  onAction,
  onClearFilters,
}: {
  apps: Application[];
  selected: Set<string>;
  setSelected: (value: Set<string>) => void;
  pending: boolean;
  onAction: (app: Application, kind: ActionKind) => void;
  onClearFilters: () => void;
}) {
  if (!apps.length) return <FilteredEmptyState onClear={onClearFilters} />;
  const allSelected = apps.every((app) => selected.has(app.id));
  return (
    <div className="apps-card apps-table-card">
      <div className="apps-table-scroll">
        <table className="apps-table">
          <thead>
            <tr>
              <th className="apps-table-select">
                <input
                  type="checkbox"
                  aria-label="Select all visible applications"
                  checked={allSelected}
                  onChange={(event) =>
                    setSelected(
                      event.target.checked
                        ? new Set(apps.map((app) => app.id))
                        : new Set(),
                    )
                  }
                />
              </th>
              <th>Application</th>
              <th>Type</th>
              <th>Stage</th>
              <th>Readiness</th>
              <th>Deadline</th>
              <th>Priority</th>
              <th className="apps-table-updated">Last updated</th>
              <th className="apps-table-actions-head">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <ApplicationRow
                key={app.id}
                app={app}
                selected={selected.has(app.id)}
                onToggleSelect={(checked) => {
                  const next = new Set(selected);
                  if (checked) next.add(app.id);
                  else next.delete(app.id);
                  setSelected(next);
                }}
                pending={pending}
                onAction={(kind) => onAction(app, kind)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApplicationRow({
  app,
  selected,
  onToggleSelect,
  pending,
  onAction,
}: {
  app: Application;
  selected: boolean;
  onToggleSelect: (checked: boolean) => void;
  pending: boolean;
  onAction: (kind: ActionKind) => void;
}) {
  const subtitle = useApplicationSubtitle(app);
  const navigate = useNavigate();
  const openPath = `/app/applications/${app.id}`;

  return (
    <tr
      className="apps-row"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button, a, input"))
          return;
        navigate(openPath);
      }}
    >
      <td data-label="Select" className="apps-table-select">
        <input
          type="checkbox"
          aria-label={`Select ${app.title}`}
          checked={selected}
          onChange={(event) => onToggleSelect(event.target.checked)}
        />
      </td>
      <td data-label="Application">
        <Link to={openPath} className="apps-row-title">
          {app.title}
        </Link>
        {subtitle.isLoading ? (
          <span className="apps-row-subtitle apps-row-subtitle-loading" />
        ) : subtitle.name ? (
          <span className="apps-row-subtitle">{subtitle.name}</span>
        ) : null}
        {app.tags.length ? (
          <span className="apps-row-tags">{app.tags.slice(0, 3).join(" · ")}</span>
        ) : null}
      </td>
      <td data-label="Type">
        <TypeTag type={app.application_type} />
      </td>
      <td data-label="Stage">
        <StagePill stage={app.stage} />
      </td>
      <td data-label="Readiness">
        <ReadinessIndicator
          appId={app.id}
          readinessPercent={app.readiness_percent}
          readinessData={app.readiness}
        />
      </td>
      <td data-label="Deadline">
        <DeadlineCell app={app} />
      </td>
      <td data-label="Priority">
        <PriorityDot priority={app.priority} />
      </td>
      <td data-label="Last updated" className="apps-table-updated">
        {formatDate(app.updated_at)}
      </td>
      <td className="apps-table-actions-cell" data-label="Actions">
        <Link to={openPath} className="apps-row-open">
          Open
        </Link>
        <RowActionMenu app={app} pending={pending} onAction={onAction} />
      </td>
    </tr>
  );
}
