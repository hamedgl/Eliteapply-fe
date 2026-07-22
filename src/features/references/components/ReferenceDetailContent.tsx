import { useInfiniteQuery } from "@tanstack/react-query";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { StatusBadge } from "../../../components/data-display/StatusBadge";
import { referencesApi } from "../../../lib/api/phase3";
import { queryKeys } from "../../../lib/api/queryKeys";
import { formatDate, label } from "../../applications/model";
import { describeVisibility, methodLabel, nextAction, referenceTypeLabel, statusMeta, verificationLevelMeta, type Reference } from "../model";
import { ReferenceApplicationUsage } from "./ReferenceApplicationUsage";
import { ReferenceActionMenu, type ReferenceActionKind } from "./ReferenceActionMenu";

export function ReferenceDetailContent({
  reference,
  pending,
  onAction,
}: {
  reference: Reference;
  pending: boolean;
  onAction: (kind: ReferenceActionKind) => void;
}) {
  const status = statusMeta(reference.status);
  const visibility = describeVisibility(reference);
  const verification = verificationLevelMeta(reference.verification_level);
  const events = useInfiniteQuery({
    queryKey: queryKeys.referenceEvents(reference.id),
    queryFn: ({ pageParam }) => referencesApi.events(reference.id, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
  });
  const eventItems = events.data?.pages.flatMap((page) => page.items) ?? [];
  const attestationEntries = Object.entries(reference.attestation ?? {}).filter(
    ([, value]) => typeof value === "string" || typeof value === "boolean",
  );

  return (
    <div className="reference-detail">
      <header className="reference-detail-header">
        <div>
          <h2>{reference.referee_name}</h2>
          <p className="apps-row-subtitle">
            {reference.referee_role}
            {reference.institution ? ` · ${reference.institution}` : " · Institution not provided"}
          </p>
        </div>
        <ReferenceActionMenu reference={reference} pending={pending} onAction={onAction} />
      </header>

      <div className="reference-detail-badges">
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
        <span
          className={`reference-visibility-badge reference-visibility-${visibility.kind}`}
          title={visibility.description}
        >
          <Lock aria-hidden="true" /> {visibility.label}
        </span>
        <StatusBadge tone={verification.tone}>{verification.label}</StatusBadge>
      </div>
      <p className="apps-dialog-subtext">{visibility.description}</p>

      <section className="reference-next-action-callout">
        <strong>Recommended next step</strong>
        <p>{nextAction(reference)}</p>
      </section>

      <section className="apps-drawer-group">
        <h3>Request details</h3>
        <dl className="reference-detail-facts">
          <div>
            <dt>Method</dt>
            <dd>{methodLabel(reference.mode)}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{referenceTypeLabel(reference.reference_type)}</dd>
          </div>
          <div>
            <dt>Referee email</dt>
            <dd>{reference.referee_email_masked}</dd>
          </div>
          <div>
            <dt>Requested</dt>
            <dd>{formatDate(reference.created_at)}</dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd>{formatDate(reference.expires_at)}</dd>
          </div>
          {reference.last_reminded_at ? (
            <div>
              <dt>Last reminded</dt>
              <dd>{formatDate(reference.last_reminded_at)}</dd>
            </div>
          ) : null}
        </dl>
        <ReferenceApplicationUsage reference={reference} />
      </section>

      <section className="apps-drawer-group">
        <h3>Timeline</h3>
        {events.isPending ? (
          <p className="apps-dialog-subtext">Loading timeline…</p>
        ) : eventItems.length ? (
          <ol className="reference-timeline">
            {eventItems.map((event) => (
              <li key={event.id}>
                <span className="reference-timeline-dot" aria-hidden="true" />
                <div>
                  <strong>{label(event.event_type)}</strong>
                  <time dateTime={event.created_at}>{new Date(event.created_at).toLocaleString()}</time>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="apps-dialog-subtext">No activity recorded yet.</p>
        )}
        {events.hasNextPage ? (
          <button type="button" onClick={() => events.fetchNextPage()} disabled={events.isFetchingNextPage}>
            {events.isFetchingNextPage ? "Loading…" : "Load earlier activity"}
          </button>
        ) : null}
      </section>

      <section className="apps-drawer-group">
        <h3>Verification</h3>
        {reference.approved_at ? (
          <>
            <p className="reference-verification-evidence">
              <ShieldCheck aria-hidden="true" /> Approved {formatDate(reference.approved_at)} — {verification.label.toLowerCase()}.
              The referee self-attested the details below when submitting.
            </p>
            {attestationEntries.length ? (
              <dl className="reference-detail-facts">
                {attestationEntries.map(([key, value]) => (
                  <div key={key}>
                    <dt>{label(key)}</dt>
                    <dd>{typeof value === "boolean" ? (value ? "Confirmed" : "Not confirmed") : String(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <a
              className="apps-inline-link"
              href={`/verify/academic-reference/${reference.public_id}`}
              target="_blank"
              rel="noreferrer"
            >
              Open public verification record
            </a>
          </>
        ) : (
          <p className="apps-dialog-subtext">Not submitted yet — verification evidence appears once the referee responds.</p>
        )}
      </section>

      <section className="apps-drawer-group">
        <h3>Reference content</h3>
        {reference.mode === "existing_upload" ? (
          <p className="apps-dialog-subtext">
            <CheckCircle2 aria-hidden="true" />
            {reference.status === "approved"
              ? "The referee reviewed and confirmed the uploaded document. Use Download verified document to open your file."
              : "Waiting for the referee to review the uploaded document."}
          </p>
        ) : reference.confidential ? (
          <p className="reference-protected-notice">
            <Lock aria-hidden="true" /> Reference content is confidential and cannot be viewed from your account.
          </p>
        ) : reference.final_content ? (
          <p className="reference-final-content">{reference.final_content}</p>
        ) : (
          <p className="apps-dialog-subtext">
            <CheckCircle2 aria-hidden="true" /> Not submitted yet.
          </p>
        )}
      </section>
    </div>
  );
}
