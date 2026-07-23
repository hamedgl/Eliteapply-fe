import { useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  List,
  Plus,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { remindersApi } from "../../lib/api/phase3";
import { applicationsApi } from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
import { useSession } from "../../lib/auth/session";
import { PageHeader } from "../../components/page/PageHeader";
import { SummaryStrip } from "../../components/page/SummaryStrip";
import { EmptyState } from "../../components/data-display/EmptyState";
import { aggregateLabel, aggregateTypes, type Reminder } from "./model";
import { ReminderCard } from "./components/ReminderCard";
import { ReminderEditor } from "./components/ReminderEditor";
import { CalendarIntegrationCard } from "./components/CalendarIntegrationCard";
import { Select } from "../../components/ui/select";
import {
  EventManager,
  type CalendarEvent,
  type CalendarEventTone,
} from "../../components/ui/event-manager";
import "../../styles/workspace.css";
import "./reminders.css";

type Tab = "upcoming" | "overdue" | "cancelled" | "all";
type PageView = "list" | "calendar";

export function RemindersPage() {
  const timezone = useSession((state) => state.user?.timezone) || "UTC";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Reminder | "new" | null>(null);
  const [initialScheduledAt, setInitialScheduledAt] = useState<Date>();
  const pageView: PageView = params.get("view") === "calendar" ? "calendar" : "list";
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
    enabled: pageView === "list",
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
  const calendarReminders = useQuery({
    queryKey: queryKeys.reminders({ status: "scheduled", calendar: true }),
    queryFn: () => remindersApi.list({ status: "scheduled", limit: 100 }),
    enabled: pageView === "calendar",
  });
  const calendarApplications = useQuery({
    queryKey: [...queryKeys.applications, "calendar"],
    queryFn: () =>
      applicationsApi.list({
        sort: "deadline_asc",
        archived: false,
        limit: 100,
      }),
    enabled: pageView === "calendar",
  });
  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    const reminderEvents: CalendarEvent[] = (calendarReminders.data?.items ?? []).map(
      (reminder) => ({
        id: `reminder:${reminder.id}`,
        title: reminder.title,
        description: reminder.notes ?? undefined,
        startAt: reminder.scheduled_at,
        kind: "reminder",
        tone: reminderTone(reminder.scheduled_at),
        movable: true,
        source: reminder,
      }),
    );
    const deadlineEvents: CalendarEvent[] = (calendarApplications.data?.items ?? [])
      .filter((application) => application.primary_deadline_at)
      .map((application) => ({
        id: `deadline:${application.id}`,
        title: application.title,
        description: `${application.application_type} application deadline`,
        startAt: application.primary_deadline_at!,
        kind: "deadline",
        tone: deadlineTone(application.primary_deadline_at!),
        allDay: true,
        source: application,
      }));
    return [...reminderEvents, ...deadlineEvents];
  }, [calendarApplications.data, calendarReminders.data]);

  const reschedule = useMutation({
    mutationFn: ({
      reminder,
      startAt,
    }: {
      reminder: Reminder;
      startAt: Date;
    }) =>
      remindersApi.update(reminder.id, {
        expected_version: reminder.version,
        scheduled_at: startAt.toISOString(),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reminders"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

  const openCreate = (date?: Date) => {
    setInitialScheduledAt(date);
    setEditing("new");
  };

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

  if (pageView === "list" && list.isPending)
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

  if (pageView === "list" && list.isError)
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

      <div className="reminders-page-tabs" aria-label="Reminders view">
        <button
          type="button"
          className={pageView === "list" ? "selected" : ""}
          aria-pressed={pageView === "list"}
          onClick={() => setParam("view", "")}
        >
          <List aria-hidden="true" /> List
        </button>
        <button
          type="button"
          className={pageView === "calendar" ? "selected" : ""}
          aria-pressed={pageView === "calendar"}
          onClick={() => setParam("view", "calendar")}
        >
          <CalendarDays aria-hidden="true" /> Calendar
        </button>
      </div>

      {pageView === "list" ? (
        <>
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
              <Select
                value={contextFilter}
                onChange={(val) =>
                  setParam(
                    "context",
                    typeof val === "string" ? val : (val?.target?.value ?? ""),
                  )
                }
                options={[
                  { value: "", label: "Everything" },
                  ...aggregateTypes.map((type) => ({
                    value: type,
                    label: aggregateLabel[type],
                  })),
                ]}
              />
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
              primaryAction={{ label: "Create reminder", onClick: () => openCreate() }}
            />
          ) : (
            <EmptyState variant="filtered" icon={CalendarClock} heading="Nothing here yet" />
          )}

          {list.hasNextPage ? (
            <button
              className="load-more"
              type="button"
              onClick={() => list.fetchNextPage()}
            >
              {list.isFetchingNextPage ? "Loading…" : "Load more reminders"}
            </button>
          ) : null}
        </>
      ) : (
        <div className="reminders-calendar-view">
          {calendarReminders.isPending || calendarApplications.isPending ? (
            <div
              className="apps-card reminders-calendar-loading"
              role="status"
              aria-label="Loading calendar"
            >
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          ) : calendarReminders.isError || calendarApplications.isError ? (
            <div className="apps-page-error" role="alert">
              <h2>We couldn’t load your calendar.</h2>
              <button
                type="button"
                onClick={() => {
                  void calendarReminders.refetch();
                  void calendarApplications.refetch();
                }}
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              <EventManager
                events={calendarEvents}
                timezone={timezone}
                onCreate={(date) => {
                  const scheduledAt = new Date(date);
                  if (
                    scheduledAt.getHours() === 0 &&
                    scheduledAt.getMinutes() === 0
                  )
                    scheduledAt.setHours(9);
                  openCreate(scheduledAt);
                }}
                onEventSelect={(event) => {
                  if (event.kind === "reminder") {
                    setEditing(event.source as Reminder);
                  } else {
                    const application = event.source as { id: string };
                    navigate(`/app/applications/${application.id}`);
                  }
                }}
                onEventMove={(event, startAt) => {
                  if (event.kind === "reminder")
                    reschedule.mutate({
                      reminder: event.source as Reminder,
                      startAt,
                    });
                }}
              />
              {reschedule.isError ? (
                <p className="form-error" role="alert">
                  That reminder could not be rescheduled. Try again.
                </p>
              ) : null}
            </>
          )}
        </div>
      )}

      <CalendarIntegrationCard />

      {editing ? (
        <ReminderEditor
          editing={editing === "new" ? undefined : editing}
          timezone={timezone}
          initialScheduledAt={editing === "new" ? initialScheduledAt : undefined}
          onClose={() => {
            setEditing(null);
            setInitialScheduledAt(undefined);
          }}
        />
      ) : null}
    </div>
  );
}

function reminderTone(scheduledAt: string): CalendarEventTone {
  const hours = (new Date(scheduledAt).getTime() - Date.now()) / 3_600_000;
  if (hours < 0) return "red";
  if (hours <= 24 * 7) return "amber";
  return "blue";
}

function deadlineTone(deadlineAt: string): CalendarEventTone {
  const days = (new Date(deadlineAt).getTime() - Date.now()) / 86_400_000;
  if (days < 0) return "red";
  if (days <= 7) return "amber";
  return "violet";
}
