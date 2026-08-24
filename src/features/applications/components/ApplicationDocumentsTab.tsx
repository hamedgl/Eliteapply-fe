import { useEffect, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertCircle,
  FilePlus2,
  FileText,
  Link2,
  RotateCcw,
  ShieldCheck,
  Unlink,
} from "lucide-react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";
import {
  applicationsApi,
} from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";
import { newMutationId } from "../../../lib/api/mutations";
import { ConfirmationDialog } from "../../../components/actions/ConfirmationDialog";
import { OverflowMenu } from "../../../components/actions/OverflowMenu";
import { EmptyState } from "../../../components/data-display/EmptyState";
import { StatusBadge } from "../../../components/data-display/StatusBadge";
import { Select } from "../../../components/ui/select";
import {
  formatDate,
  label,
} from "../model";
import type { components } from "../../../generated/api/schema";
import "../../../styles/workspace.css";
import {
  ResourceHeader,
  SummaryChip,
  InlineError,
  readableError,
  ResourceRowsSkeleton,
  WorkspaceDrawer,
  DrawerActions,
  optional,
} from "./applicationWorkspaceShared";


type S = components["schemas"];

export function DocumentsTab({
  applicationId,
  requirements,
  initialLinks,
  documents,
  documentsPending,
  documentsError,
  retryDocuments,
  onToast,
}: {
  applicationId: string;
  requirements: S["RequirementResponse"][];
  initialLinks: S["DocumentLinkResponse"][];
  documents: S["DocumentResponse"][];
  documentsPending: boolean;
  documentsError: boolean;
  retryDocuments: () => void;
  onToast: (message: string) => void;
}) {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const [linkOpen, setLinkOpen] = useState(false);
  const [editItem, setEditItem] = useState<S["DocumentLinkResponse"] | null>(
    null,
  );
  const [unlinkItem, setUnlinkItem] = useState<
    S["DocumentLinkResponse"] | null
  >(null);
  useEffect(() => {
    if (params.get("requirement")) setLinkOpen(true);
  }, [params]);
  const links = useQuery({
    queryKey: queryKeys.applicationDocuments(applicationId),
    queryFn: () => applicationsApi.documentLinks(applicationId),
    initialData: initialLinks,
  });
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({
        queryKey: queryKeys.applicationDocuments(applicationId),
      }),
      qc.invalidateQueries({ queryKey: queryKeys.workspace(applicationId) }),
      qc.invalidateQueries({ queryKey: queryKeys.readiness(applicationId) }),
      qc.invalidateQueries({
        queryKey: queryKeys.applicationHistory(applicationId),
      }),
    ]);
  const link = useMutation({
    mutationFn: (
      body: Pick<S["DocumentLinkCreate"], "document_id" | "requirement_id">,
    ) =>
      applicationsApi.linkDocument(applicationId, {
        ...body,
        mutation_id: newMutationId(),
      }),
    onSuccess: async () => {
      setLinkOpen(false);
      onToast("Document linked.");
      await refresh();
    },
  });
  const changeLink = useMutation({
    mutationFn: ({
      item,
      body,
    }: {
      item: S["DocumentLinkResponse"];
      body: Pick<S["DocumentLinkUpdate"], "document_id" | "requirement_id">;
    }) =>
      applicationsApi.updateDocumentLink(applicationId, item.id, {
        ...body,
        mutation_id: newMutationId(),
        expected_version: item.version,
      }),
    onSuccess: async () => {
      setEditItem(null);
      onToast("Document link updated.");
      await refresh();
    },
  });
  const unlink = useMutation({
    mutationFn: (item: S["DocumentLinkResponse"]) =>
      applicationsApi.unlinkDocument(applicationId, item.id),
    onSuccess: async () => {
      setUnlinkItem(null);
      onToast("Document unlinked. The file remains in your vault.");
      await refresh();
    },
  });
  const documentMap = new Map(documents.map((item) => [item.id, item]));
  const requirementMap = new Map(requirements.map((item) => [item.id, item]));
  const linkedRequirementIds = new Set(
    (links.data ?? []).map((item) => item.requirement_id).filter(Boolean),
  );
  const missing = requirements.filter(
    (item) => item.required && !linkedRequirementIds.has(item.id),
  );
  const linkedDocuments = (links.data ?? []).map((item) => ({
    link: item,
    document: item.document ?? documentMap.get(item.document_id),
  }));
  const processing = linkedDocuments.filter(
    ({ document }) => document?.malware_status === "pending",
  ).length;
  const review = linkedDocuments.filter(
    ({ document }) =>
      document &&
      document.malware_status !== "clean" &&
      document.malware_status !== "pending",
  ).length;

  return (
    <section className="detail-section detail-resource-section">
      <ResourceHeader
        title="Documents"
        description="Connect secure vault documents to the requirements they support."
        actions={
          <>
            <Link className="detail-secondary-link" to="/app/documents">
              Open document vault
            </Link>
            <button
              type="button"
              className="primary"
              onClick={() => setLinkOpen(true)}
            >
              <Link2 aria-hidden="true" /> Link document
            </button>
          </>
        }
      />
      <div className="detail-summary-chips">
        <SummaryChip label="Linked" value={linkedDocuments.length} />
        <SummaryChip
          label="Missing required"
          value={missing.length}
          tone={missing.length ? "danger" : undefined}
        />
        <SummaryChip label="Processing" value={processing} />
        <SummaryChip label="Needs review" value={review} />
      </div>
      {documentsError ? (
        <InlineError
          message="Vault documents could not be loaded."
          onRetry={retryDocuments}
        />
      ) : null}
      {documentsPending ? (
        <ResourceRowsSkeleton />
      ) : linkedDocuments.length ? (
        <div className="detail-data-list">
          {linkedDocuments.map(({ link: item, document }) => (
            <article className="detail-data-row document-row" key={item.id}>
              <div className="detail-file-icon">
                <FileText aria-hidden="true" />
              </div>
              <div className="detail-row-main">
                <div className="detail-row-title">
                  <strong>{document?.display_name || "Linked document"}</strong>
                  <StatusBadge
                    tone={
                      document?.malware_status === "clean"
                        ? "green"
                        : document?.malware_status === "pending"
                          ? "amber"
                          : "red"
                    }
                  >
                    {securityStatus(document?.malware_status)}
                  </StatusBadge>
                </div>
                <div className="detail-row-meta">
                  <span>
                    {document ? label(document.category) : "Document"}
                  </span>
                  <span>
                    {item.requirement_id
                      ? requirementMap.get(item.requirement_id)?.title ||
                        "Linked requirement"
                      : "Application-wide"}
                  </span>
                  <span>Added {formatDate(item.created_at)}</span>
                  <span>
                    {document?.expires_at
                      ? `Expires ${formatDate(document.expires_at)}`
                      : "No expiration"}
                  </span>
                </div>
                <small>Source: Document vault</small>
              </div>
              <div className="detail-row-actions">
                {document ? (
                  <Link to={`/app/documents/${document.id}`}>Preview</Link>
                ) : null}
                <OverflowMenu
                  label={`More actions for ${document?.display_name || "linked document"}`}
                  items={[
                    ...(document
                      ? [
                          {
                            key: "open",
                            label: "Open in document vault",
                            icon: FileText,
                            onClick: () =>
                              location.assign(`/app/documents/${document.id}`),
                          },
                        ]
                      : []),
                    {
                      key: "replace",
                      label: "Replace document",
                      icon: RotateCcw,
                      onClick: () => setEditItem(item),
                    },
                    {
                      key: "requirement",
                      label: "Change requirement",
                      icon: Link2,
                      onClick: () => setEditItem(item),
                    },
                    { key: "divider", divider: true as const },
                    {
                      key: "unlink",
                      label: "Unlink",
                      icon: Unlink,
                      danger: true,
                      onClick: () => setUnlinkItem(item),
                    },
                  ]}
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          heading="No documents are linked to this application"
          description="Link a secure document from your vault to the application or a specific requirement."
          primaryAction={{
            label: "Link document",
            onClick: () => setLinkOpen(true),
          }}
          secondaryAction={
            <Link to="/app/documents?upload=1">Upload document</Link>
          }
        />
      )}
      {missing.length ? (
        <section className="detail-missing-documents">
          <h3>Missing required documents</h3>
          <ul>
            {missing.map((item) => (
              <li key={item.id}>
                <AlertCircle aria-hidden="true" />
                <span>{item.title}</span>
                <button type="button" onClick={() => setLinkOpen(true)}>
                  Link document
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {linkOpen ? (
        <LinkDocumentDrawer
          documents={documents}
          linkedIds={
            new Set((links.data ?? []).map((item) => item.document_id))
          }
          requirements={requirements}
          initialRequirementId={params.get("requirement") ?? ""}
          pending={link.isPending}
          error={link.error}
          onClose={() => setLinkOpen(false)}
          onSubmit={(body) => link.mutate(body)}
        />
      ) : null}
      {editItem ? (
        <LinkDocumentDrawer
          documents={documents}
          linkedIds={
            new Set(
              (links.data ?? [])
                .filter((item) => item.id !== editItem.id)
                .map((item) => item.document_id),
            )
          }
          requirements={requirements}
          initialRequirementId={editItem.requirement_id ?? ""}
          initialDocumentId={editItem.document_id}
          title="Update document link"
          pending={changeLink.isPending}
          error={changeLink.error}
          onClose={() => setEditItem(null)}
          onSubmit={(body) => changeLink.mutate({ item: editItem, body })}
        />
      ) : null}
      {unlinkItem ? (
        <ConfirmationDialog
          title="Unlink document?"
          confirmLabel="Unlink document"
          pending={unlink.isPending}
          onCancel={() => setUnlinkItem(null)}
          onConfirm={() => unlink.mutate(unlinkItem)}
        >
          <p>
            This removes the link only. The document remains secure in your
            vault.
          </p>
          {unlink.error ? (
            <InlineError message={readableError(unlink.error)} />
          ) : null}
        </ConfirmationDialog>
      ) : null}
    </section>
  );
}


function LinkDocumentDrawer({
  documents,
  linkedIds,
  requirements,
  initialRequirementId,
  initialDocumentId = "",
  title = "Link document",
  pending,
  error,
  onClose,
  onSubmit,
}: {
  documents: S["DocumentResponse"][];
  linkedIds: Set<string>;
  requirements: S["RequirementResponse"][];
  initialRequirementId: string;
  initialDocumentId?: string;
  title?: string;
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (
    body: Pick<S["DocumentLinkCreate"], "document_id" | "requirement_id">,
  ) => void;
}) {
  const eligible = documents.filter(
    (document) =>
      !linkedIds.has(document.id) && document.malware_status === "clean",
  );
  return (
    <WorkspaceDrawer
      title={title}
      description="Only documents with a completed security scan are available."
      onClose={onClose}
    >
      {eligible.length ? (
        <form
          className="detail-drawer-form"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            onSubmit({
              document_id: String(data.get("document_id")),
              requirement_id: optional(data.get("requirement_id")),
            });
          }}
        >
          <label>
            Document
            <Select
              name="document_id"
              required
              defaultValue={initialDocumentId}
              placeholder="Choose a document"
              options={eligible.map((document) => ({
                value: document.id,
                label: `${document.display_name} · ${label(document.category)}`,
              }))}
            />
          </label>
          <label>
            Requirement
            <Select
              name="requirement_id"
              defaultValue={initialRequirementId}
              options={[
                { value: "", label: "Whole application" },
                ...requirements.map((item) => ({
                  value: item.id,
                  label: item.title,
                })),
              ]}
            />
          </label>
          <p className="detail-security-note">
            <ShieldCheck aria-hidden="true" /> Security scan complete for
            available documents.
          </p>
          {error ? <InlineError message={readableError(error)} /> : null}
          <DrawerActions
            pending={pending}
            submitLabel={initialDocumentId ? "Update link" : "Link document"}
            onCancel={onClose}
          />
        </form>
      ) : (
        <EmptyState
          icon={FilePlus2}
          heading="No eligible document is available"
          description="Upload a document or review your existing files in the document vault."
          secondaryAction={
            <div className="apps-empty-actions">
              <Link className="primary" to="/app/documents?upload=1">
                Upload document
              </Link>
              <Link to="/app/documents">Open document vault</Link>
            </div>
          }
        />
      )}
    </WorkspaceDrawer>
  );
}



function securityStatus(value?: string) {
  if (value === "clean") return "Security scan complete";
  if (value === "pending") return "Security scan in progress";
  if (!value) return "Status unavailable";
  return "Document needs review";
}
