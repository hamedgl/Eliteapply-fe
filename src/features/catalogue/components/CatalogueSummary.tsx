import { useQuery } from "@tanstack/react-query";
import { Landmark, Lock, GraduationCap, Sparkles } from "lucide-react";
import { catalogueApi } from "../../../lib/api/phase2";
import { useSession } from "../../../lib/auth/session";
import { SummaryStrip } from "../../../components/page/SummaryStrip";
import type { Kind } from "../model";

/**
 * Verified counts per kind (first-page `total`, so a good approximation
 * rather than an exact count for very large catalogues). "Private records"
 * has no dedicated filter param, so it's computed from a bounded sample of
 * each kind's first page rather than an exhaustive scan.
 */
export function CatalogueSummary({ onSelectKind }: { onSelectKind: (kind: Kind) => void }) {
  const userId = useSession((state) => state.user?.id);
  const institutions = useQuery({
    queryKey: ["catalogue", "summary", "institutions"],
    queryFn: () => catalogueApi.institutions({ verified: true }),
  });
  const programmes = useQuery({
    queryKey: ["catalogue", "summary", "programmes"],
    queryFn: () => catalogueApi.programmes({ verified: true }),
  });
  const scholarships = useQuery({
    queryKey: ["catalogue", "summary", "scholarships"],
    queryFn: () => catalogueApi.scholarships({ verified: true }),
  });
  const mine = useQuery({
    queryKey: ["catalogue", "summary", "mine"],
    queryFn: async () => {
      const [i, p, s] = await Promise.all([
        catalogueApi.institutions({}),
        catalogueApi.programmes({}),
        catalogueApi.scholarships({}),
      ]);
      return [...i.items, ...p.items, ...s.items].filter(
        (item) => item.created_by_user_id === userId,
      ).length;
    },
    enabled: Boolean(userId),
  });

  const shown = (query: {
    isPending: boolean;
    data?: { total?: number | null; items: unknown[] };
  }) => (query.isPending ? "…" : (query.data?.total ?? query.data?.items.length ?? 0));

  return (
    <SummaryStrip
      metrics={[
        {
          key: "institutions",
          icon: Landmark,
          value: shown(institutions),
          label: "Verified institutions",
          onClick: () => onSelectKind("institutions"),
        },
        {
          key: "programmes",
          icon: GraduationCap,
          value: shown(programmes),
          label: "Verified programmes",
          onClick: () => onSelectKind("programmes"),
        },
        {
          key: "scholarships",
          icon: Sparkles,
          value: shown(scholarships),
          label: "Verified scholarships",
          onClick: () => onSelectKind("scholarships"),
        },
        {
          key: "private",
          icon: Lock,
          value: mine.isPending ? "…" : (mine.data ?? 0),
          label: "Your private records",
        },
      ]}
    />
  );
}
