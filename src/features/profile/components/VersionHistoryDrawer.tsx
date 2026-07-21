import { useState } from "react";
import { X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ConfirmationDialog } from "../../../components/actions/ConfirmationDialog";
import { formatDate, label as title } from "../../applications/model";

export function VersionHistoryDrawer({
  currentVersion,
  onClose,
}: {
  currentVersion: number | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [confirmingRestore, setConfirmingRestore] = useState(false);

  const versions = useQuery({ queryKey: queryKeys.profileVersions, queryFn: profileApi.versions });
  const version = useQuery({
    queryKey: [...queryKeys.profileVersions, selectedId],
    queryFn: () => profileApi.version(selectedId),
    enabled: Boolean(selectedId),
  });

  const restore = useMutation({
    mutationFn: () => profileApi.restore(selectedId, { expected_version: currentVersion }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.profile }),
        qc.invalidateQueries({ queryKey: queryKeys.profileVersions }),
      ]);
      setConfirmingRestore(false);
      onClose();
    },
  });

  return (
    <div className="apps-drawer-backdrop" role="presentation" onClick={onClose}>
      <section
        className="apps-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="version-history-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="apps-drawer-header">
          <h2 id="version-history-title">Version history</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="apps-drawer-body">
          {versions.isPending ? (
            <p role="status">Loading version history…</p>
          ) : versions.isError ? (
            <p className="apps-notice is-danger">Version history could not be loaded.</p>
          ) : !versions.data?.length ? (
            <p className="apps-dialog-subtext">Your first version will appear here after you save.</p>
          ) : (
            <ul className="profile-version-list">
              {versions.data.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`profile-version-row${selectedId === item.id ? " is-selected" : ""}`}
                    onClick={() => setSelectedId(item.id)}
                    aria-pressed={selectedId === item.id}
                  >
                    <strong>Version {item.version_number}</strong>
                    <span>{formatDate(item.created_at)}</span>
                    <small>{title(item.reason)}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {version.data ? (
            <div className="profile-version-detail">
              <h3>
                Version {version.data.version_number} · {title(version.data.reason)}
              </h3>
              <dl>
                {Object.entries(version.data.snapshot)
                  .slice(0, 10)
                  .map(([key, value]) => (
                    <div key={key}>
                      <dt>{title(key)}</dt>
                      <dd>{summarizeSnapshotValue(value)}</dd>
                    </div>
                  ))}
              </dl>
              <button type="button" className="primary" onClick={() => setConfirmingRestore(true)}>
                Restore this version
              </button>
            </div>
          ) : null}
        </div>
        <footer className="apps-drawer-footer">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </footer>
      </section>

      {confirmingRestore && version.data ? (
        <ConfirmationDialog
          title={`Restore version ${version.data.version_number}?`}
          confirmLabel="Restore version"
          pendingLabel="Restoring…"
          pending={restore.isPending}
          danger={false}
          onCancel={() => setConfirmingRestore(false)}
          onConfirm={() => restore.mutate()}
        >
          <p>
            Your current profile is kept in version history — restoring creates a new
            version rather than deleting anything.
          </p>
        </ConfirmationDialog>
      ) : null}
    </div>
  );
}

function summarizeSnapshotValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.length ? value.join(", ") : "None";
  if (value && typeof value === "object") return "Structured information saved";
  return "Not provided";
}
