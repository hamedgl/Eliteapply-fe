import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  FileCheck2,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { documentsApi, uploadAcademicDocument } from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
import { openSignedDownload } from "../../lib/api/signedTransport";
import { formatDate, label } from "../applications/model";

export function DocumentsPage() {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("transcript");
  const [message, setMessage] = useState("");
  const query = useQuery({
    queryKey: queryKeys.documents,
    queryFn: documentsApi.list,
  });
  const upload = useMutation({
    mutationFn: (file: File) => uploadAcademicDocument(file, category),
    onSuccess: () => {
      setMessage("Upload registered. Security scanning is now in progress.");
      void qc.invalidateQueries({ queryKey: queryKeys.documents });
    },
    onError: (error) => setMessage(error.message),
  });
  async function remove(id: string, name: string) {
    if (
      !confirm(
        `Delete ${name} permanently? Any application links to this document may also be affected.`,
      )
    )
      return;
    await documentsApi.remove(id);
    void qc.invalidateQueries({ queryKey: queryKeys.documents });
  }
  return (
    <div className="page documents-page">
      <header className="page-heading">
        <div>
          <h1>Documents</h1>
          <p>Keep reusable academic evidence secure and ready to attach.</p>
        </div>
        <div className="upload-actions">
          <select
            aria-label="Document category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="transcript">Transcript</option>
            <option value="degree_certificate">Degree certificate</option>
            <option value="test_score">Test score</option>
            <option value="identity">Identity document</option>
            <option value="portfolio">Portfolio</option>
            <option value="other">Other</option>
          </select>
          <input
            ref={input}
            hidden
            type="file"
            accept=".pdf,.docx,.jpg,.jpeg,.png"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload.mutate(file);
            }}
          />
          <button
            className="primary"
            type="button"
            onClick={() => input.current?.click()}
            disabled={upload.isPending}
          >
            <Upload aria-hidden="true" />
            {upload.isPending ? "Uploading…" : "Upload document"}
          </button>
        </div>
      </header>
      {upload.isPending ? (
        <progress className="upload-progress" aria-label="Uploading document" />
      ) : null}
      {message ? (
        <p className="document-feedback" role="status">
          <ShieldCheck aria-hidden="true" />
          {message}
        </p>
      ) : null}
      {query.isPending ? (
        <p role="status">Loading documents…</p>
      ) : query.isError ? (
        <div className="error-state">
          <h2>Documents could not be loaded</h2>
          <button type="button" onClick={() => query.refetch()}>
            Try again
          </button>
        </div>
      ) : query.data?.length ? (
        <div className="document-list">
          {query.data.map((document) => (
            <article key={document.id}>
              <FileCheck2 aria-hidden="true" />
              <div>
                <h2>
                  <Link to={`/app/documents/${document.id}`}>
                    {document.display_name}
                  </Link>
                </h2>
                <p>
                  {label(document.category)} ·{" "}
                  {(document.size_bytes / 1048576).toFixed(1)} MB · Added{" "}
                  {formatDate(document.created_at)}
                </p>
                <span className={`malware malware-${document.malware_status}`}>
                  Security scan: {label(document.malware_status)}
                </span>
                {document.expires_at ? (
                  <span>Expires {formatDate(document.expires_at)}</span>
                ) : null}
              </div>
              <Link
                className="document-detail-link"
                to={`/app/documents/${document.id}`}
              >
                View details <ChevronRight aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => remove(document.id, document.display_name)}
                aria-label={`Delete ${document.display_name}`}
              >
                <Trash2 aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="vault-empty">
          <Upload aria-hidden="true" />
          <h2>Your document vault is empty</h2>
          <p>
            Upload a transcript, certificate, test score or supporting document.
          </p>
        </div>
      )}
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
  return (
    <div className="page document-detail-page">
      <Link className="back" to="/app/documents">
        <ArrowLeft aria-hidden="true" /> Documents
      </Link>
      <header className="page-heading">
        <div>
          <h1>{document.display_name}</h1>
          <p>
            {label(document.category)} ·{" "}
            {(document.size_bytes / 1048576).toFixed(1)} MB
          </p>
        </div>
      </header>
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
          <dt>Expires</dt>
          <dd>
            {document.expires_at
              ? formatDate(document.expires_at)
              : "No expiry recorded"}
          </dd>
        </div>
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
          className="danger"
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
