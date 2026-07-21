import { useState } from "react";
import { X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Select } from "../../../components/ui/select";
import { catalogueApi } from "../../../lib/api/phase2";

export function ReportIssueDialog({
  entityType,
  entityId,
  entityTitle,
  open,
  onClose,
}: {
  entityType: "institution" | "programme" | "scholarship";
  entityId: string;
  entityTitle: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <ReportForm
      entityType={entityType}
      entityId={entityId}
      entityTitle={entityTitle}
      onClose={onClose}
    />
  );
}

function ReportForm({
  entityType,
  entityId,
  entityTitle,
  onClose,
}: {
  entityType: "institution" | "programme" | "scholarship";
  entityId: string;
  entityTitle: string;
  onClose: () => void;
}) {
  const [issueType, setIssueType] = useState("outdated_deadline");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const report = useMutation({
    mutationFn: () =>
      catalogueApi.reportIssue({
        entity_type: entityType,
        entity_id: entityId,
        issue_type: issueType,
        description,
      }),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to submit issue report.");
    },
  });

  return (
    <div className="apps-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="apps-dialog"
        role="dialog"
        aria-labelledby="report-issue-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="apps-dialog-header">
          <h2 id="report-issue-title">Report Catalogue Issue</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>

        {submitted ? (
          <div className="apps-dialog-body">
            <div className="apps-notice is-success">
              Thank you! Your issue report for <strong>{entityTitle}</strong> has been submitted to our data review team.
            </div>
            <footer className="apps-dialog-footer">
              <button type="button" className="primary" onClick={onClose}>
                Done
              </button>
            </footer>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              report.mutate();
            }}
          >
            <div className="apps-dialog-body">
              {error ? <div className="apps-notice is-danger">{error}</div> : null}
              <p className="apps-dialog-subtext">
                Reporting issue for <strong>{entityTitle}</strong> ({entityType})
              </p>
              <label>
                Issue type
                <Select
                  value={issueType}
                  onChange={(val) => setIssueType(typeof val === "string" ? val : (val?.target?.value ?? "outdated_deadline"))}
                  options={[
                    { value: "outdated_deadline", label: "Outdated Deadline" },
                    { value: "incorrect_requirements", label: "Incorrect Admission Requirements" },
                    { value: "broken_link", label: "Broken / Invalid Link" },
                    { value: "wrong_tuition_fee", label: "Wrong Tuition / Fee Information" },
                    { value: "duplicate_listing", label: "Duplicate Entry" },
                    { value: "other", label: "Other Information Inaccuracy" },
                  ]}
                />
              </label>
              <label>
                Description / Correct details
                <textarea
                  required
                  rows={4}
                  placeholder="Please describe the issue or provide the updated official link/details…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
            </div>
            <footer className="apps-dialog-footer">
              <button type="button" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="primary"
                disabled={!description.trim() || report.isPending}
              >
                {report.isPending ? "Submitting…" : "Submit Report"}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}
