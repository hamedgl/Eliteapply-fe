import { useState } from "react";
import { X } from "lucide-react";
import { EntityCombobox } from "../../../components/filters/EntityCombobox";
import { applicationsApi } from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";
import type { Reference } from "../model";

/** Links an already-approved reference to another application without creating a duplicate request. */
export function AttachApplicationDialog({
  reference,
  pending,
  error,
  onCancel,
  onSubmit,
}: {
  reference: Reference;
  pending: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (applicationId: string) => void;
}) {
  const [applicationId, setApplicationId] = useState("");
  const [applicationName, setApplicationName] = useState("");

  return (
    <div className="apps-dialog-backdrop" role="presentation" onClick={onCancel}>
      <section
        className="apps-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attach-reference-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="apps-dialog-header">
          <h2 id="attach-reference-title">Attach to another application</h2>
          <button type="button" onClick={onCancel} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="apps-dialog-body">
          {error ? <div className="apps-notice is-danger">{error}</div> : null}
          <p className="apps-dialog-subtext">
            Reuses {reference.referee_name}'s already-approved reference on another application — no new invitation is
            sent.
          </p>
          <label>
            Application
            <EntityCombobox
              queryKey={queryKeys.applications}
              search={async (search) =>
                (await applicationsApi.list({ search, limit: 10 })).items.map((app) => ({ id: app.id, name: app.title }))
              }
              label="Application"
              placeholder="Search your applications…"
              value={applicationId}
              valueLabel={applicationName}
              onChange={(id, name) => {
                setApplicationId(id);
                setApplicationName(name);
              }}
            />
          </label>
        </div>
        <div className="apps-dialog-footer">
          <button type="button" onClick={onCancel} disabled={pending}>
            Cancel
          </button>
          <button
            type="button"
            className="primary"
            disabled={pending || !applicationId}
            onClick={() => onSubmit(applicationId)}
          >
            {pending ? "Attaching…" : "Attach"}
          </button>
        </div>
      </section>
    </div>
  );
}
