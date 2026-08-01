import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import type { components } from "../../generated/api/schema";
import { publicShareApi } from "../../lib/api/phase3";
import { ApiError } from "../../lib/api/errors";
import { queryKeys } from "../../lib/api/queryKeys";
import { sanitizePreviewHtml } from "../../lib/safeHtml";
import { StatusBadge } from "../../components/data-display/StatusBadge";
import { SharedWritingPageSkeleton } from "../../components/page/PageSkeleton";
import { relativeTime } from "../notifications/model";
import { label } from "./documentHtml";
import "./shared-writing.css";

type SharedComment = components["schemas"]["SharedCommentResponse"];

const NAME_KEY = "eliteapply-reviewer-name";

/** Error codes the share endpoints return for a passcode-gated link. */
const PASSCODE_REQUIRED = "share_passcode_required";
const PASSCODE_INVALID = "share_passcode_invalid";
const PASSCODE_LOCKED = "share_passcode_locked";

function errorCode(error: unknown) {
  return error instanceof ApiError ? error.code : null;
}

const HEIGHT_MESSAGE = "eliteapply-share-height";

/**
 * The document body is rendered inside a sandboxed frame, keeping two
 * independent boundaries around author-supplied HTML: the tag/attribute
 * allowlist in `sanitizePreviewHtml`, and a frame with no `allow-same-origin`
 * (so anything that somehow ran could not reach this page's storage, cookies,
 * or DOM). `allow-scripts` exists only for the height reporter below, which is
 * appended after sanitisation and so cannot come from the document.
 */
function frameDocument(html: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>
    :root{color-scheme:light}
    body{font:1.02rem/1.75 Georgia,"Times New Roman",serif;color:#12203f;margin:0;max-width:68ch;overflow-wrap:break-word}
    h1,h2,h3,h4{font-family:"DM Sans",system-ui,sans-serif;line-height:1.25}
    a{color:#174bd6}
    blockquote{margin:1.25rem 0;padding-inline-start:1rem;border-inline-start:2px solid #dfe4ed;color:#63708a}
    table{border-collapse:collapse;width:100%}
    td,th{border:1px solid #dfe4ed;padding:8px;text-align:start}
  </style></head><body>${sanitizePreviewHtml(html)}<script>
    (function () {
      var report = function () {
        parent.postMessage(
          { type: ${JSON.stringify(HEIGHT_MESSAGE)}, height: document.body.scrollHeight },
          "*"
        );
      };
      report();
      new ResizeObserver(report).observe(document.body);
      addEventListener("load", report);
    })();
  <\/script></body></html>`;
}

/** Sandboxed document body that grows to its content instead of scrolling inside. */
function DocumentFrame({ html, title }: { html: string; title: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(480);
  const srcDoc = useMemo(() => frameDocument(html), [html]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // Only the frame we rendered may resize it — any other window is ignored.
      if (event.source !== frameRef.current?.contentWindow) return;
      const payload = event.data as { type?: string; height?: number } | null;
      if (payload?.type !== HEIGHT_MESSAGE || typeof payload.height !== "number") return;
      setHeight(Math.max(240, Math.ceil(payload.height)));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={frameRef}
      className="shared-doc-frame"
      title={title}
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      style={{ height: `${height}px` }}
    />
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shared-doc">
      <header className="shared-doc-bar">
        {/* `brand` carries the shared logo asset via its ::before rule — see the
            "One transparent brand asset" block in styles/index.css. */}
        <Link className="brand shared-doc-brand" to="/">
          EliteApply
        </Link>
        <span className="shared-doc-bar-note">
          <ShieldCheck aria-hidden="true" />
          Private shared document
        </span>
      </header>
      {children}
    </div>
  );
}

function Notice({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof AlertTriangle;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="shared-doc-notice">
      <Icon aria-hidden="true" />
      <h1>{title}</h1>
      {children}
    </main>
  );
}

/**
 * Public reading + commenting view behind a Writing Studio share link.
 *
 * The passcode never leaves component state — it is sent as a request header
 * and is deliberately not persisted, so closing the tab ends the session.
 */
export function SharedWritingPage() {
  const { token = "" } = useParams();
  const qc = useQueryClient();
  const [passcode, setPasscode] = useState("");
  const [submittedPasscode, setSubmittedPasscode] = useState<string | undefined>(undefined);
  const [authorLabel, setAuthorLabel] = useState(
    () => localStorage.getItem(NAME_KEY) ?? "",
  );
  const [body, setBody] = useState("");
  const [justPosted, setJustPosted] = useState(false);

  useEffect(() => {
    const meta =
      window.document.querySelector<HTMLMetaElement>('meta[name="robots"]') ??
      window.document.head.appendChild(window.document.createElement("meta"));
    const previous = meta.content;
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    return () => {
      meta.content = previous;
    };
  }, []);

  const document = useQuery({
    queryKey: [...queryKeys.sharedDocument(token), submittedPasscode ? "unlocked" : "locked"],
    queryFn: () => publicShareApi.get(token, submittedPasscode),
    retry: false,
    enabled: Boolean(token),
  });

  const canComment = document.data?.can_comment ?? false;

  const comments = useQuery({
    queryKey: queryKeys.sharedComments(token),
    queryFn: () => publicShareApi.comments(token, submittedPasscode),
    retry: false,
    enabled: Boolean(token) && canComment,
  });

  const post = useMutation({
    mutationFn: (payload: { author_label: string; body: string }) =>
      publicShareApi.comment(token, payload, submittedPasscode),
    onSuccess: (created) => {
      localStorage.setItem(NAME_KEY, created.author_label);
      qc.setQueryData<SharedComment[]>(queryKeys.sharedComments(token), (previous) => [
        ...(previous ?? []),
        created,
      ]);
      setBody("");
      setJustPosted(true);
      window.setTimeout(() => setJustPosted(false), 4000);
    },
  });

  const code = errorCode(document.error);
  const needsPasscode =
    code === PASSCODE_REQUIRED || code === PASSCODE_INVALID || code === PASSCODE_LOCKED;

  if (document.isPending) {
    return <SharedWritingPageSkeleton />;
  }

  if (code === PASSCODE_LOCKED) {
    return (
      <Shell>
        <Notice icon={Lock} title="This link is locked">
          <p>
            Too many incorrect passcode attempts were made. Ask the person who shared it to
            send you a new link.
          </p>
        </Notice>
      </Shell>
    );
  }

  if (needsPasscode) {
    return (
      <Shell>
        <main className="shared-doc-gate">
          <div className="shared-doc-gate-card">
            <Lock aria-hidden="true" />
            <h1>Enter the passcode</h1>
            <p>
              The owner protected this document with a passcode. It is used for this visit
              only and is never stored on your device.
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (passcode.trim()) setSubmittedPasscode(passcode.trim());
              }}
            >
              <label>
                <span>Passcode</span>
                <input
                  type="password"
                  value={passcode}
                  onChange={(event) => setPasscode(event.target.value)}
                  autoComplete="off"
                  autoFocus
                  minLength={4}
                  required
                />
              </label>
              <button type="submit" className="shared-doc-primary" disabled={document.isFetching}>
                {document.isFetching ? "Checking…" : "Unlock document"}
              </button>
            </form>
            {code === PASSCODE_INVALID ? (
              <p className="shared-doc-error" role="alert">
                That passcode is not correct. A link locks after ten failed attempts.
              </p>
            ) : null}
          </div>
        </main>
      </Shell>
    );
  }

  if (document.isError || !document.data) {
    return (
      <Shell>
        <Notice icon={AlertTriangle} title="This link is no longer available">
          <p>
            The share link was revoked, has expired, or was mistyped. Ask the person who
            shared it for a new one.
          </p>
        </Notice>
      </Shell>
    );
  }

  const data = document.data;
  const thread = comments.data ?? [];

  return (
    <Shell>
      <main className="shared-doc-layout">
        <article className="shared-doc-paper" aria-labelledby="shared-doc-title">
          <header className="shared-doc-head">
            <div className="shared-doc-head-meta">
              <StatusBadge tone={canComment ? "blue" : "grey"}>
                {canComment ? "View and comment" : "View only"}
              </StatusBadge>
              <span>{label(data.document_type)}</span>
            </div>
            <h1 id="shared-doc-title">{data.title}</h1>
            <p className="shared-doc-stats">
              {data.word_count.toLocaleString()} words · {data.character_count.toLocaleString()}{" "}
              characters
              {data.expires_at ? (
                <>
                  {" · "}
                  <Clock aria-hidden="true" />
                  Access ends {new Date(data.expires_at).toLocaleDateString()}
                </>
              ) : null}
            </p>
          </header>
          <DocumentFrame html={data.html} title={`${data.title} — document body`} />
        </article>

        <aside className="shared-doc-rail" aria-label="Feedback">
          {canComment ? (
            <>
              <header className="shared-doc-rail-head">
                <MessageSquare aria-hidden="true" />
                <div>
                  <h2>Leave feedback</h2>
                  <p>
                    {thread.length
                      ? `${thread.length} comment${thread.length === 1 ? "" : "s"} so far`
                      : "Be the first to comment"}
                  </p>
                </div>
              </header>

              <form
                className="shared-doc-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!authorLabel.trim() || !body.trim()) return;
                  post.mutate({ author_label: authorLabel.trim(), body: body.trim() });
                }}
              >
                <label>
                  <span>Your name</span>
                  <input
                    value={authorLabel}
                    onChange={(event) => setAuthorLabel(event.target.value)}
                    maxLength={200}
                    required
                    placeholder="Dr Amara Osei"
                  />
                </label>
                <label>
                  <span>Comment</span>
                  <textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    rows={4}
                    maxLength={5000}
                    required
                    placeholder="What works, and what would you change?"
                  />
                </label>
                <div className="shared-doc-form-foot">
                  <small>{body.length}/5000</small>
                  <button
                    type="submit"
                    className="shared-doc-primary"
                    disabled={post.isPending || !authorLabel.trim() || !body.trim()}
                  >
                    {post.isPending ? "Sending…" : "Send comment"}
                  </button>
                </div>
                {justPosted ? (
                  <p className="shared-doc-success" role="status">
                    <CheckCircle2 aria-hidden="true" />
                    Sent — the author can see it now.
                  </p>
                ) : null}
                {post.isError ? (
                  <p className="shared-doc-error" role="alert">
                    {post.error instanceof Error
                      ? post.error.message
                      : "Your comment could not be sent."}
                  </p>
                ) : null}
              </form>

              {comments.isPending ? (
                <p className="shared-doc-rail-status">Loading comments…</p>
              ) : thread.length ? (
                <ol className="shared-doc-thread">
                  {thread.map((comment) => (
                    <li key={comment.id} className={comment.resolved ? "is-resolved" : undefined}>
                      <div className="shared-doc-thread-head">
                        <strong>{comment.author_label}</strong>
                        <time dateTime={comment.created_at}>
                          {relativeTime(comment.created_at)}
                        </time>
                      </div>
                      <p>{comment.body}</p>
                      {comment.resolved ? (
                        <StatusBadge tone="green" icon={CheckCircle2}>
                          Resolved
                        </StatusBadge>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : null}
            </>
          ) : (
            <div className="shared-doc-rail-status">
              <Lock aria-hidden="true" />
              <p>
                This link is read-only. Ask the author for a commenting link if you want to
                leave feedback.
              </p>
            </div>
          )}
        </aside>
      </main>
    </Shell>
  );
}
