import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FileStack,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { documentsApi } from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
import { openSignedDownload } from "../../lib/api/signedTransport";
import { formatDate, label } from "../applications/model";
import { PageHeader } from "../../components/page/PageHeader";
import { SummaryStrip } from "../../components/page/SummaryStrip";
import { StatusBadge } from "../../components/data-display/StatusBadge";
import { documentCategories, expiryInfo, formatBytes, scanStatus, type AcademicDocument } from "./model";
import { DocumentsTable } from "./components/DocumentsTable";
import { UploadDialog } from "./components/UploadDialog";
import { AttachToApplicationDialog } from "./components/AttachToApplicationDialog";
import { DeleteDocumentDialog } from "./components/DeleteDocumentDialog";
import { ConfirmationDialog } from "../../components/actions/ConfirmationDialog";
import { OnboardingEmptyState } from "./components/EmptyStates";
import "../../styles/workspace.css";
import "./documents.css";

import { EditMetadataDialog } from "./components/EditMetadataDialog";
import { ReplaceVersionDialog } from "./components/ReplaceVersionDialog";
import { DocumentVersionsDrawer } from "./components/DocumentVersionsDrawer";
import { DocumentActivityDrawer } from "./components/DocumentActivityDrawer";

function invalidateDocuments(qc: ReturnType<typeof useQueryClient>) {
  void Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.documents }),
    qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
  ]);
}

export function DocumentsPage() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [attaching, setAttaching] = useState<AcademicDocument | null>(null);
  const [deleting, setDeleting] = useState<AcademicDocument | null>(null);
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);
  const [editingDoc, setEditingDoc] = useState<AcademicDocument | null>(null);
  const [replacingDoc, setReplacingDoc] = useState<AcademicDocument | null>(null);
  const [versionsDoc, setVersionsDoc] = useState<AcademicDocument | null>(null);
  const [activityDoc, setActivityDoc] = useState<AcademicDocument | null>(null);
  const [notice, setNotice] = useState("");

  const search = params.get("search") ?? "";
  const typeFilter = params.get("type") ?? "";
  const statusFilter = params.get("status") ?? "";
  const sort = params.get("sort") ?? "recent";
  const setParam = (key: string, value: string) => {
    const copy = new URLSearchParams(params);
    if (value) copy.set(key, value);
    else copy.delete(key);
    setParams(copy, { replace: true });
  };

  const query = useQuery({
    queryKey: queryKeys.documents,
    queryFn: documentsApi.list,
  });

  const remove = useMutation({
    mutationFn: (id: string) => documentsApi.remove(id),
    onSuccess: (_data, id) => {
      invalidateDocuments(qc);
      setSelected((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    },
  });

  const documents = query.data ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    let list = documents.filter((doc) => {
      if (term && !doc.display_name.toLocaleLowerCase().includes(term)) return false;
      if (typeFilter && doc.category !== typeFilter) return false;
      if (statusFilter) {
        const scan = scanStatus(doc.malware_status);
        const expiry = expiryInfo(doc.expires_at);
        if (statusFilter === "ready" && scan.tone !== "green") return false;
        if (statusFilter === "processing" && scan.tone !== "amber") return false;
        if (statusFilter === "blocked" && scan.tone !== "red") return false;
        if (
          statusFilter === "expiring" &&
          !(expiry.urgency === "warn" || expiry.urgency === "critical")
        )
          return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.display_name.localeCompare(b.display_name);
      if (sort === "expiring") {
        if (!a.expires_at) return 1;
        if (!b.expires_at) return -1;
        return a.expires_at.localeCompare(b.expires_at);
      }
      return b.created_at.localeCompare(a.created_at);
    });
    return list;
  }, [documents, search, typeFilter, statusFilter, sort]);

  const stats = useMemo(() => {
    const expiringSoon = documents.filter((doc) => {
      const urgency = expiryInfo(doc.expires_at).urgency;
      return urgency === "warn" || urgency === "critical";
    });
    const needsAttention = documents.filter(
      (doc) => scanStatus(doc.malware_status).tone === "red",
    );
    const ready = documents.filter((doc) => scanStatus(doc.malware_status).tone === "green");
    return {
      total: documents.length,
      ready: ready.length,
      expiringSoon: expiringSoon.length,
      needsAttention: needsAttention.length,
    };
  }, [documents]);

  const clearFilters = () => {
    setParams(new URLSearchParams(), { replace: true });
  };

  async function download(doc: AcademicDocument) {
    const scan = scanStatus(doc.malware_status);
    if (scan.tone !== "green") return;
    openSignedDownload((await documentsApi.download(doc.id)).download_url);
  }

  if (query.isPending)
    return (
      <div className="apps-skeleton" aria-busy="true" aria-label="Loading documents">
        <div className="apps-skeleton-summary">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="skeleton apps-skeleton-summary-item" key={i} />
          ))}
        </div>
        <div className="skeleton apps-skeleton-toolbar" />
        <div className="apps-skeleton-table">
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="skeleton apps-skeleton-row" key={i} />
          ))}
        </div>
      </div>
    );
  if (query.isError)
    return (
      <div className="apps-page-error" role="alert">
        <h1>We couldn’t load your documents.</h1>
        <button className="primary" onClick={() => query.refetch()}>
          Try again
        </button>
      </div>
    );

  return (
    <div className="page">
      <PageHeader
        title="Academic Documents"
        description="Manage transcripts, certificates, recommendation letters, and test scores"
        actions={
          <button className="primary" type="button" onClick={() => setUploading(true)}>
            <Plus aria-hidden="true" /> Upload document
          </button>
        }
      />

      <SummaryStrip
        metrics={[
          {
            key: "total",
            label: "Total documents",
            value: stats.total,
            icon: FileStack,
          },
          {
            key: "ready",
            label: "Ready to use",
            value: stats.ready,
            icon: CheckCircle2,
          },
          {
            key: "expiring",
            label: "Expiring soon",
            value: stats.expiringSoon,
            attention: stats.expiringSoon > 0,
            icon: CalendarClock,
          },
          {
            key: "attention",
            label: "Needs attention",
            value: stats.needsAttention,
            attention: stats.needsAttention > 0,
            icon: AlertTriangle,
          },
        ]}
      />

      {notice ? (
        <p className="inline-success" role="status">
          {notice}
        </p>
      ) : null}

      {documents.length ? (
        <>
          <div className="apps-card apps-toolbar">
            <div className="apps-toolbar-search">
              <Search aria-hidden="true" />
              <input
                type="search"
                placeholder="Search documents…"
                aria-label="Search documents"
                value={search}
                onChange={(event) => setParam("search", event.target.value)}
              />
              {search ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setParam("search", "")}
                >
                  <X aria-hidden="true" />
                </button>
              ) : null}
            </div>

            <label className="apps-quick-filter">
              Category
              <select
                value={typeFilter}
                onChange={(event) => setParam("type", event.target.value)}
              >
                <option value="">All categories</option>
                {documentCategories.map((item) => (
                  <option key={item} value={item}>
                    {item.replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase())}
                  </option>
                ))}
              </select>
            </label>

            <label className="apps-quick-filter">
              Status
              <select
                value={statusFilter}
                onChange={(event) => setParam("status", event.target.value)}
              >
                <option value="">All statuses</option>
                <option value="ready">Ready to use</option>
                <option value="processing">Scanning</option>
                <option value="blocked">Flagged</option>
                <option value="expiring">Expiring soon</option>
              </select>
            </label>

            <label className="apps-sort">
              Sort
              <select
                value={sort}
                onChange={(event) => setParam("sort", event.target.value)}
              >
                <option value="recent">Recently added</option>
                <option value="name">Name (A–Z)</option>
                <option value="expiring">Expiration date</option>
              </select>
            </label>
          </div>

          {selected.size ? (
            <div className="apps-notice is-info">
              <span>{selected.size} document(s) selected</span>
              <button type="button" onClick={() => setConfirmingBulkDelete(true)}>
                Delete
              </button>
              <button type="button" onClick={() => setSelected(new Set())}>
                Clear selection
              </button>
            </div>
          ) : null}

          <DocumentsTable
            documents={filtered}
            selected={selected}
            setSelected={setSelected}
            onDownload={download}
            onAttach={setAttaching}
            onEditMetadata={setEditingDoc}
            onReplaceVersion={setReplacingDoc}
            onViewVersions={setVersionsDoc}
            onViewActivity={setActivityDoc}
            onDelete={setDeleting}
            onClearFilters={clearFilters}
          />
        </>
      ) : (
        <OnboardingEmptyState onUpload={() => setUploading(true)} />
      )}

      {uploading ? <UploadDialog onClose={() => setUploading(false)} /> : null}
      {attaching ? (
        <AttachToApplicationDialog document={attaching} onClose={() => setAttaching(null)} />
      ) : null}
      {editingDoc ? (
        <EditMetadataDialog doc={editingDoc} open={Boolean(editingDoc)} onClose={() => setEditingDoc(null)} />
      ) : null}
      {replacingDoc ? (
        <ReplaceVersionDialog doc={replacingDoc} open={Boolean(replacingDoc)} onClose={() => setReplacingDoc(null)} />
      ) : null}
      {versionsDoc ? (
        <DocumentVersionsDrawer doc={versionsDoc} open={Boolean(versionsDoc)} onClose={() => setVersionsDoc(null)} />
      ) : null}
      {activityDoc ? (
        <DocumentActivityDrawer doc={activityDoc} open={Boolean(activityDoc)} onClose={() => setActivityDoc(null)} />
      ) : null}
      {deleting ? (
        <DeleteDocumentDialog
          document={deleting}
          pending={remove.isPending}
          onCancel={() => setDeleting(null)}
          onConfirm={() =>
            remove.mutate(deleting.id, {
              onSuccess: () => {
                setNotice(`“${deleting.display_name}” deleted.`);
                setDeleting(null);
              },
            })
          }
        />
      ) : null}
      {confirmingBulkDelete ? (
        <ConfirmationDialog
          title={`Delete ${selected.size} document${selected.size === 1 ? "" : "s"}?`}
          confirmLabel="Delete"
          pendingLabel="Deleting…"
          pending={remove.isPending}
          onCancel={() => setConfirmingBulkDelete(false)}
          onConfirm={async () => {
            const ids = [...selected];
            await Promise.all(ids.map((id) => remove.mutateAsync(id)));
            setNotice(`${ids.length} document${ids.length === 1 ? "" : "s"} deleted.`);
            setConfirmingBulkDelete(false);
          }}
        >
          <p>This permanently removes the selected files. This cannot be undone.</p>
        </ConfirmationDialog>
      ) : null}
    </div>
  );
}

export function DocumentDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: queryKeys.document(id),
    queryFn: () => documentsApi.get(id),
    enabled: Boolean(id),
  });
  const scan = useQuery({
    queryKey: queryKeys.documentScan(id),
    queryFn: () => documentsApi.scanStatus(id),
    enabled: Boolean(id),
    refetchInterval: (state) =>
      state.state.data?.usable_for_protected_workflows ||
      ["rejected", "failed"].includes(
        state.state.data?.malware_status.toLowerCase() ?? "",
      )
        ? false
        : 2500,
  });
  const remove = useMutation({
    mutationFn: () => documentsApi.remove(id),
    onSuccess: () => navigate("/app/documents"),
  });
  async function download() {
    if (!query.data || !scan.data?.usable_for_protected_workflows) return;
    openSignedDownload((await documentsApi.download(id)).download_url);
  }
  if (query.isPending)
    return (
      <div className="page" role="status">
        Loading document details…
      </div>
    );
  if (query.isError || !query.data)
    return (
      <div className="page error-state">
        <h1>Document unavailable</h1>
        <Link to="/app/documents">Return to documents</Link>
      </div>
    );
  const document = query.data;
  const usable = Boolean(scan.data?.usable_for_protected_workflows);
  const failed = ["rejected", "failed"].includes(
    scan.data?.malware_status.toLowerCase() ?? "",
  );
  const expiry = expiryInfo(document.expires_at);
  return (
    <div className="page document-detail-page">
      <Link className="back" to="/app/documents">
        <ArrowLeft aria-hidden="true" /> Documents
      </Link>
      <PageHeader
        title={document.display_name}
        description={`${label(document.category)} · ${formatBytes(document.size_bytes)}`}
      />
      <section
        className={`scan-panel ${usable ? "ready" : failed ? "failed" : "pending"}`}
      >
        {usable ? (
          <ShieldCheck aria-hidden="true" />
        ) : (
          <ShieldAlert aria-hidden="true" />
        )}
        <div>
          <h2>
            {usable
              ? "Ready to use"
              : failed
                ? "Document blocked"
                : "Security scan in progress"}
          </h2>
          <p>
            {usable
              ? "This document can be downloaded and linked to protected application workflows."
              : failed
                ? "This document cannot be downloaded or linked. Delete it and upload a safe replacement."
                : "Download and application linking stay disabled until the scan completes successfully."}
          </p>
          <span role="status">
            Status:{" "}
            {label(scan.data?.malware_status ?? document.malware_status)}
          </span>
        </div>
      </section>
      <dl className="document-metadata">
        <div>
          <dt>Added</dt>
          <dd>{formatDate(document.created_at)}</dd>
        </div>
        <div>
          <dt>File type</dt>
          <dd>{document.content_type}</dd>
        </div>
        <div>
          <dt>Expiration</dt>
          <dd>
            <StatusBadge tone={expiry.urgency === "none" ? "grey" : expiry.urgency === "critical" ? "red" : expiry.urgency === "warn" ? "amber" : "neutral"}>
              {expiry.text}
            </StatusBadge>
          </dd>
        </div>
        {document.tags?.length ? (
          <div>
            <dt>Tags</dt>
            <dd>{document.tags.join(", ")}</dd>
          </div>
        ) : null}
      </dl>
      <div className="document-actions">
        <button
          className="primary"
          type="button"
          onClick={download}
          disabled={!usable}
        >
          <Download aria-hidden="true" /> Download document
        </button>
        <button
          className="apps-danger-button"
          type="button"
          disabled={remove.isPending}
          onClick={() => {
            if (
              confirm(
                `Delete ${document.display_name} permanently? Existing application links may be affected.`,
              )
            )
              remove.mutate();
          }}
        >
          <Trash2 aria-hidden="true" />{" "}
          {remove.isPending ? "Deleting…" : "Delete document"}
        </button>
      </div>
      {remove.isError ? (
        <p className="form-error" role="alert">
          The document could not be deleted. It may still be linked to an
          application.
        </p>
      ) : null}
    </div>
  );
}
