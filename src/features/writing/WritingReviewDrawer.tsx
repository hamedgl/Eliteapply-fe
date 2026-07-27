import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Link2,
  Lock,
  MessageSquare,
  Pencil,
  RotateCcw,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import type { components } from "../../generated/api/schema";
import { writingApi } from "../../lib/api/phase3";
import { queryKeys } from "../../lib/api/queryKeys";
import { usePromptDialog } from "../../components/PromptDialog";
import { ConfirmationDialog } from "../../components/actions/ConfirmationDialog";
import { StatusBadge } from "../../components/data-display/StatusBadge";
import { EmptyState } from "../../components/data-display/EmptyState";
import { Select } from "../../components/ui/select";
import { useFocusTrap } from "../../lib/dom-hooks";
import { relativeTime } from "../notifications/model";
import { label } from "./documentHtml";
import "./writing-review.css";

type S = components["schemas"];
type Comment = S["WritingCommentResponse"];
type ShareLink = S["ShareLinkResponse"];

type Tab = "comments" | "sharing";
type CommentFilter = "open" | "resolved" | "all";

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function shareState(link: ShareLink) {
  if (link.revoked_at) return { tone: "grey" as const, text: "Revoked" };
  if (link.expires_at && new Date(link.expires_at) < new Date())
    return { tone: "amber" as const, text: "Expired" };
  return { tone: "green" as const, text: "Active" };
}

/** Copy-to-clipboard button that confirms in place instead of silently succeeding. */
function CopyButton({ value, children }: { value: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      className="writing-review-copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          timer.current = window.setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard denied (insecure context or permission) — the full URL is
          // on screen and selectable, so there is nothing to recover from.
        }
      }}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {copied ? "Copied" : children}
    </button>
  );
}

/**
 * Review side panel for the Writing Studio editor.
 *
 * Rendered as a real slide-in drawer rather than a section appended below the
 * editor: the previous inline version mounted far below the fold, so pressing
 * Review looked like it did nothing at all.
 */
export function WritingReviewDrawer({
  documentId,
  revisions,
  onClose,
}: {
  documentId: string;
  revisions: S["WritingRevisionResponse"][];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("comments");
  const [filter, setFilter] = useState<CommentFilter>("open");
  const [body, setBody] = useState("");
  const [revisionId, setRevisionId] = useState("");
  const [createdUrl, setCreatedUrl] = useState("");
  const [deleting, setDeleting] = useState<Comment | null>(null);
  const [revoking, setRevoking] = useState<ShareLink | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const requestText = usePromptDialog();
  const qc = useQueryClient();
  useFocusTrap(panelRef, true);

  const comments = useQuery({
    queryKey: queryKeys.comments(documentId),
    queryFn: () => writingApi.comments(documentId),
  });
  const shares = useQuery({
    queryKey: queryKeys.shareLinks(documentId),
    queryFn: () => writingApi.shareLinks(documentId),
    enabled: tab === "sharing",
  });

  const refreshComments = () =>
    void qc.invalidateQueries({ queryKey: queryKeys.comments(documentId) });
  const refreshShares = () =>
    void qc.invalidateQueries({ queryKey: queryKeys.shareLinks(documentId) });

  const addComment = useMutation({
    mutationFn: (payload: S["WritingCommentCreate"]) =>
      writingApi.createComment(documentId, payload),
    onSuccess: () => {
      setBody("");
      refreshComments();
    },
  });
  const setResolved = useMutation({
    mutationFn: ({ id, resolved }: { id: string; resolved: boolean }) =>
      writingApi.updateComment(id, { resolved }),
    onSuccess: refreshComments,
  });
  const editComment = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      writingApi.updateComment(id, { body: text }),
    onSuccess: refreshComments,
  });
  const removeComment = useMutation({
    mutationFn: (id: string) => writingApi.deleteComment(id),
    onSuccess: () => {
      setDeleting(null);
      refreshComments();
    },
  });
  const createShare = useMutation({
    mutationFn: (payload: S["ShareLinkCreate"]) =>
      writingApi.createShareLink(documentId, payload),
    onSuccess: (created) => {
      setCreatedUrl(created.share_url);
      refreshShares();
    },
  });
  const revokeShare = useMutation({
    mutationFn: (id: string) => writingApi.revokeShareLink(documentId, id),
    onSuccess: () => {
      setRevoking(null);
      refreshShares();
    },
  });

  const all = useMemo(() => comments.data?.items ?? [], [comments.data]);
  const openCount = all.filter((item) => !item.resolved).length;
  const visible = useMemo(
    () =>
      all.filter((item) =>
        filter === "all" ? true : filter === "open" ? !item.resolved : item.resolved,
      ),
    [all, filter],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deleting && !revoking) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [deleting, onClose, revoking]);

  async function promptEdit(item: Comment) {
    const next = (
      await requestText({
        title: "Edit comment",
        label: "Comment",
        initialValue: item.body,
        multiline: true,
        required: true,
      })
    )?.trim();
    if (next && next !== item.body) editComment.mutate({ id: item.id, text: next });
  }

  return (
    <>
      <div
        className="apps-drawer-backdrop"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div
          className="apps-drawer writing-review-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Review and sharing"
          ref={panelRef}
        >
          <header className="apps-drawer-header">
            <div>
              <h2>Review</h2>
              <p>Collect feedback and manage who can open this draft.</p>
            </div>
            <button type="button" aria-label="Close" onClick={onClose}>
              <X aria-hidden="true" />
            </button>
          </header>

          <div className="writing-review-tabs" role="tablist" aria-label="Review sections">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "comments"}
              className={tab === "comments" ? "is-active" : undefined}
              onClick={() => setTab("comments")}
            >
              <MessageSquare aria-hidden="true" />
              Comments
              {openCount ? <span>{openCount}</span> : null}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "sharing"}
              className={tab === "sharing" ? "is-active" : undefined}
              onClick={() => setTab("sharing")}
            >
              <Share2 aria-hidden="true" />
              Share links
            </button>
          </div>

          <div className="apps-drawer-body writing-review-body">
            {tab === "comments" ? (
              <>
                <form
                  className="writing-review-composer"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!body.trim()) return;
                    addComment.mutate({
                      body: body.trim(),
                      revision_id: revisionId || null,
                      anchor: null,
                    });
                  }}
                >
                  <label>
                    <span>Add a comment</span>
                    <textarea
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      rows={3}
                      maxLength={5000}
                      placeholder="Note what to change, or leave a question for a reviewer."
                    />
                  </label>
                  {revisions.length ? (
                    <label>
                      <span>Attach to</span>
                      <Select
                        ariaLabel="Revision"
                        value={revisionId}
                        onChange={(value) => setRevisionId(String(value))}
                        options={[
                          { value: "", label: "Current document" },
                          ...revisions.map((revision) => ({
                            value: revision.id,
                            label: `Revision ${revision.revision_number}`,
                          })),
                        ]}
                      />
                    </label>
                  ) : null}
                  <div className="writing-review-composer-foot">
                    <small>{body.length}/5000</small>
                    <button
                      type="submit"
                      className="writing-review-primary"
                      disabled={addComment.isPending || !body.trim()}
                    >
                      {addComment.isPending ? "Adding…" : "Add comment"}
                    </button>
                  </div>
                  {addComment.isError ? (
                    <p className="writing-review-error" role="alert">
                      That comment could not be saved. Try again.
                    </p>
                  ) : null}
                </form>

                <div className="writing-review-filters" role="group" aria-label="Filter comments">
                  {(
                    [
                      ["open", `Open${openCount ? ` (${openCount})` : ""}`],
                      ["resolved", "Resolved"],
                      ["all", "All"],
                    ] as [CommentFilter, string][]
                  ).map(([value, text]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={filter === value}
                      className={filter === value ? "is-active" : undefined}
                      onClick={() => setFilter(value)}
                    >
                      {text}
                    </button>
                  ))}
                </div>

                {comments.isPending ? (
                  <div className="writing-review-skeleton" aria-busy="true">
                    {[0, 1, 2].map((row) => (
                      <span key={row} />
                    ))}
                  </div>
                ) : comments.isError ? (
                  <div className="writing-review-status" role="alert">
                    <p>Comments could not be loaded.</p>
                    <button type="button" onClick={() => comments.refetch()}>
                      Try again
                    </button>
                  </div>
                ) : visible.length ? (
                  <ul className="writing-review-list">
                    {visible.map((item) => (
                      <li key={item.id} className={item.resolved ? "is-resolved" : undefined}>
                        <div className="writing-review-item-head">
                          <strong>{item.author_label}</strong>
                          <time dateTime={item.created_at} title={dateTime.format(new Date(item.created_at))}>
                            {relativeTime(item.created_at)}
                          </time>
                        </div>
                        <div className="writing-review-item-tags">
                          {item.resolved ? (
                            <StatusBadge tone="green" icon={Check}>
                              Resolved
                            </StatusBadge>
                          ) : null}
                          {item.anchor ? <StatusBadge tone="indigo">Anchored</StatusBadge> : null}
                          {item.revision_id ? (
                            <StatusBadge tone="grey">On a revision</StatusBadge>
                          ) : null}
                        </div>
                        <p>{item.body}</p>
                        <div className="writing-review-item-actions">
                          <button
                            type="button"
                            onClick={() =>
                              setResolved.mutate({ id: item.id, resolved: !item.resolved })
                            }
                            disabled={setResolved.isPending}
                          >
                            {item.resolved ? (
                              <RotateCcw aria-hidden="true" />
                            ) : (
                              <Check aria-hidden="true" />
                            )}
                            {item.resolved ? "Reopen" : "Resolve"}
                          </button>
                          <button type="button" onClick={() => void promptEdit(item)}>
                            <Pencil aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="is-danger"
                            onClick={() => setDeleting(item)}
                          >
                            <Trash2 aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    variant="filtered"
                    icon={MessageSquare}
                    heading={filter === "open" ? "No open comments" : "Nothing here yet"}
                    description={
                      filter === "open"
                        ? "Everything raised on this draft has been resolved."
                        : "Comments you or your reviewers add will appear here."
                    }
                  />
                )}
              </>
            ) : (
              <>
                <form
                  className="writing-review-composer"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    const expires = String(data.get("expires_at") || "");
                    createShare.mutate({
                      scope: (data.get("scope") as "view" | "comment") || "view",
                      passcode: String(data.get("passcode") || "") || null,
                      expires_at: expires ? new Date(expires).toISOString() : null,
                    });
                    event.currentTarget.reset();
                  }}
                >
                  <label>
                    <span>Who opens the link can</span>
                    <Select
                      ariaLabel="Scope"
                      name="scope"
                      defaultValue="view"
                      options={[
                        { value: "view", label: "Read the document" },
                        { value: "comment", label: "Read and leave comments" },
                      ]}
                    />
                  </label>
                  <label>
                    <span>Passcode (optional)</span>
                    <input name="passcode" type="password" minLength={4} autoComplete="off" />
                  </label>
                  <label>
                    <span>Expires (optional)</span>
                    <input name="expires_at" type="datetime-local" />
                  </label>
                  <div className="writing-review-composer-foot">
                    <small>Links can be revoked at any time.</small>
                    <button
                      type="submit"
                      className="writing-review-primary"
                      disabled={createShare.isPending}
                    >
                      {createShare.isPending ? "Creating…" : "Create link"}
                    </button>
                  </div>
                  {createShare.isError ? (
                    <p className="writing-review-error" role="alert">
                      The link could not be created. Try again.
                    </p>
                  ) : null}
                </form>

                {createdUrl ? (
                  <div className="writing-review-created">
                    <p className="writing-review-created-head">
                      <Link2 aria-hidden="true" />
                      Your new link — copy it now
                    </p>
                    {/* Shown in full, once: the token is not stored anywhere the
                        app can read back, so this is the only chance to copy it. */}
                    <code>{createdUrl}</code>
                    <CopyButton value={createdUrl}>Copy link</CopyButton>
                  </div>
                ) : null}

                {shares.isPending ? (
                  <div className="writing-review-skeleton" aria-busy="true">
                    {[0, 1].map((row) => (
                      <span key={row} />
                    ))}
                  </div>
                ) : shares.data?.length ? (
                  <ul className="writing-review-list">
                    {shares.data.map((item) => {
                      const state = shareState(item);
                      return (
                        <li key={item.id}>
                          <div className="writing-review-item-head">
                            <strong>{label(item.scope)}</strong>
                            <StatusBadge tone={state.tone}>{state.text}</StatusBadge>
                          </div>
                          <div className="writing-review-item-tags">
                            {item.has_passcode ? (
                              <StatusBadge tone="blue" icon={Lock}>
                                Passcode
                              </StatusBadge>
                            ) : null}
                            <StatusBadge tone="grey">
                              {item.access_count} {item.access_count === 1 ? "open" : "opens"}
                            </StatusBadge>
                          </div>
                          <p className="writing-review-item-meta">
                            Created {dateTime.format(new Date(item.created_at))}
                            {item.expires_at
                              ? ` · expires ${dateTime.format(new Date(item.expires_at))}`
                              : ""}
                            {item.last_accessed_at
                              ? ` · last opened ${relativeTime(item.last_accessed_at)}`
                              : ""}
                          </p>
                          {item.revoked_at ? null : (
                            <div className="writing-review-item-actions">
                              <button
                                type="button"
                                className="is-danger"
                                onClick={() => setRevoking(item)}
                              >
                                <Trash2 aria-hidden="true" />
                                Revoke
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <EmptyState
                    variant="filtered"
                    icon={Share2}
                    heading="No share links yet"
                    description="Create a link to let a mentor or supervisor read this draft without an EliteApply account."
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {deleting ? (
        <ConfirmationDialog
          title="Delete this comment?"
          confirmLabel="Delete comment"
          pendingLabel="Deleting…"
          pending={removeComment.isPending}
          onCancel={() => setDeleting(null)}
          onConfirm={() => removeComment.mutate(deleting.id)}
        >
          <p>This removes the comment for everyone. It cannot be undone.</p>
        </ConfirmationDialog>
      ) : null}

      {revoking ? (
        <ConfirmationDialog
          title="Revoke this share link?"
          confirmLabel="Revoke link"
          pendingLabel="Revoking…"
          pending={revokeShare.isPending}
          onCancel={() => setRevoking(null)}
          onConfirm={() => revokeShare.mutate(revoking.id)}
        >
          <p>Anyone holding this link loses access immediately. Comments already left stay.</p>
        </ConfirmationDialog>
      ) : null}
    </>
  );
}
