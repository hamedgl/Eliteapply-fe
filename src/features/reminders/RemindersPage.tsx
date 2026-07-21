import { useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, CheckCircle2, Plus } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { remindersApi } from "../../lib/api/phase3";
import { queryKeys } from "../../lib/api/queryKeys";
import { useSession } from "../../lib/auth/session";
import { PageHeader } from "../../components/page/PageHeader";
import { SummaryStrip } from "../../components/page/SummaryStrip";
import { EmptyState } from "../../components/data-display/EmptyState";
import { aggregateLabel, aggregateTypes, type Reminder } from "./model";
import { ReminderCard } from "./components/ReminderCard";
import { ReminderEditor } from "./components/ReminderEditor";
import { CalendarIntegrationCard } from "./components/CalendarIntegrationCard";
import "../../styles/workspace.css";
import "./reminders.css";

type Tab = "upcoming" | "overdue" | "cancelled" | "all";

export function RemindersPage() {
  const timezone = useSession((state) => state.user?.timezone) || "UTC";
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Reminder | "new" | null>(null);
  const tab = (params.get("tab") as Tab | null) ?? "upcoming";
  const contextFilter = params.get("context") ?? "";
  const setParam = (key: string, value: string) => {
    const copy = new URLSearchParams(params);
    if (value) copy.set(key, value);
    else copy.delete(key);
    setParams(copy, { replace: true });
  };

  const statusForTab = tab === "cancelled" ? "cancelled" : tab === "all" ? "" : "scheduled";
  const list = useInfiniteQuery({
    queryKey: queryKeys.reminders({ status: statusForTab, aggregateType: contextFilter }),
    queryFn: ({ pageParam }) =>
      remindersApi.list({
        status: statusForTab || undefined,
        aggregateType: contextFilter || undefined,
        cursor: pageParam,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
  });

  const items = useMemo(() => list.data?.pages.flatMap((page) => page.items) ?? [], [list.data]);

  const filtered = useMemo(() => {
    const now = Date.now();
    if (tab === "upcoming") return items.filter((r) => new Date(r.scheduled_at).getTime() >= now);
    if (tab === "overdue")
      return items.filter((r) => new Date(r.scheduled_at).getTime() < now && r.status === "scheduled");
    return items;
  }, [items, tab]);

  /** Independent of the tab/context filter above — otherwise switching tabs would zero out the summary. */
  const statsQuery = useQuery({
    queryKey: queryKeys.reminders({ status: "scheduled", stats: true }),
    queryFn: () => remindersApi.list({ status: "scheduled" }),
  });
  const stats = useMemo(() => {
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const scheduled = statsQuery.data?.items ?? [];
    const dueToday = scheduled.filter((r) => {
      const at = new Date(r.scheduled_at);
      return at.getTime() >= now.getTime() && at.getTime() <= endOfToday.getTime();
    });
    const overdue = scheduled.filter((r) => new Date(r.scheduled_at).getTime() < now.getTime());
    const upcomingWeek = scheduled.filter((r) => {
      const at = new Date(r.scheduled_at);
      const days = (at.getTime() - now.getTime()) / 86_400_000;
      return days >= 0 && days <= 7;
    });
    return { dueToday: dueToday.length, upcomingWeek: upcomingWeek.length, overdue: overdue.length };
  }, [statsQuery.data]);

  if (list.isPending)
    return (
      <div className="apps-skeleton" aria-busy="true" aria-label="Loading reminders">
        <div className="apps-skeleton-summary">
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="skeleton apps-skeleton-summary-item" key={i} />
          ))}
        </div>
        <div className="apps-skeleton-table">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="skeleton apps-skeleton-row" key={i} />
          ))}
        </div>
      </div>
    );

  if (list.isError)
    return (
      <div className="apps-page-error" role="alert">
        <h1>We couldn’t load your reminders.</h1>
        <button className="primary" onClick={() => list.refetch()}>
          Try again
        </button>
      </div>
    );

  return (
    <div className="page apps-page">
      <PageHeader
        title="Reminders"
        description="Stay ahead of application deadlines, reference follow-ups and important tasks."
        actions={
          <button className="primary" type="button" onClick={() => setEditing("new")}>
            <Plus aria-hidden="true" /> Create reminder
          </button>
        }
      />

      <SummaryStrip
        metrics={[
          { key: "today", icon: CalendarClock, value: stats.dueToday, label: "Due today" },
          { key: "week", icon: CheckCircle2, value: stats.upcomingWeek, label: "Upcoming this week" },
          {
            key: "overdue",
            icon: AlertTriangle,
            value: stats.overdue,
            label: "Overdue",
            attention: stats.overdue > 0,
            onClick: () => setParam("tab", "overdue"),
          },
        ]}
      />

      <div className="apps-card reminders-toolbar">
        <div className="view-toggle" aria-label="Reminder status">
          {(["upcoming", "overdue", "cancelled", "all"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={tab === value ? "selected" : ""}
              aria-pressed={tab === value}
              onClick={() => setParam("tab", value)}
            >
              {value === "upcoming"
                ? "Upcoming"
                : value === "overdue"
                  ? "Overdue"
                  : value === "cancelled"
                    ? "Dismissed"
                    : "All"}
            </button>
          ))}
        </div>
        <label className="apps-quick-filter">
          Related to
          <select value={contextFilter} onChange={(event) => setParam("context", event.target.value)}>
            <option value="">Everything</option>
            {aggregateTypes.map((type) => (
              <option value={type} key={type}>
                {aggregateLabel[type]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length ? (
        <div className="reminders-list">
          {filtered.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              timezone={timezone}
              onEdit={setEditing}
            />
          ))}
        </div>
      ) : tab === "upcoming" ? (
        <EmptyState
          icon={CheckCircle2}
          heading="You’re all caught up"
          description="No upcoming reminders right now."
          primaryAction={{ label: "Create reminder", onClick: () => setEditing("new") }}
        />
      ) : (
        <EmptyState variant="filtered" icon={CalendarClock} heading="Nothing here yet" />
      )}

      {list.hasNextPage ? (
        <button className="load-more" type="button" onClick={() => list.fetchNextPage()}>
          {list.isFetchingNextPage ? "Loading…" : "Load more reminders"}
        </button>
      ) : null}

      <CalendarIntegrationCard />

      {editing ? (
        <ReminderEditor
          editing={editing === "new" ? undefined : editing}
          timezone={timezone}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}
