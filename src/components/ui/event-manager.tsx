"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  List,
  Plus,
  Search,
} from "lucide-react";
import "./event-manager.css";

export type CalendarEventKind = "reminder" | "deadline";
export type CalendarEventTone =
  | "blue"
  | "green"
  | "violet"
  | "amber"
  | "red"
  | "neutral";

export interface CalendarEvent {
  id: string;
  title: string;
  startAt: string | Date;
  endAt?: string | Date;
  kind: CalendarEventKind;
  tone?: CalendarEventTone;
  description?: string;
  allDay?: boolean;
  movable?: boolean;
  source?: unknown;
}

type CalendarView = "month" | "week" | "day" | "agenda";

export interface EventManagerProps {
  events: CalendarEvent[];
  timezone?: string;
  initialDate?: Date;
  compact?: boolean;
  className?: string;
  onCreate?: (date: Date) => void;
  onEventSelect?: (event: CalendarEvent) => void;
  onEventMove?: (event: CalendarEvent, startAt: Date) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const VIEW_OPTIONS: Array<{ value: CalendarView; label: string }> = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
  { value: "agenda", label: "Agenda" },
];

function startOfWeek(value: Date) {
  const date = startOfDay(value);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, amount: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function localDateKey(value: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function zonedDateKey(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function eventDateKey(event: CalendarEvent, timezone: string) {
  if (event.allDay && typeof event.startAt === "string") {
    const match = event.startAt.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  return zonedDateKey(new Date(event.startAt), timezone);
}

function monthDays(value: Date) {
  const first = new Date(value.getFullYear(), value.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function timeLabel(event: CalendarEvent, timezone: string) {
  if (event.allDay) return "All day";
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(event.startAt));
}

function dateLabel(value: Date, long = false) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: long ? "long" : undefined,
    month: long ? "long" : "short",
    day: "numeric",
    year: long ? "numeric" : undefined,
  }).format(value);
}

function dateKeyLabel(key: string) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${key}T12:00:00Z`));
}

function sortEvents(events: CalendarEvent[]) {
  return [...events].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
}

export function EventManager({
  events,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  initialDate = new Date(),
  compact = false,
  className = "",
  onCreate,
  onEventSelect,
  onEventMove,
}: EventManagerProps) {
  const [currentDate, setCurrentDate] = useState(startOfDay(initialDate));
  const [selectedDate, setSelectedDate] = useState(startOfDay(initialDate));
  const [view, setView] = useState<CalendarView>("month");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | CalendarEventKind>("all");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return sortEvents(
      events.filter(
        (event) =>
          (kind === "all" || event.kind === kind) &&
          (!term ||
            event.title.toLocaleLowerCase().includes(term) ||
            event.description?.toLocaleLowerCase().includes(term)),
      ),
    );
  }, [events, kind, query]);

  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();
    for (const event of filteredEvents) {
      const key = eventDateKey(event, timezone);
      grouped.set(key, [...(grouped.get(key) ?? []), event]);
    }
    return grouped;
  }, [filteredEvents, timezone]);

  const move = (event: CalendarEvent, day: Date, hour?: number) => {
    if (!event.movable || !onEventMove) return;
    const previous = new Date(event.startAt);
    const next = new Date(day);
    next.setHours(
      hour ?? previous.getHours(),
      previous.getMinutes(),
      previous.getSeconds(),
      previous.getMilliseconds(),
    );
    onEventMove(event, next);
  };

  const navigate = (direction: -1 | 1) => {
    const next = new Date(currentDate);
    if (view === "month" || compact) next.setMonth(next.getMonth() + direction);
    else if (view === "week") next.setDate(next.getDate() + direction * 7);
    else next.setDate(next.getDate() + direction);
    setCurrentDate(next);
    if (compact) setSelectedDate(next);
  };

  if (compact) {
    const days = monthDays(currentDate);
    const selectedEvents = eventsByDay.get(localDateKey(selectedDate)) ?? [];
    return (
      <section className={`event-manager is-compact ${className}`.trim()}>
        <CalendarHeader
          compact
          title={currentDate.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
          onPrevious={() => navigate(-1)}
          onNext={() => navigate(1)}
          onToday={() => {
            const today = startOfDay(new Date());
            setCurrentDate(today);
            setSelectedDate(today);
          }}
        />
        <div className="event-manager-weekdays" aria-hidden="true">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day.slice(0, 1)}</span>
          ))}
        </div>
        <div className="event-manager-mini-grid">
          {days.map((day) => {
            const key = localDateKey(day);
            const dayEvents = eventsByDay.get(key) ?? [];
            const selected = key === localDateKey(selectedDate);
            const today = key === localDateKey(new Date());
            return (
              <button
                type="button"
                key={key}
                className={[
                  day.getMonth() === currentDate.getMonth() ? "" : "outside",
                  selected ? "selected" : "",
                  today ? "today" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setSelectedDate(day)}
                aria-label={`${dateLabel(day, true)}, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`}
                aria-pressed={selected}
              >
                <span>{day.getDate()}</span>
                {dayEvents.length ? <i aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
        <div className="event-manager-mini-agenda" aria-live="polite">
          <strong>{dateLabel(selectedDate, true)}</strong>
          {selectedEvents.length ? (
            <div>
              {selectedEvents.slice(0, 3).map((event) => (
                <EventButton
                  key={event.id}
                  event={event}
                  timezone={timezone}
                  onSelect={onEventSelect}
                />
              ))}
            </div>
          ) : (
            <p>No deadlines on this day.</p>
          )}
        </div>
      </section>
    );
  }

  const title =
    view === "month"
      ? currentDate.toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        })
      : view === "week"
        ? `Week of ${dateLabel(startOfWeek(currentDate))}`
        : view === "day"
          ? dateLabel(currentDate, true)
          : "Schedule";

  return (
    <section className={`event-manager ${className}`.trim()}>
      <CalendarHeader
        title={title}
        onPrevious={() => navigate(-1)}
        onNext={() => navigate(1)}
        onToday={() => setCurrentDate(startOfDay(new Date()))}
        action={
          onCreate ? (
            <button
              type="button"
              className="event-manager-primary"
              onClick={() => onCreate(currentDate)}
            >
              <Plus aria-hidden="true" /> New reminder
            </button>
          ) : undefined
        }
      />

      <div className="event-manager-toolbar">
        <label className="event-manager-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Search schedule</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search reminders and deadlines"
          />
        </label>
        <select
          value={kind}
          onChange={(event) =>
            setKind(event.target.value as "all" | CalendarEventKind)
          }
          aria-label="Filter calendar"
        >
          <option value="all">Everything</option>
          <option value="reminder">Reminders</option>
          <option value="deadline">Deadlines</option>
        </select>
        <div className="event-manager-views" aria-label="Calendar view">
          {VIEW_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => setView(option.value)}
              className={view === option.value ? "selected" : ""}
              aria-pressed={view === option.value}
            >
              {option.value === "agenda" ? (
                <List aria-hidden="true" />
              ) : option.value === "day" ? (
                <Clock3 aria-hidden="true" />
              ) : (
                <CalendarDays aria-hidden="true" />
              )}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {view === "month" ? (
        <MonthView
          currentDate={currentDate}
          eventsByDay={eventsByDay}
          timezone={timezone}
          draggedId={draggedId}
          onDrag={setDraggedId}
          onDrop={(day) => {
            const event = events.find((item) => item.id === draggedId);
            if (event) move(event, day);
            setDraggedId(null);
          }}
          onCreate={onCreate}
          onOpenDay={(day) => {
            setCurrentDate(day);
            setView("day");
          }}
          onEventSelect={onEventSelect}
        />
      ) : view === "week" ? (
        <WeekView
          currentDate={currentDate}
          eventsByDay={eventsByDay}
          timezone={timezone}
          onCreate={onCreate}
          onEventSelect={onEventSelect}
          onDrop={(id, day) => {
            const event = events.find((item) => item.id === id);
            if (event) move(event, day);
          }}
        />
      ) : view === "day" ? (
        <DayView
          currentDate={currentDate}
          events={eventsByDay.get(localDateKey(currentDate)) ?? []}
          timezone={timezone}
          onCreate={onCreate}
          onEventSelect={onEventSelect}
          onMove={move}
        />
      ) : (
        <AgendaView
          events={filteredEvents}
          timezone={timezone}
          onEventSelect={onEventSelect}
        />
      )}
    </section>
  );
}

function CalendarHeader({
  title,
  compact = false,
  action,
  onPrevious,
  onNext,
  onToday,
}: {
  title: string;
  compact?: boolean;
  action?: React.ReactNode;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <header className="event-manager-header">
      <div>
        <h2>{title}</h2>
        <div className="event-manager-navigation">
          <button type="button" onClick={onPrevious} aria-label="Previous period">
            <ChevronLeft aria-hidden="true" />
          </button>
          {!compact ? (
            <button type="button" onClick={onToday}>
              Today
            </button>
          ) : null}
          <button type="button" onClick={onNext} aria-label="Next period">
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>
      {action}
    </header>
  );
}

function MonthView({
  currentDate,
  eventsByDay,
  timezone,
  draggedId,
  onDrag,
  onDrop,
  onCreate,
  onOpenDay,
  onEventSelect,
}: {
  currentDate: Date;
  eventsByDay: Map<string, CalendarEvent[]>;
  timezone: string;
  draggedId: string | null;
  onDrag: (id: string | null) => void;
  onDrop: (day: Date) => void;
  onCreate?: (date: Date) => void;
  onOpenDay: (date: Date) => void;
  onEventSelect?: (event: CalendarEvent) => void;
}) {
  return (
    <div className="event-manager-month">
      <div className="event-manager-weekdays" aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="event-manager-month-grid">
        {monthDays(currentDate).map((day) => {
          const key = localDateKey(day);
          const dayEvents = eventsByDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={[
                day.getMonth() === currentDate.getMonth() ? "" : "outside",
                key === localDateKey(new Date()) ? "today" : "",
                draggedId ? "can-drop" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDrop(day)}
            >
              <div className="event-manager-day-heading">
                <button
                  type="button"
                  onClick={() => onOpenDay(day)}
                  aria-label={`Open ${dateLabel(day, true)}`}
                >
                  {day.getDate()}
                </button>
                {onCreate ? (
                  <button
                    type="button"
                    className="event-manager-day-add"
                    onClick={() => onCreate(day)}
                    aria-label={`Add reminder on ${dateLabel(day, true)}`}
                  >
                    <Plus aria-hidden="true" />
                  </button>
                ) : null}
              </div>
              <div className="event-manager-day-events">
                {dayEvents.slice(0, 3).map((event) => (
                  <EventButton
                    key={event.id}
                    event={event}
                    timezone={timezone}
                    draggable={event.movable}
                    onDragStart={() => onDrag(event.id)}
                    onDragEnd={() => onDrag(null)}
                    onSelect={onEventSelect}
                  />
                ))}
                {dayEvents.length > 3 ? (
                  <button type="button" onClick={() => onOpenDay(day)}>
                    +{dayEvents.length - 3} more
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  currentDate,
  eventsByDay,
  timezone,
  onCreate,
  onEventSelect,
  onDrop,
}: {
  currentDate: Date;
  eventsByDay: Map<string, CalendarEvent[]>;
  timezone: string;
  onCreate?: (date: Date) => void;
  onEventSelect?: (event: CalendarEvent) => void;
  onDrop: (id: string, day: Date) => void;
}) {
  const days = Array.from({ length: 7 }, (_, index) =>
    addDays(startOfWeek(currentDate), index),
  );
  return (
    <div className="event-manager-week">
      {days.map((day) => {
        const dayEvents = eventsByDay.get(localDateKey(day)) ?? [];
        return (
          <section
            key={localDateKey(day)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(dropEvent) => {
              const id = dropEvent.dataTransfer.getData("text/calendar-event");
              if (id) onDrop(id, day);
            }}
          >
            <header>
              <span>{day.toLocaleDateString(undefined, { weekday: "short" })}</span>
              <strong>{day.getDate()}</strong>
              {onCreate ? (
                <button
                  type="button"
                  onClick={() => onCreate(day)}
                  aria-label={`Add reminder on ${dateLabel(day, true)}`}
                >
                  <Plus aria-hidden="true" />
                </button>
              ) : null}
            </header>
            <div>
              {dayEvents.length ? (
                dayEvents.map((event) => (
                  <EventButton
                    key={event.id}
                    event={event}
                    timezone={timezone}
                    draggable={event.movable}
                    onSelect={onEventSelect}
                  />
                ))
              ) : (
                <span className="event-manager-empty-day">Free</span>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function DayView({
  currentDate,
  events,
  timezone,
  onCreate,
  onEventSelect,
  onMove,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  timezone: string;
  onCreate?: (date: Date) => void;
  onEventSelect?: (event: CalendarEvent) => void;
  onMove: (event: CalendarEvent, day: Date, hour?: number) => void;
}) {
  return (
    <div className="event-manager-day-view">
      {Array.from({ length: 24 }, (_, hour) => {
        const hourEvents = events.filter(
          (event) =>
            event.allDay
              ? hour === 0
              : new Date(event.startAt).getHours() === hour,
        );
        return (
          <div
            key={hour}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(dropEvent) => {
              const id = dropEvent.dataTransfer.getData("text/calendar-event");
              const event = events.find((item) => item.id === id);
              if (event) onMove(event, currentDate, hour);
            }}
          >
            <time>{String(hour).padStart(2, "0")}:00</time>
            <section>
              {hourEvents.map((event) => (
                <EventButton
                  key={event.id}
                  event={event}
                  timezone={timezone}
                  draggable={event.movable}
                  onSelect={onEventSelect}
                />
              ))}
              {!hourEvents.length && onCreate ? (
                <button
                  type="button"
                  className="event-manager-hour-add"
                  onClick={() => {
                    const date = new Date(currentDate);
                    date.setHours(hour, 0, 0, 0);
                    onCreate(date);
                  }}
                >
                  Add reminder
                </button>
              ) : null}
            </section>
          </div>
        );
      })}
    </div>
  );
}

function AgendaView({
  events,
  timezone,
  onEventSelect,
}: {
  events: CalendarEvent[];
  timezone: string;
  onEventSelect?: (event: CalendarEvent) => void;
}) {
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = eventDateKey(event, timezone);
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  if (!events.length)
    return <p className="event-manager-empty">No events match these filters.</p>;
  return (
    <div className="event-manager-agenda">
      {[...groups.entries()].map(([key, dayEvents]) => (
        <section key={key}>
          <time dateTime={key}>
            {dateKeyLabel(key)}
          </time>
          <div>
            {dayEvents.map((event) => (
              <EventButton
                key={event.id}
                event={event}
                timezone={timezone}
                detailed
                onSelect={onEventSelect}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EventButton({
  event,
  timezone,
  detailed = false,
  draggable = false,
  onDragStart,
  onDragEnd,
  onSelect,
}: {
  event: CalendarEvent;
  timezone: string;
  detailed?: boolean;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onSelect?: (event: CalendarEvent) => void;
}) {
  return (
    <button
      type="button"
      className={`event-manager-event tone-${event.tone ?? "blue"}${detailed ? " detailed" : ""}`}
      draggable={draggable}
      onDragStart={(dragEvent) => {
        dragEvent.dataTransfer.setData("text/calendar-event", event.id);
        dragEvent.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
      onClick={() => onSelect?.(event)}
      title={`${event.title} · ${timeLabel(event, timezone)}`}
    >
      <i aria-hidden="true" />
      <span>
        <strong>{event.title}</strong>
        <small>
          {timeLabel(event, timezone)} ·{" "}
          {event.kind === "deadline" ? "Deadline" : "Reminder"}
        </small>
      </span>
    </button>
  );
}
