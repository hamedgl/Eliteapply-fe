import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePromptDialog } from "../../../components/PromptDialog";
import { OverflowMenu } from "../../../components/actions/OverflowMenu";
import { ConfirmationDialog } from "../../../components/actions/ConfirmationDialog";
import { StatusBadge } from "../../../components/data-display/StatusBadge";
import { remindersApi } from "../../../lib/api/phase3";
import { queryKeys } from "../../../lib/api/queryKeys";
import { useReminderContext } from "../hooks";
import { aggregateLabel, relativeSchedule, type Reminder } from "../model";
import { Bell, Mail, Pencil, Repeat, Trash2 } from "lucide-react";

const URGENCY_TONE = {
  overdue: "red",
  today: "amber",
  soon: "blue",
  later: "grey",
} as const;

export function ReminderCard({
  reminder,
  timezone,
  onEdit,
}: {
  reminder: Reminder;
  timezone: string;
  onEdit: (reminder: Reminder) => void;
}) {
  const qc = useQueryClient();
  const requestText = usePromptDialog();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const context = useReminderContext(reminder);
  const schedule = relativeSchedule(reminder.scheduled_at, reminder.timezone || timezone);
  const isCompleted = reminder.status === "completed";
  const cancelled = reminder.status === "cancelled";
  const isDone = isCompleted || cancelled;

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["reminders"] });
    void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
  };
  const toggleDone = useMutation({
    mutationFn: () =>
      remindersApi.update(reminder.id, {
        expected_version: reminder.version,
        status: isDone ? "scheduled" : "completed",
      }),
    onSuccess: refresh,
  });
  const snooze = useMutation({
    mutationFn: (until: string) => remindersApi.snooze(reminder.id, { until }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: () => remindersApi.remove(reminder.id),
    onSuccess: () => {
      refresh();
      setConfirmingDelete(false);
    },
  });

  async function promptSnooze() {
    const input = await requestText({
      title: "Snooze reminder",
      label: "Snooze until",
      type: "datetime-local",
      required: true,
      submitLabel: "Snooze",
    });
    if (input) snooze.mutate(new Date(input).toISOString());
  }

  return (
    <article className={`apps-card reminders-card${isDone ? " is-done" : ""}`}>
      <label className="reminders-done-toggle">
        <input
          type="checkbox"
          checked={isDone}
          onChange={() => toggleDone.mutate()}
          aria-label={isDone ? "Mark not done" : "Mark as completed"}
        />
      </label>
      <div className="reminders-card-body">
        <div className="reminders-card-heading">
          <h3>{reminder.title}</h3>
          {isCompleted ? (
            <StatusBadge tone="green">Completed</StatusBadge>
          ) : cancelled ? (
            <StatusBadge tone="grey">Dismissed</StatusBadge>
          ) : (
            <StatusBadge tone={URGENCY_TONE[schedule.urgency]}>{schedule.relative}</StatusBadge>
          )}
        </div>
        <p className="reminders-card-meta">
          {schedule.dateText}
          {reminder.application_id && reminder.application_title ? (
            <>
              {" · Application: "}
              <Link to={`/app/applications/${reminder.application_id}`}>
                {reminder.application_title}
              </Link>
            </>
          ) : context.label ? (
            ` · ${context.label}`
          ) : reminder.aggregate_type !== "custom" ? (
            ` · ${aggregateLabel[reminder.aggregate_type as keyof typeof aggregateLabel] ?? reminder.aggregate_type}`
          ) : null}
        </p>
        <div className="reminders-card-tags">
          {reminder.recurrence && reminder.recurrence !== "none" ? (
            <span>
              <Repeat aria-hidden="true" /> {reminder.recurrence}
            </span>
          ) : null}
          <span>
            {reminder.channel === "email" ? (
              <Mail aria-hidden="true" />
            ) : (
              <Bell aria-hidden="true" />
            )}
            {reminder.channel === "email" ? "Email" : "In-app"}
          </span>
        </div>
      </div>
      <OverflowMenu
        label={`More actions for ${reminder.title}`}
        items={[
          { key: "edit", label: "Edit", icon: Pencil, onClick: () => onEdit(reminder) },
          { key: "snooze", label: "Snooze", icon: Bell, onClick: promptSnooze },
          { key: "divider", divider: true },
          {
            key: "delete",
            label: "Delete",
            icon: Trash2,
            danger: true,
            onClick: () => setConfirmingDelete(true),
          },
        ]}
      />
      {confirmingDelete ? (
        <ConfirmationDialog
          title={`Delete “${reminder.title}”?`}
          confirmLabel="Delete reminder"
          pendingLabel="Deleting…"
          pending={remove.isPending}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => remove.mutate()}
        >
          <p>This permanently removes the reminder. This cannot be undone.</p>
        </ConfirmationDialog>
      ) : null}
    </article>
  );
}
