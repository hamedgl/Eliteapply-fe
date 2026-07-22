import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { Select } from "../../components/ui/select";
import { ApiError } from "../../lib/api/errors";
import { PageHeader } from "../../components/page/PageHeader";
import { ActiveFilterChips } from "../applications/components/ActiveFilterChips";
import { useSlashFocus } from "../applications/hooks";
import { useFocusTrap } from "../../lib/dom-hooks";
import { referencesApi } from "../../lib/api/phase3";
import { downloadResponse } from "../../lib/api/download";
import { documentsApi } from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
import { openSignedDownload } from "../../lib/api/signedTransport";
import {
  applyReferenceFilters,
  buildReferenceFilterChips,
  emptyReferenceFilters,
  methodLabel,
  type Reference,
  type ReferenceFilters,
} from "./model";
import { ReferencesSummary, type SummaryAction } from "./components/ReferencesSummary";
import { ReferencesToolbar } from "./components/ReferencesToolbar";
import { ReferenceFilterDrawer } from "./components/ReferenceFilterDrawer";
import { ReferencesTable } from "./components/ReferencesTable";
import { ReferencesSkeleton } from "./components/ReferencesSkeleton";
import { OnboardingEmptyState } from "./components/ReferencesEmptyStates";
import { RevokeReferenceDialog } from "./components/RevokeReferenceDialog";
import { SendReminderDialog } from "./components/SendReminderDialog";
import { EditReferenceDialog } from "./components/EditReferenceDialog";
import { AttachApplicationDialog } from "./components/AttachApplicationDialog";
import { ReferenceDetailContent } from "./components/ReferenceDetailContent";
import { RequestReferenceFlow } from "./components/RequestReferenceFlow";
import type { ReferenceActionKind } from "./components/ReferenceActionMenu";
import "../../styles/workspace.css";

async function downloadReference(reference: Reference) {
  if (reference.mode === "existing_upload" && reference.existing_document_id) {
    openSignedDownload((await documentsApi.download(reference.existing_document_id)).download_url);
    return;
  }
  await downloadResponse(
    await referencesApi.download(reference.id),
    `reference-${reference.public_id}.txt`,
  );
}

function sortReferences(items: Reference[], sort: string): Reference[] {
  const sorted = [...items];
  switch (sort) {
    case "requested_asc":
      return sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
    case "due_asc":
      return sorted.sort((a, b) => a.expires_at.localeCompare(b.expires_at));
    case "due_desc":
      return sorted.sort((a, b) => b.expires_at.localeCompare(a.expires_at));
    case "referee_asc":
      return sorted.sort((a, b) => a.referee_name.localeCompare(b.referee_name));
    default:
      return sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
}

export function ReferencesPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<ReferenceFilters>(emptyReferenceFilters);
  const [sort, setSort] = useState("requested_desc");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editError, setEditError] = useState("");
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [attachError, setAttachError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [notice, setNotice] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  useSlashFocus(searchInputRef);

  const setFilter = <K extends keyof ReferenceFilters>(key: K, value: ReferenceFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.references(), "infinite"],
    queryFn: ({ pageParam }) => referencesApi.list(undefined, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
  });
  const allItems = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);
  const filtered = useMemo(() => sortReferences(applyReferenceFilters(allItems, filters), sort), [allItems, filters, sort]);
  const findById = (id: string | null) => (id ? allItems.find((item) => item.id === id) ?? null : null);
  const viewing = findById(viewingId);
  const reminding = findById(remindingId);
  const revoking = findById(revokingId);
  const editing = findById(editingId);
  const attaching = findById(attachingId);

  const actionNotice: Record<"resend" | "remind" | "cancel" | "revoke", string> = {
    resend: "Invitation resent.",
    remind: "Reminder sent.",
    cancel: "Request cancelled.",
    revoke: "Reference request revoked.",
  };
  const actionMutation = useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: "resend" | "remind" | "cancel" | "revoke" }) =>
      referencesApi[kind](id),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ["references"] });
      setNotice(actionNotice[variables.kind]);
      setRemindingId(null);
      setRevokingId(null);
    },
  });
  const editMutation = useMutation({
    mutationFn: ({
      id,
      expectedVersion,
      patch,
    }: {
      id: string;
      expectedVersion: number;
      patch: {
        referee_name: string;
        referee_role: string;
        institution: string;
        department: string;
        reference_type: string;
        student_context: string;
      };
    }) =>
      referencesApi.update(id, {
        expected_version: expectedVersion,
        referee_name: patch.referee_name,
        referee_role: patch.referee_role as "professor" | "supervisor" | "teacher" | "employer" | "mentor",
        institution: patch.institution || null,
        department: patch.department || null,
        reference_type: patch.reference_type as "academic" | "professional" | "personal" | "other",
        student_context: { summary: patch.student_context },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["references"] });
      setEditingId(null);
      setEditError("");
      setNotice("Changes saved.");
    },
    onError: (caught) => setEditError(caught instanceof Error ? caught.message : "Could not save changes."),
  });
  const attachMutation = useMutation({
    mutationFn: ({ id, applicationId }: { id: string; applicationId: string }) => referencesApi.attach(id, applicationId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["references"] });
      setAttachingId(null);
      setAttachError("");
      setNotice("Attached to application.");
    },
    onError: (caught) => {
      // Already-attached is treated as idempotent-safe: just refresh and close.
      if (caught instanceof ApiError && caught.code === "reference_already_attached") {
        void qc.invalidateQueries({ queryKey: ["references"] });
        setAttachingId(null);
        setAttachError("");
        setNotice("Already attached to that application.");
        return;
      }
      setAttachError(caught instanceof Error ? caught.message : "Could not attach that application.");
    },
  });

  const handleAction = (reference: Reference, kind: ReferenceActionKind) => {
    setDownloadError("");
    setNotice("");
    if (kind === "remind") return setRemindingId(reference.id);
    if (kind === "revoke") return setRevokingId(reference.id);
    if (kind === "edit") return setEditingId(reference.id);
    if (kind === "attach") return setAttachingId(reference.id);
    if (kind === "resend") return actionMutation.mutate({ id: reference.id, kind: "resend" });
    if (kind === "cancel") {
      if (window.confirm("Cancel this pending request? The referee will no longer be able to respond.")) {
        actionMutation.mutate({ id: reference.id, kind: "cancel" });
      }
      return;
    }
    if (kind === "certificate" || kind === "download") {
      const filename = `reference-${reference.public_id}${kind === "certificate" ? "-certificate" : ""}.pdf`;
      (kind === "certificate"
        ? referencesApi.certificate(reference.id).then((response) => downloadResponse(response, filename))
        : downloadReference(reference))
        .catch(() => setDownloadError("Could not download the file. Try again shortly."));
    }
  };

  const drawerActiveCount = [
    filters.mode,
    filters.applicationId,
    filters.institution,
    filters.role,
    filters.visibility,
    filters.requestedFrom,
    filters.requestedTo,
    filters.dueFrom,
    filters.dueTo,
  ].filter(Boolean).length + (filters.includeRevoked ? 0 : 1);
  const chips = buildReferenceFilterChips(filters);
  const removeChip = (key: string) => {
    if (key === "status") return setFilter("status", "");
    if (key === "mode") return setFilter("mode", "");
    if (key === "applicationId") {
      setFilter("applicationId", "");
      return setFilter("applicationName", "");
    }
    if (key === "includeRevoked") return setFilter("includeRevoked", true);
    setFilter(key as keyof ReferenceFilters, "" as never);
  };
  const clearAllFilters = () => setFilters(emptyReferenceFilters);

  const applySummaryAction = (action: SummaryAction) => {
    if (action.kind === "total") return setFilters({ ...emptyReferenceFilters });
    if (action.kind === "awaiting") return setFilters({ ...emptyReferenceFilters, status: "invited" });
    if (action.kind === "completed") return setFilters({ ...emptyReferenceFilters, status: "approved" });
    if (action.kind === "attention") return setFilters({ ...emptyReferenceFilters, status: "declined,invited" });
  };

  if (query.isPending) return <ReferencesSkeleton />;
  if (query.isError)
    return (
      <div className="apps-page-error" role="alert">
        <h1>We couldn’t load your references.</h1>
        <button className="primary" onClick={() => query.refetch()}>
          Try again
        </button>
      </div>
    );

  const noFiltersActive = JSON.stringify(filters) === JSON.stringify(emptyReferenceFilters);
  const showOnboarding = noFiltersActive && allItems.length === 0;

  return (
    <div className="page apps-page">
      <PageHeader
        title="Academic references"
        description="Request, track and verify references while respecting referee confidentiality."
        meta={`${filtered.length} reference${filtered.length === 1 ? "" : "s"}`}
        actions={
          <button type="button" className="primary" onClick={() => setRequesting(true)}>
            <Plus aria-hidden="true" /> Request reference
          </button>
        }
      />

      <ReferencesSummary onApply={applySummaryAction} />

      <ReferencesToolbar
        ref={searchInputRef}
        search={filters.search}
        onSearch={(value) => setFilter("search", value)}
        status={filters.status}
        onStatus={(value) => setFilter("status", value)}
        referenceType={filters.referenceType}
        onReferenceType={(value) => setFilter("referenceType", value)}
        sort={sort}
        onSort={setSort}
        onOpenDrawer={() => setDrawerOpen(true)}
        drawerActiveCount={drawerActiveCount}
      />

      <ActiveFilterChips chips={chips} onRemove={removeChip} onClearAll={clearAllFilters} />

      {notice ? (
        <p className="inline-success" role="status">
          {notice}
        </p>
      ) : null}
      {downloadError ? (
        <p role="alert" className="form-error">
          {downloadError}
        </p>
      ) : null}
      {actionMutation.error ? (
        <p role="alert" className="form-error">
          <strong>We couldn’t complete that action.</strong>{" "}
          {actionMutation.error instanceof Error ? actionMutation.error.message : "Try again shortly."}
        </p>
      ) : null}

      {showOnboarding ? (
        <OnboardingEmptyState onCreate={() => setRequesting(true)} />
      ) : (
        <ReferencesTable
          references={filtered}
          pending={actionMutation.isPending}
          onView={(reference) => setViewingId(reference.id)}
          onAction={handleAction}
          onClearFilters={clearAllFilters}
        />
      )}

      {query.hasNextPage ? (
        <button className="load-more" type="button" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
          {query.isFetchingNextPage ? "Loading…" : "Load more references"}
        </button>
      ) : null}

      <ReferenceFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        setFilter={setFilter}
        resultCount={filtered.length}
        onReset={() => setFilters(emptyReferenceFilters)}
      />

      {requesting ? (
        <RequestFlowDrawer
          onClose={() => setRequesting(false)}
          onCreated={() => {
            setRequesting(false);
            void qc.invalidateQueries({ queryKey: ["references"] });
          }}
        />
      ) : null}

      {viewing ? (
        <QuickViewDrawer reference={viewing} onClose={() => setViewingId(null)} pending={actionMutation.isPending} onAction={handleAction} />
      ) : null}

      {reminding ? (
        <SendReminderDialog
          reference={reminding}
          pending={actionMutation.isPending}
          onCancel={() => setRemindingId(null)}
          onConfirm={() => actionMutation.mutate({ id: reminding.id, kind: "remind" })}
        />
      ) : null}

      {revoking ? (
        <RevokeReferenceDialog
          reference={revoking}
          pending={actionMutation.isPending}
          onCancel={() => setRevokingId(null)}
          onConfirm={() => actionMutation.mutate({ id: revoking.id, kind: "revoke" })}
        />
      ) : null}

      {editing ? (
        <EditReferenceDialog
          reference={editing}
          pending={editMutation.isPending}
          error={editError}
          onCancel={() => {
            setEditingId(null);
            setEditError("");
          }}
          onSubmit={(patch) => editMutation.mutate({ id: editing.id, expectedVersion: editing.version, patch })}
        />
      ) : null}

      {attaching ? (
        <AttachApplicationDialog
          reference={attaching}
          pending={attachMutation.isPending}
          error={attachError}
          onCancel={() => {
            setAttachingId(null);
            setAttachError("");
          }}
          onSubmit={(applicationId) => attachMutation.mutate({ id: attaching.id, applicationId })}
        />
      ) : null}
    </div>
  );
}

function RequestFlowDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, true);
  return (
    <div className="apps-drawer-backdrop" role="presentation" onClick={onClose}>
      <section
        className="apps-drawer apps-drawer-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-reference-title"
        ref={panelRef}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <header className="apps-drawer-header">
          <h2 id="request-reference-title">Request reference</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="apps-drawer-body">
          <RequestReferenceFlow onCreated={onCreated} />
        </div>
      </section>
    </div>
  );
}

function QuickViewDrawer({
  reference,
  pending,
  onClose,
  onAction,
}: {
  reference: Reference;
  pending: boolean;
  onClose: () => void;
  onAction: (reference: Reference, kind: ReferenceActionKind) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, true);
  return (
    <div className="apps-drawer-backdrop" role="presentation" onClick={onClose}>
      <section
        className="apps-drawer apps-drawer-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reference-quick-view-title"
        ref={panelRef}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <header className="apps-drawer-header">
          <h2 id="reference-quick-view-title" className="visually-hidden">
            {reference.referee_name}
          </h2>
          <Link to={`/app/references/${reference.id}`} className="apps-inline-link">
            Open full page
          </Link>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="apps-drawer-body">
          <ReferenceDetailContent reference={reference} pending={pending} onAction={(kind) => onAction(reference, kind)} />
        </div>
      </section>
    </div>
  );
}

export function ReferenceDetail() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const [reminding, setReminding] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");
  const [attaching, setAttaching] = useState(false);
  const [attachError, setAttachError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [notice, setNotice] = useState("");
  const reference = useQuery({ queryKey: queryKeys.reference(id), queryFn: () => referencesApi.get(id) });

  const actionNotice: Record<"resend" | "remind" | "cancel" | "revoke", string> = {
    resend: "Invitation resent.",
    remind: "Reminder sent.",
    cancel: "Request cancelled.",
    revoke: "Reference request revoked.",
  };
  const actionMutation = useMutation({
    mutationFn: (kind: "resend" | "remind" | "cancel" | "revoke") => referencesApi[kind](id),
    onSuccess: (_data, kind) => {
      void qc.invalidateQueries({ queryKey: ["references"] });
      setNotice(actionNotice[kind]);
      setReminding(false);
      setRevoking(false);
    },
  });
  const editMutation = useMutation({
    mutationFn: (patch: {
      referee_name: string;
      referee_role: string;
      institution: string;
      department: string;
      reference_type: string;
      student_context: string;
    }) =>
      referencesApi.update(id, {
        expected_version: reference.data!.version,
        referee_name: patch.referee_name,
        referee_role: patch.referee_role as "professor" | "supervisor" | "teacher" | "employer" | "mentor",
        institution: patch.institution || null,
        department: patch.department || null,
        reference_type: patch.reference_type as "academic" | "professional" | "personal" | "other",
        student_context: { summary: patch.student_context },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["references"] });
      setEditing(false);
      setEditError("");
      setNotice("Changes saved.");
    },
    onError: (caught) => setEditError(caught instanceof Error ? caught.message : "Could not save changes."),
  });
  const attachMutation = useMutation({
    mutationFn: (applicationId: string) => referencesApi.attach(id, applicationId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["references"] });
      setAttaching(false);
      setAttachError("");
      setNotice("Attached to application.");
    },
    onError: (caught) => {
      if (caught instanceof ApiError && caught.code === "reference_already_attached") {
        void qc.invalidateQueries({ queryKey: ["references"] });
        setAttaching(false);
        setAttachError("");
        setNotice("Already attached to that application.");
        return;
      }
      setAttachError(caught instanceof Error ? caught.message : "Could not attach that application.");
    },
  });

  const item = reference.data;
  if (reference.isPending)
    return (
      <div className="page">
        <ReferencesSkeleton />
      </div>
    );
  if (!item)
    return (
      <div className="page">
        <h1>Reference unavailable</h1>
        <Link to="/app/references">Return to references</Link>
      </div>
    );

  const handleAction = (_reference: Reference, kind: ReferenceActionKind) => {
    setDownloadError("");
    setNotice("");
    if (kind === "remind") return setReminding(true);
    if (kind === "revoke") return setRevoking(true);
    if (kind === "edit") return setEditing(true);
    if (kind === "attach") return setAttaching(true);
    if (kind === "resend") return actionMutation.mutate("resend");
    if (kind === "cancel") {
      if (window.confirm("Cancel this pending request? The referee will no longer be able to respond.")) {
        actionMutation.mutate("cancel");
      }
      return;
    }
    if (kind === "certificate" || kind === "download") {
      const filename = `reference-${item.public_id}${kind === "certificate" ? "-certificate" : ""}.pdf`;
      (kind === "certificate"
        ? referencesApi.certificate(id).then((response) => downloadResponse(response, filename))
        : downloadReference(item))
        .catch(() => setDownloadError("Could not download the file. Try again shortly."));
    }
  };

  return (
    <div className="page reference-detail-page">
      <Link to="/app/references" className="apps-inline-link">
        ← References
      </Link>
      {notice ? (
        <p className="inline-success" role="status">
          {notice}
        </p>
      ) : null}
      {downloadError ? (
        <p role="alert" className="form-error">
          {downloadError}
        </p>
      ) : null}
      {actionMutation.error ? (
        <p role="alert" className="form-error">
          {actionMutation.error instanceof Error ? actionMutation.error.message : "Action failed."}
        </p>
      ) : null}
      <ReferenceDetailContent reference={item} pending={actionMutation.isPending} onAction={(kind) => handleAction(item, kind)} />

      {reminding ? (
        <SendReminderDialog
          reference={item}
          pending={actionMutation.isPending}
          onCancel={() => setReminding(false)}
          onConfirm={() => actionMutation.mutate("remind")}
        />
      ) : null}
      {revoking ? (
        <RevokeReferenceDialog
          reference={item}
          pending={actionMutation.isPending}
          onCancel={() => setRevoking(false)}
          onConfirm={() => actionMutation.mutate("revoke")}
        />
      ) : null}
      {editing ? (
        <EditReferenceDialog
          reference={item}
          pending={editMutation.isPending}
          error={editError}
          onCancel={() => {
            setEditing(false);
            setEditError("");
          }}
          onSubmit={(patch) => editMutation.mutate(patch)}
        />
      ) : null}
      {attaching ? (
        <AttachApplicationDialog
          reference={item}
          pending={attachMutation.isPending}
          error={attachError}
          onCancel={() => {
            setAttaching(false);
            setAttachError("");
          }}
          onSubmit={(applicationId) => attachMutation.mutate(applicationId)}
        />
      ) : null}
    </div>
  );
}

export function NewReference() {
  const nav = useNavigate();
  return (
    <div className="page">
      <Link to="/app/references" className="apps-inline-link">
        ← References
      </Link>
      <h1>Request reference</h1>
      <RequestReferenceFlow onCreated={(id) => nav(`/app/references/${id}`)} />
    </div>
  );
}

type RefereeRequestData = Awaited<ReturnType<typeof referencesApi.refereeGet>>;

function contextSummary(context: Record<string, unknown>) {
  return typeof context.summary === "string" ? context.summary.trim() : "";
}

export function RefereePage() {
  const { token = "" } = useParams();
  const [code, setCode] = useState("");
  const [request, setRequest] = useState<RefereeRequestData | null>(null);
  const [decision, setDecision] = useState<"approve" | "decline">("approve");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openingDocument, setOpeningDocument] = useState(false);

  async function unlock() {
    if (unlocking) return;
    setUnlocking(true);
    setError("");
    try {
      setRequest(await referencesApi.refereeGet(token, code));
    } catch {
      setError("The invitation or code could not be verified.");
    } finally {
      setUnlocking(false);
    }
  }

  async function openDocument() {
    if (openingDocument) return;
    setOpeningDocument(true);
    setError("");
    try {
      openSignedDownload((await referencesApi.refereeDocument(token, code)).download_url);
    } catch {
      setError("The document could not be opened. Check that the invitation is still active.");
    } finally {
      setOpeningDocument(false);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    const data = new FormData(e.currentTarget);
    try {
      await referencesApi.refereeSubmit(token, code, {
        decision,
        final_content:
          decision === "approve" && request?.mode !== "existing_upload"
            ? String(data.get("content"))
            : null,
        referee_display_name: String(data.get("referee_display_name")),
        role_title: String(data.get("role_title")) || null,
        relationship_confirmation: data.get("relationship_confirmation") === "on",
        relationship_duration: String(data.get("relationship_duration")) || null,
        authenticity_attestation: data.get("authenticity_attestation") === "on",
        authority_consent: data.get("authority_consent") === "on",
        conflict_of_interest: String(data.get("conflict_of_interest")) || null,
        signature_name: String(data.get("signature_name")) || null,
        decline_reason_category:
          decision === "decline"
            ? (data.get("decline_reason_category") as "no_relationship" | "insufficient_time" | "policy_conflict" | "other")
            : null,
        existing_document_id:
          decision === "approve" && request?.mode === "existing_upload"
            ? request.existing_document?.id ?? null
            : null,
      });
      setCode("");
      setRequest(null);
      setDone(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Submission failed. Your form is still available to retry.");
      setSubmitting(false);
    }
  }

  if (done)
    return (
      <Public title="Reference submitted">
        <p>
          Your reference was submitted securely. Sensitive content has been
          cleared from this page.
        </p>
      </Public>
    );
  return (
    <Public title="Review an academic reference request">
      {!request ? (
        <div className="settings-form">
          <p>
            Enter the separate reference code you received. It is kept only in
            memory.
          </p>
          <label>
            Reference code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
            />
          </label>
          <button className="primary" onClick={unlock} disabled={unlocking || code.trim().length !== 6}>
            {unlocking ? "Checking…" : "Continue securely"}
          </button>
          {error ? <p role="alert">{error}</p> : null}
        </div>
      ) : (
        <form className="settings-form" onSubmit={submit}>
          <section className="reference-public-brief" aria-labelledby="reference-request-details">
            <h2 id="reference-request-details">What you’re being asked to do</h2>
            <dl className="reference-detail-facts">
              <div><dt>Application</dt><dd>{request.application_title}</dd></div>
              <div><dt>Method</dt><dd>{methodLabel(request.mode)}</dd></div>
              <div><dt>Due</dt><dd>{new Date(request.expires_at).toLocaleDateString()}</dd></div>
              <div><dt>Privacy</dt><dd>{request.confidential ? "Confidential response" : "Visible to the applicant"}</dd></div>
              {request.destinations?.length ? (
                <div><dt>Destinations</dt><dd>{request.destinations.join(", ")}</dd></div>
              ) : null}
            </dl>
            {contextSummary(request.relationship_context) ? (
              <div className="reference-public-context"><strong>Relationship provided by the applicant</strong><p>{contextSummary(request.relationship_context)}</p></div>
            ) : null}
            {contextSummary(request.student_context) ? (
              <div className="reference-public-context"><strong>Applicant guidance</strong><p>{contextSummary(request.student_context)}</p></div>
            ) : null}
            {request.mode === "existing_upload" && request.existing_document ? (
              <div className="reference-public-document">
                <div><strong>Document to review</strong><span>{request.existing_document.display_name}</span></div>
                <button type="button" onClick={openDocument} disabled={openingDocument}>
                  {openingDocument ? "Opening…" : "Open document securely"}
                </button>
              </div>
            ) : null}
          </section>
          <label>
            Decision
            <Select
              value={decision}
              onChange={(val: any) =>
                setDecision((typeof val === "string" ? val : (val?.target?.value ?? "approve")) as typeof decision)
              }
              options={[
                { value: "approve", label: "Approve and submit" },
                { value: "decline", label: "Decline request" },
              ]}
            />
          </label>
          <label>
            Display name
            <input name="referee_display_name" required minLength={2} />
          </label>
          <label>
            Role or title
            <input name="role_title" />
          </label>
          {decision === "approve" ? (
            <>
              <label>How long have you known the applicant?<input name="relationship_duration" required /></label>
              {request.mode !== "existing_upload" ? (
                <label>
                  {request.mode === "student_draft" ? "Review and edit the applicant’s draft" : "Final reference"}
                  <textarea name="content" minLength={50} required rows={14} defaultValue={request.student_draft ?? ""} />
                </label>
              ) : null}
              <label>Potential conflict of interest <span className="muted">(write “None” if not applicable)</span><textarea name="conflict_of_interest" required /></label>
              <label>Signature name<input name="signature_name" required /></label>
              <label className="check"><input name="relationship_confirmation" type="checkbox" required />I confirm the stated relationship.</label>
              <label className="check"><input name="authenticity_attestation" type="checkbox" required />I attest that this submission is authentic.</label>
              <label className="check"><input name="authority_consent" type="checkbox" required />I am authorized to submit this reference.</label>
            </>
          ) : null}
          {decision === "decline" ? <label>Reason for declining<select name="decline_reason_category" required><option value="no_relationship">I do not know the applicant</option><option value="insufficient_time">I do not have enough time</option><option value="policy_conflict">Institutional policy conflict</option><option value="other">Other</option></select></label> : null}
          {decision === "approve" ? <p className="phase3-consent">By submitting, you confirm that the reference is your own honest assessment, that you have authority to provide it, and that EliteApply may securely store and share it with the stated destinations.</p> : null}
          <button className="primary" disabled={submitting}>{submitting ? "Submitting securely…" : "Submit reference"}</button>
          {error ? <p role="alert">{error}</p> : null}
        </form>
      )}
    </Public>
  );
}
export function VerifyReference() {
  const { publicId = "" } = useParams(),
    q = useQuery({
      queryKey: ["verify", publicId],
      queryFn: () => referencesApi.verify(publicId),
    });
  return (
    <Public title="Academic reference verification">
      {q.isPending ? (
        <p>Checking reference…</p>
      ) : q.isError ? (
        <p>This reference could not be verified.</p>
      ) : (
        <dl className="verify">
          <div>
            <dt>Status</dt>
            <dd>{q.data.status}</dd>
          </div>
          <div>
            <dt>Referee role</dt>
            <dd>{q.data.referee_role}</dd>
          </div>
          <div>
            <dt>Institution</dt>
            <dd>{q.data.institution ?? "Not provided"}</dd>
          </div>
          <div>
            <dt>Approved</dt>
            <dd>
              {q.data.approved_at
                ? new Date(q.data.approved_at).toLocaleDateString()
                : "Not approved"}
            </dd>
          </div>
          <div>
            <dt>What verification means</dt>
            <dd>{q.data.disclaimer}</dd>
          </div>
        </dl>
      )}
    </Public>
  );
}
function Public({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]') ?? document.head.appendChild(document.createElement("meta"));
    const previous = meta.content;
    meta.name = "robots"; meta.content = "noindex,nofollow";
    return () => { meta.content = previous; };
  }, []);
  return (
    <main className="public-flow">
      <Link className="brand" to="/">
        EliteApply
      </Link>
      <h1>{title}</h1>
      {children}
    </main>
  );
}
