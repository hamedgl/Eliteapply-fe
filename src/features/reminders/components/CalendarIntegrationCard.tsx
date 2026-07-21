import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Copy, ExternalLink } from "lucide-react";
import { calendarFeedUrls } from "../../../lib/calendarFeed";
import { remindersApi } from "../../../lib/api/phase3";
import { formatDate } from "../../applications/model";
import { OverflowMenu } from "../../../components/actions/OverflowMenu";
import { ConfirmationDialog } from "../../../components/actions/ConfirmationDialog";

type Feed = ReturnType<typeof calendarFeedUrls>;
const FEED_STATUS_KEY = ["calendar-feed", "status"];

export function CalendarIntegrationCard() {
  const qc = useQueryClient();
  const [feed, setFeed] = useState<Feed | null>(null);
  const [status, setStatus] = useState("");
  const [confirmingRevoke, setConfirmingRevoke] = useState(false);

  const feedStatus = useQuery({ queryKey: FEED_STATUS_KEY, queryFn: remindersApi.feedStatus });
  const connected = Boolean(feed) || Boolean(feedStatus.data?.active);

  const createFeed = useMutation({
    mutationFn: async () => calendarFeedUrls((await remindersApi.createFeed()).feed_url),
    onMutate: () => setStatus("Creating your private link…"),
    onSuccess: (created) => {
      setFeed(created);
      setStatus("Calendar subscription link created.");
      qc.invalidateQueries({ queryKey: FEED_STATUS_KEY });
    },
    onError: () => setStatus("We couldn’t create the calendar link. Try again shortly."),
  });
  const revokeFeed = useMutation({
    mutationFn: remindersApi.revokeFeed,
    onMutate: () => setStatus("Revoking the calendar link…"),
    onSuccess: () => {
      setFeed(null);
      setStatus("The calendar link has been revoked.");
      setConfirmingRevoke(false);
      qc.invalidateQueries({ queryKey: FEED_STATUS_KEY });
    },
    onError: () => setStatus("We couldn’t revoke the calendar link. Your existing link may still work."),
  });

  async function copyFeed() {
    if (!feed) return;
    try {
      await navigator.clipboard.writeText(feed.https);
      setStatus("Calendar subscription link copied.");
    } catch {
      setStatus("Copy failed. Open the .ics link and copy its address.");
    }
  }

  return (
    <section className="apps-card reminders-calendar-card">
      <header className="reminders-calendar-header">
        <div>
          <CalendarClock aria-hidden="true" />
          <div>
            <h2>Calendar sync</h2>
            <p>Subscribe once to keep application deadlines and reminders in your calendar.</p>
          </div>
        </div>
        {connected ? (
          <OverflowMenu
            label="Calendar link settings"
            items={[
              ...(feed
                ? [
                    { key: "copy", label: "Copy URL", icon: Copy, onClick: copyFeed },
                    {
                      key: "open",
                      label: "Open in calendar app",
                      icon: ExternalLink,
                      onClick: () => window.open(feed.webcal, "_blank"),
                    },
                    { key: "divider", divider: true } as const,
                  ]
                : []),
              {
                key: "revoke",
                label: "Revoke link",
                icon: CalendarClock,
                danger: true,
                onClick: () => setConfirmingRevoke(true),
              },
            ]}
          />
        ) : null}
      </header>

      {connected ? (
        <>
          <div className="reminders-calendar-status-row">
            <span className="apps-stage-pill apps-tone-green">Connected</span>
            {feed ? (
              <code>{feed.masked}</code>
            ) : (
              <span>
                {feedStatus.data?.created_at
                  ? `Since ${formatDate(feedStatus.data.created_at)}`
                  : null}
              </span>
            )}
          </div>
          <p className="reminders-calendar-security">
            {feed
              ? "Your calendar subscription link is private. Anyone with the link may be able to view included reminder details."
              : "Linked from another session. Revoke and create a new link if you need the URL again."}
          </p>
        </>
      ) : (
        <div className="reminders-calendar-empty-actions">
          <button className="primary" disabled={createFeed.isPending} onClick={() => createFeed.mutate()}>
            {createFeed.isPending ? "Creating link…" : "Create calendar subscription"}
          </button>
        </div>
      )}

      <details className="reminders-calendar-setup">
        <summary>Set up Google Calendar, Apple Calendar, or Outlook</summary>
        <ol>
          <li>
            <strong>Google Calendar</strong>
            <span>Open Other calendars, choose From URL, then paste the HTTPS link.</span>
          </li>
          <li>
            <strong>Apple Calendar</strong>
            <span>Choose New Calendar Subscription, then paste the HTTPS link.</span>
          </li>
          <li>
            <strong>Outlook</strong>
            <span>Choose Add calendar, Subscribe from web, then paste the HTTPS link.</span>
          </li>
        </ol>
      </details>

      {status ? (
        <p className="reminders-calendar-status" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}

      {confirmingRevoke ? (
        <ConfirmationDialog
          title="Revoke this calendar link?"
          confirmLabel="Revoke link"
          pendingLabel="Revoking…"
          pending={revokeFeed.isPending}
          onCancel={() => setConfirmingRevoke(false)}
          onConfirm={() => revokeFeed.mutate()}
        >
          <p>Calendar apps using this link will stop receiving updates immediately.</p>
        </ConfirmationDialog>
      ) : null}
    </section>
  );
}
