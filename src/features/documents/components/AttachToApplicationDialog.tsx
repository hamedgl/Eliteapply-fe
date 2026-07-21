import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { applicationsApi } from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";
import { EntityCombobox } from "../../../components/filters/EntityCombobox";
import { label } from "../../applications/model";
import type { AcademicDocument } from "../model";

export function AttachToApplicationDialog({
  document,
  onClose,
}: {
  document: AcademicDocument;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [applicationId, setApplicationId] = useState("");
  const [applicationTitle, setApplicationTitle] = useState("");
  const [requirementId, setRequirementId] = useState("");

  const requirements = useQuery({
    queryKey: queryKeys.requirements(applicationId),
    queryFn: ({ signal }) => applicationsApi.requirements(applicationId, signal),
    enabled: Boolean(applicationId),
  });

  const attach = useMutation({
    mutationFn: () =>
      applicationsApi.linkDocument(applicationId, {
        document_id: document.id,
        requirement_id: requirementId || null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.workspace(applicationId) });
      onClose();
    },
  });

  return (
    <div className="apps-dialog-backdrop" role="presentation">
      <section
        className="apps-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attach-title"
      >
        <header>
          <div>
            <h2 id="attach-title">Attach to application</h2>
            <p>Connect “{document.display_name}” to one of your applications.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            attach.mutate();
          }}
        >
          <div className="wide">
            <EntityCombobox
              queryKey={queryKeys.applications}
              search={async (search) => {
                const result = await applicationsApi.list({ search, limit: 10 });
                return result.items.map((app) => ({
                  id: app.id,
                  name: app.title,
                  hint: label(app.stage),
                }));
              }}
              label="Application"
              placeholder="Search your applications…"
              value={applicationId}
              valueLabel={applicationTitle}
              onChange={(id, name) => {
                setApplicationId(id);
                setApplicationTitle(name);
                setRequirementId("");
              }}
            />
          </div>
          {applicationId ? (
            <label className="wide">
              Requirement (optional)
              <select
                value={requirementId}
                onChange={(event) => setRequirementId(event.target.value)}
                disabled={requirements.isPending}
              >
                <option value="">Not tied to a specific requirement</option>
                {requirements.data?.map((req) => (
                  <option value={req.id} key={req.id}>
                    {req.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {attach.isError ? (
            <p className="form-error wide" role="alert">
              This document could not be attached. Try again.
            </p>
          ) : null}
          <div className="dialog-actions wide">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" disabled={!applicationId || attach.isPending}>
              {attach.isPending ? "Attaching…" : "Attach"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
