import { StatusBadge } from "../../../components/data-display/StatusBadge";
import { formatDate } from "../../applications/model";
import {
  describeDue,
  describeElapsed,
  describeVisibility,
  linkedApplicationIds,
  methodLabel,
  nextAction,
  statusMeta,
  type Reference,
} from "../model";
import { ApplicationLink } from "./ApplicationLink";
import { ReferenceActionMenu, type ReferenceActionKind } from "./ReferenceActionMenu";
import { FilteredEmptyState } from "./ReferencesEmptyStates";

export function ReferencesTable({
  references,
  pending,
  onView,
  onAction,
  onClearFilters,
}: {
  references: Reference[];
  pending: boolean;
  onView: (reference: Reference) => void;
  onAction: (reference: Reference, kind: ReferenceActionKind) => void;
  onClearFilters: () => void;
}) {
  if (!references.length) return <FilteredEmptyState onClear={onClearFilters} />;
  return (
    <div className="apps-card apps-table-card">
      <div className="apps-table-scroll">
        <table className="apps-table">
          <thead>
            <tr>
              <th>Referee</th>
              <th>Method</th>
              <th>Status</th>
              <th>Application</th>
              <th>Requested</th>
              <th>Due</th>
              <th>Next action</th>
              <th className="apps-table-actions-head">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {references.map((reference) => (
              <ReferenceRow
                key={reference.id}
                reference={reference}
                pending={pending}
                onView={() => onView(reference)}
                onAction={(kind) => onAction(reference, kind)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReferenceRow({
  reference,
  pending,
  onView,
  onAction,
}: {
  reference: Reference;
  pending: boolean;
  onView: () => void;
  onAction: (kind: ReferenceActionKind) => void;
}) {
  const status = statusMeta(reference.status);
  const visibility = describeVisibility(reference);
  const due = describeDue(reference.expires_at);
  const applicationIds = linkedApplicationIds(reference);

  return (
    <tr
      className="apps-row"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button, a, input")) return;
        onView();
      }}
    >
      <td data-label="Referee">
        <button type="button" className="apps-row-title apps-row-title-button" onClick={onView}>
          {reference.referee_name}
        </button>
        <span className="apps-row-subtitle">
          {reference.referee_role}
          {reference.institution ? ` · ${reference.institution}` : " · Institution not provided"}
        </span>
        <span className="apps-row-subtitle">{reference.referee_email_masked}</span>
        <span className={`reference-visibility-badge reference-visibility-${visibility.kind}`}>{visibility.label}</span>
      </td>
      <td data-label="Method">{methodLabel(reference.mode)}</td>
      <td data-label="Status">
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </td>
      <td data-label="Application">
        <ApplicationLink applicationId={applicationIds[0]} />
        {applicationIds.length > 1 ? (
          <span className="apps-row-subtitle">+{applicationIds.length - 1} more</span>
        ) : null}
      </td>
      <td data-label="Requested">{describeElapsed(reference.created_at)}</td>
      <td data-label="Due">
        <span className={due.urgent ? "reference-due reference-due-urgent" : "reference-due"}>
          {formatDate(reference.expires_at)}
        </span>
        <span className="apps-row-subtitle">{due.text}</span>
      </td>
      <td data-label="Next action">
        <span className="reference-next-action">{nextAction(reference)}</span>
      </td>
      <td className="apps-table-actions-cell" data-label="Actions">
        <button type="button" className="apps-row-open" onClick={onView}>
          View reference
        </button>
        <ReferenceActionMenu reference={reference} pending={pending} onAction={onAction} />
      </td>
    </tr>
  );
}
