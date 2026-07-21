import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bookmark, Search, Sparkles, X } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { components } from "../../generated/api/schema";
import { discoveryApi, profileApi } from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
import { usePromptDialog } from "../../components/PromptDialog";
import { PageHeader } from "../../components/page/PageHeader";
import { SummaryStrip } from "../../components/page/SummaryStrip";
import { EmptyState } from "../../components/data-display/EmptyState";
import { ConfirmationDialog } from "../../components/actions/ConfirmationDialog";
import { SavedSearchCard } from "./components/SavedSearchCard";
import { SavedSearchEditDialog } from "./components/SavedSearchEditDialog";
import { MatchCard } from "./components/MatchCard";
import { MatchPreferencesDrawer, type MatchPreferences } from "./components/MatchPreferencesDrawer";
import { fitLevel, type SavedSearch } from "./discoveryModel";
import "../../styles/workspace.css";
import "./discovery.css";

type Match = components["schemas"]["OpportunityMatchResult"];
type Tab = "saved" | "recommended";

export function DiscoveryPage() {
  const requestText = usePromptDialog();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab | null) ?? "recommended";
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [deletingSearch, setDeletingSearch] = useState<SavedSearch | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<{ name: string; items: Record<string, unknown>[] } | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);

  const setTab = (next: Tab) => setParams({ tab: next }, { replace: true });

  const saved = useQuery({ queryKey: queryKeys.savedSearches, queryFn: discoveryApi.savedSearches });
  const recommendations = useQuery({ queryKey: queryKeys.recommendations, queryFn: discoveryApi.recommendations });
  const profile = useQuery({ queryKey: queryKeys.profile, queryFn: profileApi.get });

  const runSaved = useMutation({
    mutationFn: (id: string) => discoveryApi.runSavedSearch(id),
    onMutate: (id) => setRunningId(id),
    onSuccess: (result, id) => {
      const search = saved.data?.find((item) => item.id === id);
      setRunResult({ name: search?.name ?? "Saved search", items: result.items });
      void qc.invalidateQueries({ queryKey: queryKeys.savedSearches });
    },
    onSettled: () => setRunningId(null),
  });

  const remove = useMutation({
    mutationFn: (id: string) => discoveryApi.deleteSavedSearch(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.savedSearches });
      setDeletingSearch(null);
    },
  });

  const duplicate = useMutation({
    mutationFn: (search: SavedSearch) =>
      discoveryApi.createSavedSearch({
        name: `${search.name} (copy)`,
        entity_type: search.entity_type as "institution" | "programme" | "scholarship",
        filters: search.filters as components["schemas"]["SavedSearchFilters"],
        notification_frequency: search.notification_frequency as
          | "instant"
          | "daily"
          | "weekly"
          | "never",
        notify_on_new_matches: search.notify_on_new_matches,
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.savedSearches }),
  });

  const findMatches = useMutation({
    mutationFn: (prefs: MatchPreferences) =>
      discoveryApi.matches({
        degree_level: prefs.degreeLevel || null,
        field_of_study: prefs.fieldOfStudy || null,
        country_code: prefs.countryCode || null,
        limit: prefs.limit,
      }),
    onSuccess: (result) => {
      setMatches(result.items);
      setShowPreferences(false);
    },
  });

  async function renameSaved(search: SavedSearch) {
    const name = (
      await requestText({
        title: "Rename saved search",
        label: "Search name",
        initialValue: search.name,
        required: true,
      })
    )?.trim();
    if (name && name !== search.name)
      await discoveryApi.updateSavedSearch(search.id, { name });
    void qc.invalidateQueries({ queryKey: queryKeys.savedSearches });
  }

  const stats = useMemo(() => {
    const items = recommendations.data?.items ?? [];
    const strong = items.filter((item) => fitLevel(item.score).level === "strong");
    return {
      savedCount: saved.data?.length ?? 0,
      recommendedCount: items.length,
      strongCount: strong.length,
    };
  }, [saved.data, recommendations.data]);

  const profileIncomplete =
    profile.data != null &&
    (!profile.data.applicant_type || !profile.data.intended_study_level || !profile.data.target_countries?.length);
  const noProfile = profile.data === null;

  const defaultPreferences: MatchPreferences = {
    degreeLevel: profile.data?.intended_study_level ?? "",
    fieldOfStudy: "",
    countryCode: profile.data?.target_countries?.[0] ?? "",
    limit: 10,
  };

  return (
    <div className="page apps-page">
      <PageHeader
        eyebrow="Opportunity intelligence"
        title="Saved searches & matches"
        description="Track new opportunities and review recommendations based on your academic profile."
        actions={
          <Link className="apps-icon-button" to="/app/catalogue" aria-label="Browse catalogue" title="Browse catalogue">
            <Search aria-hidden="true" />
          </Link>
        }
      />

      <SummaryStrip
        metrics={[
          { key: "saved", icon: Bookmark, value: stats.savedCount, label: "Saved searches" },
          { key: "recommended", icon: Sparkles, value: stats.recommendedCount, label: "Recommended for you" },
          { key: "strong", icon: Sparkles, value: stats.strongCount, label: "Strong matches" },
        ]}
      />

      {noProfile || profileIncomplete ? (
        <p className="apps-notice is-info discovery-profile-callout">
          <AlertTriangle aria-hidden="true" />
          Complete your academic profile to improve recommendations.{" "}
          <Link to="/app/academic-profile">Go to profile</Link>
        </p>
      ) : null}

      <div className="view-toggle discovery-tabs" aria-label="Discovery view">
        <button type="button" className={tab === "saved" ? "selected" : ""} aria-pressed={tab === "saved"} onClick={() => setTab("saved")}>
          Saved searches
        </button>
        <button
          type="button"
          className={tab === "recommended" ? "selected" : ""}
          aria-pressed={tab === "recommended"}
          onClick={() => setTab("recommended")}
        >
          Recommended for you
        </button>
      </div>

      {tab === "saved" ? (
        <div className="discovery-saved-list">
          {saved.isPending ? (
            <p role="status">Loading saved searches…</p>
          ) : saved.data?.length ? (
            saved.data.map((item) => (
              <SavedSearchCard
                key={item.id}
                search={item}
                running={runningId === item.id}
                onRun={() => runSaved.mutate(item.id)}
                onRename={() => renameSaved(item)}
                onEditFilters={() => setEditingSearch(item)}
                onDuplicate={() => duplicate.mutate(item)}
                onDelete={() => setDeletingSearch(item)}
              />
            ))
          ) : (
            <EmptyState
              icon={Bookmark}
              heading="Save searches you want to revisit"
              description="Set filters in the catalogue, then save the search to check back for new matches."
              primaryAction={{ label: "Browse catalogue", onClick: () => navigate("/app/catalogue") }}
            />
          )}
          {runResult ? (
            <div className="apps-card discovery-run-result">
              <h3>{runResult.name}</h3>
              {runResult.items.length ? (
                <ul>
                  {runResult.items.map((item, index) => (
                    <li key={String(item.id ?? index)}>{String(item.name ?? "Catalogue result")}</li>
                  ))}
                </ul>
              ) : (
                <p>No matches for this search right now.</p>
              )}
              <button type="button" className="apps-inline-link" onClick={() => setRunResult(null)}>
                <X aria-hidden="true" /> Dismiss
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="discovery-recommended">
          <div className="discovery-recommended-toolbar">
            <button type="button" className="apps-filters-trigger" onClick={() => setShowPreferences(true)}>
              Match preferences
            </button>
          </div>

          {matches ? (
            <section className="discovery-results">
              <h3>Your matches</h3>
              <div className="match-grid">
                {matches.map((item) => (
                  <MatchCard key={`${item.type}-${item.id}`} match={item} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="discovery-results">
            <h3>Recommended for your profile</h3>
            {recommendations.isPending ? (
              <p role="status">Loading recommendations…</p>
            ) : recommendations.data?.items.length ? (
              <>
                <div className="match-grid">
                  {recommendations.data.items.map((item) => (
                    <MatchCard key={`${item.type}-${item.id}`} match={item} />
                  ))}
                </div>
                <p className="discovery-disclaimer">{recommendations.data.disclaimer}</p>
              </>
            ) : (
              <EmptyState
                variant="filtered"
                icon={Sparkles}
                heading="No recommendations yet"
                description="Try expanding your target countries, fields of study or degree level in your academic profile, or browse the catalogue directly."
                secondaryAction={<Link to="/app/catalogue">Browse catalogue</Link>}
              />
            )}
          </section>
        </div>
      )}

      {showPreferences ? (
        <MatchPreferencesDrawer
          initial={defaultPreferences}
          pending={findMatches.isPending}
          onClose={() => setShowPreferences(false)}
          onSubmit={(prefs) => findMatches.mutate(prefs)}
        />
      ) : null}
      {editingSearch ? (
        <SavedSearchEditDialog search={editingSearch} onClose={() => setEditingSearch(null)} />
      ) : null}
      {deletingSearch ? (
        <ConfirmationDialog
          title={`Delete “${deletingSearch.name}”?`}
          confirmLabel="Delete search"
          pendingLabel="Deleting…"
          pending={remove.isPending}
          onCancel={() => setDeletingSearch(null)}
          onConfirm={() => remove.mutate(deletingSearch.id)}
        >
          <p>This permanently removes the saved search. This cannot be undone.</p>
        </ConfirmationDialog>
      ) : null}
    </div>
  );
}
