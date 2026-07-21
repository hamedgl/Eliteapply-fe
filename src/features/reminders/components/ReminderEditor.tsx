import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationsApi } from "../../../lib/api/phase2";
import { remindersApi } from "../../../lib/api/phase3";
import { queryKeys } from "../../../lib/api/queryKeys";
import { newMutationId } from "../../../lib/api/mutations";
import { useReminderContext } from "../hooks";
import { offsetBefore, recurrenceOptions, type Reminder } from "../model";
import { ContextSelector, emptyContext, type ContextValue } from "./ContextSelector";

/** Converts a Date to the value a <input type="datetime-local"> expects, in the browser's local time. */
function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ReminderEditor({
  editing,
  timezone,
  onClose,
}: {
  editing?: Reminder;
  timezone: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const existingContext = useReminderContext(editing);
  const [context, setContext] = useState<ContextValue>(emptyContext);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [scheduledAt, setScheduledAt] = useState(
    editing ? toLocalInputValue(new Date(editing.scheduled_at)) : "",
  );
  const [recurrence, setRecurrence] = useState(editing?.recurrence ?? "none");
  const [channel, setChannel] = useState(editing?.channel ?? "in_app");
  const [notesOpen, setNotesOpen] = useState(Boolean(editing?.notes));

  const applicationDeadline = useQuery({
    queryKey: queryKeys.application(context.aggregateId),
    queryFn: () => applicationsApi.get(context.aggregateId),
    enabled: context.aggregateType === "application" && Boolean(context.aggregateId),
  });

  const save = useMutation({
    mutationFn: async () => {
      const scheduled_at = new Date(scheduledAt).toISOString();
      if (editing)
        return remindersApi.update(editing.id, {
          expected_version: editing.version,
          title,
          notes: notes || null,
          scheduled_at,
          timezone,
          recurrence: recurrence as (typeof recurrenceOptions)[number],
          channel: channel as "in_app" | "email",
        });
      return remindersApi.create({
        mutation_id: newMutationId(),
        aggregate_type: context.aggregateType,
        aggregate_id: context.aggregateId || null,
        title,
        notes: notes || null,
        scheduled_at,
        timezone,
        recurrence: recurrence as (typeof recurrenceOptions)[number],
        channel: channel as "in_app" | "email",
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reminders"] });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      onClose();
    },
  });

  const deadline = applicationDeadline.data?.primary_deadline_at;

  return (
    <div className="apps-dialog-backdrop" role="presentation">
      <section
        className="apps-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-editor-title"
      >
        <header>
          <h2 id="reminder-editor-title">{editing ? "Edit reminder" : "Create reminder"}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <label className="wide">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              autoFocus
            />
          </label>

          {editing ? (
            <p className="wide reminders-context-static">
              Related to: {existingContext?.label ?? "General"}
            </p>
          ) : (
            <ContextSelector value={context} onChange={setContext} />
          )}

          {!editing && context.aggregateType === "application" && deadline ? (
            <div className="wide reminders-deadline-presets">
              <span>Remind me:</span>
              {(["on", "1d", "3d", "1w"] as const).map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setScheduledAt(toLocalInputValue(offsetBefore(deadline, preset)))}
                >
                  {preset === "on"
                    ? "On the deadline"
                    : preset === "1d"
                      ? "1 day before"
                      : preset === "3d"
                        ? "3 days before"
                        : "1 week before"}
                </button>
              ))}
            </div>
          ) : null}

          <label>
            Date &amp; time
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              required
            />
          </label>
          <label>
            Repeat
            <select value={recurrence ?? "none"} onChange={(event) => setRecurrence(event.target.value)}>
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <label>
            Notify by
            <select value={channel} onChange={(event) => setChannel(event.target.value)}>
              <option value="in_app">In-app</option>
              <option value="email">Email</option>
            </select>
          </label>
          <p className="wide reminders-timezone-note">Times are shown in {timezone}.</p>

          {notesOpen ? (
            <label className="wide">
              Notes
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
            </label>
          ) : (
            <button
              type="button"
              className="apps-inline-link wide"
              onClick={() => setNotesOpen(true)}
            >
              + Add notes
            </button>
          )}

          {save.isError ? (
            <p className="form-error wide" role="alert">
              This reminder could not be saved. Try again.
            </p>
          ) : null}

          <div className="dialog-actions wide">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              className="primary"
              disabled={
                save.isPending ||
                !title.trim() ||
                !scheduledAt ||
                (!editing && context.aggregateType !== "custom" && !context.aggregateId)
              }
            >
              {save.isPending ? "Saving…" : editing ? "Save changes" : "Create reminder"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
