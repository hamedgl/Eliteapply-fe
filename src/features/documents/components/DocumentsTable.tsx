import { Link } from "react-router-dom";
import {
  Download,
  FileImage,
  FileText,
  Link2,
  Pencil,
  Upload,
  History,
  Activity,
  Trash2,
} from "lucide-react";
import { formatDate, label } from "../../applications/model";
import { StatusBadge } from "../../../components/data-display/StatusBadge";
import { OverflowMenu } from "../../../components/actions/OverflowMenu";
import { UsageCountBadge } from "../../../components/common/UsageCountBadge";
import { FilteredEmptyState } from "./EmptyStates";
import { expiryInfo, formatBytes, scanStatus, type AcademicDocument } from "../model";

const FILE_ICON = (contentType: string) =>
  contentType.startsWith("image/") ? FileImage : FileText;

export function DocumentsTable({
  documents,
  selected,
  setSelected,
  onDownload,
  onAttach,
  onEditMetadata,
  onReplaceVersion,
  onViewVersions,
  onViewActivity,
  onDelete,
  onClearFilters,
}: {
  documents: AcademicDocument[];
  selected: Set<string>;
  setSelected: (value: Set<string>) => void;
  onDownload: (doc: AcademicDocument) => void;
  onAttach: (doc: AcademicDocument) => void;
  onEditMetadata: (doc: AcademicDocument) => void;
  onReplaceVersion: (doc: AcademicDocument) => void;
  onViewVersions: (doc: AcademicDocument) => void;
  onViewActivity: (doc: AcademicDocument) => void;
  onDelete: (doc: AcademicDocument) => void;
  onClearFilters: () => void;
}) {
  if (!documents.length) return <FilteredEmptyState onClear={onClearFilters} />;
  const allSelected = documents.every((doc) => selected.has(doc.id));
  return (
    <div className="apps-card apps-table-card">
      <div className="apps-table-scroll">
        <table className="apps-table">
          <thead>
            <tr>
              <th className="apps-table-select">
                <input
                  type="checkbox"
                  aria-label="Select all visible documents"
                  checked={allSelected}
                  onChange={(event) =>
                    setSelected(
                      event.target.checked
                        ? new Set(documents.map((doc) => doc.id))
                        : new Set(),
                    )
                  }
                />
              </th>
              <th>File</th>
              <th>Type</th>
              <th>Status</th>
              <th>Expiration</th>
              <th>Tags & Links</th>
              <th className="apps-table-actions-head">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const scan = scanStatus(doc.malware_status);
              const expiry = expiryInfo(doc.expires_at);
              const Icon = FILE_ICON(doc.content_type);
              const usable = scan.tone === "green";
              return (
                <tr className="apps-row" key={doc.id}>
                  <td data-label="Select" className="apps-table-select">
                    <input
                      type="checkbox"
                      aria-label={`Select ${doc.display_name}`}
                      checked={selected.has(doc.id)}
                      onChange={(event) => {
                        const next = new Set(selected);
                        if (event.target.checked) next.add(doc.id);
                        else next.delete(doc.id);
                        setSelected(next);
                      }}
                    />
                  </td>
                  <td data-label="File">
                    <div className="docs-file-cell">
                      <Icon aria-hidden="true" />
                      <div>
                        <Link to={`/app/documents/${doc.id}`} className="apps-row-title">
                          {doc.display_name}
                        </Link>
                        <span className="apps-row-subtitle">
                          v{doc.version} · {formatBytes(doc.size_bytes)} · Added {formatDate(doc.created_at)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Type">{label(doc.category)}</td>
                  <td data-label="Status">
                    <StatusBadge tone={scan.tone === "neutral" ? "grey" : scan.tone}>
                      {scan.text}
                    </StatusBadge>
                  </td>
                  <td data-label="Expiration">
                    <div className={`apps-deadline apps-deadline-${expiry.urgency}`}>
                      <span className="apps-deadline-primary">{expiry.text}</span>
                    </div>
                  </td>
                  <td data-label="Tags & Links">
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {doc.tags?.length ? (
                        <span className="apps-row-tags">{doc.tags.join(" · ")}</span>
                      ) : null}
                      {doc.link_count > 0 ? (
                        <UsageCountBadge
                          entityType="document"
                          entityId={doc.id}
                          entityTitle={doc.display_name}
                          count={doc.link_count}
                        />
                      ) : null}
                    </div>
                  </td>
                  <td className="apps-table-actions-cell" data-label="Actions">
                    <Link to={`/app/documents/${doc.id}`} className="apps-row-open">
                      View
                    </Link>
                    <OverflowMenu
                      label={`More actions for ${doc.display_name}`}
                      items={[
                        {
                          key: "edit",
                          label: "Edit metadata",
                          icon: Pencil,
                          onClick: () => onEditMetadata(doc),
                        },
                        {
                          key: "replace",
                          label: "Upload new version",
                          icon: Upload,
                          onClick: () => onReplaceVersion(doc),
                        },
                        {
                          key: "versions",
                          label: "Version history",
                          icon: History,
                          onClick: () => onViewVersions(doc),
                        },
                        {
                          key: "activity",
                          label: "Audit log",
                          icon: Activity,
                          onClick: () => onViewActivity(doc),
                        },
                        { key: "divider1", divider: true },
                        {
                          key: "download",
                          label: "Download",
                          icon: Download,
                          disabled: !usable,
                          onClick: () => onDownload(doc),
                        },
                        {
                          key: "attach",
                          label: "Attach to application",
                          icon: Link2,
                          disabled: !usable,
                          onClick: () => onAttach(doc),
                        },
                        { key: "divider2", divider: true },
                        {
                          key: "delete",
                          label: "Delete",
                          icon: Trash2,
                          danger: true,
                          onClick: () => onDelete(doc),
                        },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
