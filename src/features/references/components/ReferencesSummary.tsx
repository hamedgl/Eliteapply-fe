import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, Users } from "lucide-react";
import { referencesApi } from "../../../lib/api/phase3";
import { queryKeys } from "../../../lib/api/queryKeys";
import { SummaryStrip } from "../../../components/page/SummaryStrip";
import { describeDue } from "../model";

export type SummaryAction = { kind: "total" } | { kind: "awaiting" } | { kind: "completed" } | { kind: "attention" };

export function ReferencesSummary({ onApply }: { onApply: (action: SummaryAction) => void }) {
  // ponytail: single unfiltered page (50 items), same ceiling as ApplicationsSummary's
  // separate-unfiltered-query pattern — the list endpoint has no bulk/count-only endpoint to
  // aggregate against. Add real aggregation if a student ever has 50+ active references.
  const query = useQuery({ queryKey: queryKeys.references(), queryFn: () => referencesApi.list() });

  const stats = useMemo(() => {
    const items = query.data?.items ?? [];
    const awaiting = items.filter((item) => item.status === "invited");
    const completed = items.filter((item) => item.status === "approved");
    const attention = items.filter(
      (item) => item.status === "declined" || (item.status === "invited" && describeDue(item.expires_at).urgent),
    );
    return { total: items.length, awaiting: awaiting.length, completed: completed.length, attention: attention.length };
  }, [query.data]);

  const shown = (n: number) => (query.isPending ? "…" : n);
  return (
    <SummaryStrip
      metrics={[
        { key: "total", icon: Users, value: shown(stats.total), label: "Total references", onClick: () => onApply({ kind: "total" }) },
        {
          key: "awaiting",
          icon: Clock,
          value: shown(stats.awaiting),
          label: "Awaiting response",
          onClick: () => onApply({ kind: "awaiting" }),
        },
        {
          key: "completed",
          icon: CheckCircle2,
          value: shown(stats.completed),
          label: "Completed",
          onClick: () => onApply({ kind: "completed" }),
        },
        {
          key: "attention",
          icon: AlertTriangle,
          value: shown(stats.attention),
          label: "Need attention",
          attention: true,
          onClick: () => onApply({ kind: "attention" }),
        },
      ]}
    />
  );
}
