import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";

/**
 * The backend import endpoint takes structured fields directly — there is no
 * CV/resume upload or AI extraction endpoint (see BE needs). This dialog is
 * scoped to what's real: paste/retype structured values, optionally
 * overwriting the matching existing fields.
 */
export function ImportProfileDialog({
  currentVersion,
  onClose,
}: {
  currentVersion: number | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [error, setError] = useState("");

  const importProfile = useMutation({
    mutationFn: profileApi.import,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.profile }),
        qc.invalidateQueries({ queryKey: queryKeys.profileVersions }),
      ]);
      onClose();
    },
    onError: () => setError("The profile could not be imported. Review the fields and try again."),
  });

  return (
    <div className="apps-dialog-backdrop" role="presentation" onClick={onClose}>
      <section
        className="apps-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-profile-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="apps-dialog-header">
          <div>
            <h2 id="import-profile-title">Import academic profile</h2>
            <p className="apps-dialog-subtext">
              Existing sections are preserved unless you choose to overwrite them.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            importProfile.mutate({
              expected_version: currentVersion,
              applicant_type: String(data.get("applicant_type")) || null,
              intended_study_level: String(data.get("intended_study_level")) || null,
              target_countries: String(data.get("target_countries"))
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
              sections: { education: { summary: String(data.get("education_summary")) } },
              overwrite_existing: data.get("overwrite_existing") === "on",
            });
          }}
        >
          <label>
            Applicant type to import
            <input name="applicant_type" />
          </label>
          <label>
            Study level to import
            <input name="intended_study_level" />
          </label>
          <label className="wide">
            Countries to import
            <input name="target_countries" placeholder="Portugal, United Kingdom" />
          </label>
          <label className="wide">
            Academic background to import
            <textarea name="education_summary" rows={4} />
          </label>
          <label className="check-field wide">
            <input name="overwrite_existing" type="checkbox" /> Overwrite matching existing fields
          </label>
          {error ? (
            <p className="form-error wide" role="alert">
              {error}
            </p>
          ) : null}
          <div className="dialog-actions wide">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" disabled={importProfile.isPending}>
              {importProfile.isPending ? "Importing…" : "Import profile"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
