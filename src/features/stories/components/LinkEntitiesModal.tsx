import { useState } from "react";
import { X, Link2, Unlink, FileText, Briefcase } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storiesApi } from "../../../lib/api/phase3";
import { applicationsApi, documentsApi } from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";
import type { Story } from "../model";
import type { components } from "../../../generated/api/schema";

type Application = components["schemas"]["ApplicationResponse"];
type AcademicDocument = components["schemas"]["DocumentResponse"];

export function LinkEntitiesModal({
  story,
  open,
  onClose,
}: {
  story: Story;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return <LinkEntitiesContent story={story} onClose={onClose} />;
}

function LinkEntitiesContent({
  story,
  onClose,
}: {
  story: Story;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [selectedAppId, setSelectedAppId] = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [error, setError] = useState("");

  const appsQuery = useQuery({
    queryKey: queryKeys.applications,
    queryFn: () => applicationsApi.list({}),
  });

  const docsQuery = useQuery({
    queryKey: queryKeys.documents,
    queryFn: () => documentsApi.list(),
  });

  const linkApp = useMutation({
    mutationFn: (appId: string) => storiesApi.linkApplication(story.id, appId),
    onSuccess: () => {
      setSelectedAppId("");
      void qc.invalidateQueries({ queryKey: ["stories"] });
    },
    onError: (err: Error) => setError(err.message || "Failed to link application"),
  });

  const unlinkApp = useMutation({
    mutationFn: (appId: string) => storiesApi.unlinkApplication(story.id, appId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["stories"] }),
    onError: (err: Error) => setError(err.message || "Failed to unlink application"),
  });

  const linkDoc = useMutation({
    mutationFn: (docId: string) => storiesApi.linkDocument(story.id, docId),
    onSuccess: () => {
      setSelectedDocId("");
      void qc.invalidateQueries({ queryKey: ["stories"] });
    },
    onError: (err: Error) => setError(err.message || "Failed to link document"),
  });

  const unlinkDoc = useMutation({
    mutationFn: (docId: string) => storiesApi.unlinkDocument(story.id, docId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["stories"] }),
    onError: (err: Error) => setError(err.message || "Failed to unlink document"),
  });

  const linkedAppIds = story.linked_application_ids ?? [];
  const linkedDocIds = story.linked_document_ids ?? [];

  const allApps: Application[] = appsQuery.data?.items ?? [];
  const allDocs: AcademicDocument[] = docsQuery.data ?? [];

  const availableApps = allApps.filter((app) => !linkedAppIds.includes(app.id));
  const availableDocs = allDocs.filter((doc) => !linkedDocIds.includes(doc.id));

  return (
    <div className="apps-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="apps-dialog link-entities-modal"
        role="dialog"
        aria-labelledby="link-entities-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="apps-dialog-header">
          <div className="link-entities-title">
            <Link2 className="icon-link" aria-hidden="true" />
            <h2 id="link-entities-title">Link Applications & Documents</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="apps-dialog-body">
          {error ? <div className="apps-notice is-danger">{error}</div> : null}
          <p className="apps-dialog-subtext">
            Linking stories to applications or academic documents allows automatic context retrieval during essay writing.
          </p>

          <section className="link-entities-section">
            <h3 className="link-entities-section-title">
              <Briefcase aria-hidden="true" /> Linked Applications ({linkedAppIds.length})
            </h3>

            {linkedAppIds.length ? (
              <ul className="apps-linked-list">
                {linkedAppIds.map((appId: string) => {
                  const app = allApps.find((a) => a.id === appId);
                  return (
                    <li key={appId} className="link-entities-item">
                      <span>{app ? app.title : `Application ${appId.slice(0, 8)}`}</span>
                      <button
                        type="button"
                        className="apps-icon-button"
                        title="Unlink application"
                        disabled={unlinkApp.isPending}
                        onClick={() => unlinkApp.mutate(appId)}
                      >
                        <Unlink aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="apps-dialog-subtext link-entities-empty">No applications linked yet.</p>
            )}

            <div className="link-entities-picker">
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                disabled={!availableApps.length || appsQuery.isPending}
              >
                <option value="">
                  {appsQuery.isPending
                    ? "Loading applications…"
                    : availableApps.length
                    ? "Select an application to link…"
                    : "All applications linked"}
                </option>
                {availableApps.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="primary"
                disabled={!selectedAppId || linkApp.isPending}
                onClick={() => linkApp.mutate(selectedAppId)}
              >
                Link
              </button>
            </div>
          </section>

          <section className="link-entities-section">
            <h3 className="link-entities-section-title">
              <FileText aria-hidden="true" /> Linked Documents ({linkedDocIds.length})
            </h3>

            {linkedDocIds.length ? (
              <ul className="apps-linked-list">
                {linkedDocIds.map((docId: string) => {
                  const doc = allDocs.find((d) => d.id === docId);
                  return (
                    <li key={docId} className="link-entities-item">
                      <span>{doc ? doc.display_name : `Document ${docId.slice(0, 8)}`}</span>
                      <button
                        type="button"
                        className="apps-icon-button"
                        title="Unlink document"
                        disabled={unlinkDoc.isPending}
                        onClick={() => unlinkDoc.mutate(docId)}
                      >
                        <Unlink aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="apps-dialog-subtext link-entities-empty">No documents linked yet.</p>
            )}

            <div className="link-entities-picker">
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                disabled={!availableDocs.length || docsQuery.isPending}
              >
                <option value="">
                  {docsQuery.isPending
                    ? "Loading documents…"
                    : availableDocs.length
                    ? "Select a document to link…"
                    : "All documents linked"}
                </option>
                {availableDocs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.display_name} ({doc.category})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="primary"
                disabled={!selectedDocId || linkDoc.isPending}
                onClick={() => linkDoc.mutate(selectedDocId)}
              >
                Link
              </button>
            </div>
          </section>
        </div>

        <footer className="apps-dialog-footer">
          <button type="button" className="primary" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
