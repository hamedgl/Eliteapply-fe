import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, CheckCircle2, Layers } from "lucide-react";
import { applicationsApi } from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";
import { SummaryStrip } from "../../../components/page/SummaryStrip";
import { INACTIVE_STAGES, parseBoard } from "../model";

export type SummaryAction =
  | { kind: "active" }
  | { kind: "due-this-month" }
  | { kind: "needs-attention" }
  | { kind: "ready" };

/**
 * At-a-glance stats, always computed from the full (unfiltered) application
 * set so the numbers stay stable while the user filters the table below.
 */
export function ApplicationsSummary({
  onApply,
}: {
  onApply: (action: SummaryAction) => void;
}) {
  const query = useQuery({
    queryKey: [...queryKeys.board, "summary"],
    queryFn: async () => parseBoard(await applicationsApi.board({})),
    staleTime: 30_000,
  });

  const stats = useMemo(() => {
    const apps = Object.values(query.data?.columns ?? {}).flat();
    const now = new Date();
    const startOfDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const active = apps.filter((app) => !INACTIVE_STAGES.has(app.stage));
    const dueThisMonth = active.filter((app) => {
      if (!app.primary_deadline_at) return false;
      const d = new Date(app.primary_deadline_at);
      return (
        d.getUTCFullYear() === now.getUTCFullYear() &&
        d.getUTCMonth() === now.getUTCMonth()
      );
    });
    const needsAttention = active.filter((app) => {
      if (!app.primary_deadline_at) return false;
      const d = new Date(app.primary_deadline_at);
      const days = Math.round(
        (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - startOfDay) /
          86_400_000,
      );
      return days <= 3;
    });
    const ready = apps.filter((app) => app.stage === "ready_to_submit");
    return {
      active: active.length,
      dueThisMonth: dueThisMonth.length,
      needsAttention: needsAttention.length,
      ready: ready.length,
    };
  }, [query.data]);

  const shown = (n: number) => (query.isPending ? "…" : n);
  return (
    <SummaryStrip
      metrics={[
        {
          key: "active",
          icon: Layers,
          value: shown(stats.active),
          label: "Active applications",
          onClick: () => onApply({ kind: "active" }),
        },
        {
          key: "due-this-month",
          icon: CalendarClock,
          value: shown(stats.dueThisMonth),
          label: "Due this month",
          onClick: () => onApply({ kind: "due-this-month" }),
        },
        {
          key: "needs-attention",
          icon: AlertTriangle,
          value: shown(stats.needsAttention),
          label: "Need attention",
          attention: true,
          onClick: () => onApply({ kind: "needs-attention" }),
        },
        {
          key: "ready",
          icon: CheckCircle2,
          value: shown(stats.ready),
          label: "Ready to submit",
          onClick: () => onApply({ kind: "ready" }),
        },
      ]}
    />
  );
}
