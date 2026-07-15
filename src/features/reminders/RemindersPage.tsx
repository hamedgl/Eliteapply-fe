import { useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { components } from "../../generated/api/schema";
import { calendarFeedUrls } from "../../lib/calendarFeed";
import { remindersApi } from "../../lib/api/phase3";
import { queryKeys } from "../../lib/api/queryKeys";
import { useSession } from "../../lib/auth/session";
import { usePromptDialog } from "../../components/PromptDialog";

type S = components["schemas"];
type Feed = ReturnType<typeof calendarFeedUrls>;

export function RemindersPage() {
  const requestText = usePromptDialog();
  const timezone = useSession((state) => state.user?.timezone) || "UTC";
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [aggregateType, setAggregateType] = useState("");
  const [feed, setFeed] = useState<Feed | null>(null);
  const [calendarStatus, setCalendarStatus] = useState("");
  const filters = { status, aggregateType };
  const list = useInfiniteQuery({
    queryKey: queryKeys.reminders(filters),
    queryFn: ({ pageParam }) =>
      remindersApi.list({
        status: status || undefined,
        aggregateType: aggregateType || undefined,
        cursor: pageParam,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
  });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["reminders"] });
  const remove = useMutation({
    mutationFn: remindersApi.remove,
    onSuccess: refresh,
  });
  const snooze = useMutation({
    mutationFn: ({ id, until }: { id: string; until: string }) =>
      remindersApi.snooze(id, { until }),
    onSuccess: refresh,
  });
  const createFeed = useMutation({
    mutationFn: async () =>
      calendarFeedUrls((await remindersApi.createFeed()).feed_url),
    onMutate: () => setCalendarStatus("Creating your private link…"),
    onSuccess: (created) => {
      setFeed(created);
      setCalendarStatus("Calendar subscription link created.");
    },
    onError: () =>
      setCalendarStatus(
        "We couldn’t create the calendar link. Try again shortly.",
      ),
  });
  const revokeFeed = useMutation({
    mutationFn: remindersApi.revokeFeed,
    onMutate: () => setCalendarStatus("Revoking the calendar link…"),
    onSuccess: () => {
      setFeed(null);
      setCalendarStatus("The calendar link has been revoked.");
    },
    onError: () =>
      setCalendarStatus(
        "We couldn’t revoke the calendar link. Your existing link may still work.",
      ),
  });
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await remindersApi.create({
      mutation_id: crypto.randomUUID(),
      aggregate_type: data.get(
        "aggregate_type",
      ) as S["ReminderCreate"]["aggregate_type"],
      aggregate_id: String(data.get("aggregate_id")) || null,
      title: String(data.get("title")),
      notes: String(data.get("notes")) || null,
      scheduled_at: new Date(String(data.get("scheduled_at"))).toISOString(),
      timezone,
      recurrence: data.get("recurrence") as S["ReminderCreate"]["recurrence"],
      channel: data.get("channel") as S["ReminderCreate"]["channel"],
    });
    event.currentTarget.reset();
    refresh();
  }

  async function edit(item: (typeof items)[number]) {
    const title = await requestText({
      title: "Edit reminder",
      label: "Reminder title",
      initialValue: item.title,
      required: true,
    });
    if (title === null) return;
    await remindersApi.update(item.id, {
      expected_version: item.version,
      title,
    });
    refresh();
  }

  async function copyFeed() {
    if (!feed) return;
    try {
      await navigator.clipboard.writeText(feed.https);
      setCalendarStatus("Calendar subscription link copied.");
    } catch {
      setCalendarStatus(
        "Copy failed. Open the .ics link and copy its address.",
      );
    }
  }

  function revoke() {
    if (
      confirm(
        "Revoke this calendar link? Calendar apps using it will stop receiving updates.",
      )
    )
      revokeFeed.mutate();
  }

  return (
    <div className="page reminders-page">
      <header className="page-heading">
        <div>
          <h1>Reminders</h1>
          <p>
            Schedule follow-ups in {timezone}. Dates are stored with your
            profile timezone.
          </p>
        </div>
      </header>

      <section className="phase3-panel">
        <h2>New reminder</h2>
        <form className="reminder-form" onSubmit={create}>
          <label>
            Title
            <input name="title" required />
          </label>
          <label>
            Context
            <select name="aggregate_type">
              {[
                "application",
                "requirement",
                "task",
                "reference",
                "interview",
                "custom",
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Context ID <span className="muted">(optional)</span>
            <input name="aggregate_id" />
          </label>
          <label>
            When
            <input name="scheduled_at" type="datetime-local" required />
          </label>
          <label>
            Repeat
            <select name="recurrence">
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <label>
            Channel
            <select name="channel">
              <option value="in_app">In app</option>
              <option value="email">Email</option>
            </select>
          </label>
          <label className="wide">
            Notes
            <textarea name="notes" />
          </label>
          <button className="primary">Create reminder</button>
        </form>
      </section>

      <div className="phase3-filters">
        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label>
          Context
          <select
            value={aggregateType}
            onChange={(event) => setAggregateType(event.target.value)}
          >
            <option value="">All</option>
            {[
              "application",
              "requirement",
              "task",
              "reference",
              "interview",
              "custom",
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="phase3-card-list">
        {items.map((item) => (
          <article className="phase3-card" key={item.id}>
            <span className="status-pill">
              {item.status.replaceAll("_", " ")}
            </span>
            <h2>{item.title}</h2>
            <p>{item.notes || `${item.aggregate_type} reminder`}</p>
            <time dateTime={item.scheduled_at}>
              {new Date(item.scheduled_at).toLocaleString([], {
                timeZone: item.timezone,
              })}
            </time>
            <div className="phase3-actions">
              <button onClick={() => edit(item)}>Edit</button>
              <button
                onClick={async () => {
                  const input = await requestText({
                    title: "Snooze reminder",
                    label: "Snooze until",
                    type: "datetime-local",
                    required: true,
                    submitLabel: "Snooze",
                  });
                  if (input)
                    snooze.mutate({
                      id: item.id,
                      until: new Date(input).toISOString(),
                    });
                }}
              >
                Snooze
              </button>
              <button
                className="danger"
                onClick={() =>
                  confirm("Delete this reminder?") && remove.mutate(item.id)
                }
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
      {list.hasNextPage ? (
        <button className="load-more" onClick={() => list.fetchNextPage()}>
          Load more
        </button>
      ) : null}

      <section className="phase3-panel calendar-sync">
        <header className="phase3-section-head calendar-sync-header">
          <div>
            <h2>Calendar sync</h2>
            <p>
              Subscribe once to keep application deadlines and reminders in your
              calendar.
            </p>
          </div>
          <span className="status-pill">Private link</span>
        </header>

        {feed ? (
          <>
            <div className="calendar-feed-url">
              <div>
                <span>Subscription URL</span>
                <code>{feed.masked}</code>
              </div>
              <button className="secondary-action" onClick={copyFeed}>
                Copy URL
              </button>
            </div>
            <div className="phase3-actions calendar-sync-actions">
              <a
                className="secondary-action"
                href={feed.webcal}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in calendar app
              </a>
              <a
                className="secondary-action"
                href={feed.https}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open .ics feed
              </a>
              <a
                className="secondary-action"
                href={feed.https}
                download="eliteapply-calendar.ics"
                rel="noopener noreferrer"
              >
                Download .ics
              </a>
            </div>
            <p className="calendar-security">
              Anyone with this URL can read your calendar feed. Keep it secret;
              revoking it immediately stops future updates through this link.
            </p>
          </>
        ) : (
          <div className="calendar-sync-empty">
            <p>
              Create a private URL when you are ready to connect a calendar. The
              link stays only in this browser session.
            </p>
            <button
              className="primary"
              disabled={createFeed.isPending}
              onClick={() => createFeed.mutate()}
            >
              {createFeed.isPending ? "Creating link…" : "Create calendar link"}
            </button>
          </div>
        )}

        <details className="calendar-setup">
          <summary>Set up Google Calendar, Apple Calendar, or Outlook</summary>
          <ol>
            <li>
              <strong>Google Calendar</strong>
              <span>
                Open Other calendars, choose From URL, then paste the HTTPS
                link.
              </span>
            </li>
            <li>
              <strong>Apple Calendar</strong>
              <span>
                Choose New Calendar Subscription, then paste the HTTPS link.
              </span>
            </li>
            <li>
              <strong>Outlook</strong>
              <span>
                Choose Add calendar, Subscribe from web, then paste the HTTPS
                link.
              </span>
            </li>
          </ol>
        </details>

        <div className="calendar-revoke">
          <button
            className="secondary-action danger"
            disabled={revokeFeed.isPending}
            onClick={revoke}
          >
            {revokeFeed.isPending
              ? "Revoking link…"
              : feed
                ? "Revoke calendar link"
                : "Revoke an existing link"}
          </button>
        </div>
        <p className="calendar-status" role="status" aria-live="polite">
          {calendarStatus}
        </p>
      </section>
    </div>
  );
}
