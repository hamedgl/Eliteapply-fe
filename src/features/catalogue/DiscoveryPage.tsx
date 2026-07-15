import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Compass, RefreshCw, Search } from "lucide-react";
import { Link } from "react-router-dom";
import type { components } from "../../generated/api/schema";
import { discoveryApi } from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
import { usePromptDialog } from "../../components/PromptDialog";

type Match = components["schemas"]["OpportunityMatchResult"];
const label = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase());

export function DiscoveryPage() {
  const requestText = usePromptDialog();
  const qc = useQueryClient(),
    saved = useQuery({
      queryKey: queryKeys.savedSearches,
      queryFn: discoveryApi.savedSearches,
    }),
    recommendations = useQuery({
      queryKey: queryKeys.recommendations,
      queryFn: discoveryApi.recommendations,
    });
  const [matches, setMatches] = useState<
    components["schemas"]["OpportunityMatchResponse"] | null
  >(null);
  const runMatch = useMutation({
    mutationFn: discoveryApi.matches,
    onSuccess: setMatches,
  });
  const remove = useMutation({
    mutationFn: discoveryApi.deleteSavedSearch,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.savedSearches }),
  });
  const updateSaved = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: components["schemas"]["SavedSearchUpdate"];
    }) => discoveryApi.updateSavedSearch(id, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.savedSearches }),
  });
  const [runResult, setRunResult] = useState<{
    name: string;
    items: Record<string, unknown>[];
  } | null>(null);
  return (
    <div className="page phase2-page discovery-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Opportunity intelligence</span>
          <h1>Saved searches & matches</h1>
          <p>
            Return to useful searches and compare evidence-based matches. Scores
            organize options; they do not predict admission.
          </p>
        </div>
        <Link to="/app/catalogue">Browse catalogue</Link>
      </header>
      <div className="discovery-layout">
        <section className="discovery-saved">
          <header>
            <Bookmark />
            <div>
              <h2>Saved searches</h2>
              <p>Run a saved filter against the latest catalogue.</p>
            </div>
          </header>
          {saved.isPending ? (
            <p role="status">Loading saved searches…</p>
          ) : saved.data?.length ? (
            <ul className="saved-search-list">
              {saved.data.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      {label(item.entity_type)} ·{" "}
                      {item.last_run_at
                        ? `Last run ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(item.last_run_at))}`
                        : "Not run yet"}
                    </small>
                  </div>
                  <div>
                    <button
                      onClick={async () => {
                        const result = await discoveryApi.runSavedSearch(
                          item.id,
                        );
                        setRunResult({ name: item.name, items: result.items });
                      }}
                    >
                      <RefreshCw />
                      Run
                    </button>
                    <button
                      onClick={async () => {
                        const name = (
                          await requestText({
                            title: "Rename saved search",
                            label: "Search name",
                            initialValue: item.name,
                            required: true,
                          })
                        )?.trim();
                        if (name && name !== item.name)
                          updateSaved.mutate({ id: item.id, body: { name } });
                      }}
                    >
                      Rename
                    </button>
                    <button
                      onClick={async () => {
                        const filters = item.filters as Record<string, unknown>;
                        const search = await requestText({
                          title: "Edit search terms",
                          label: "Search terms",
                          description:
                            "Leave this blank to match any search term.",
                          initialValue: String(filters.search ?? ""),
                          submitLabel: "Continue",
                        });
                        if (search === null) return;
                        const country = await requestText({
                          title: "Edit country filter",
                          label: "Country code",
                          description:
                            "Leave this blank to include every country.",
                          initialValue: String(filters.country ?? ""),
                        });
                        if (country === null) return;
                        updateSaved.mutate({
                          id: item.id,
                          body: {
                            filters: {
                              search: search || null,
                              country: country || null,
                              institution_id:
                                (filters.institution_id as string) || null,
                              degree_level:
                                (filters.degree_level as string) || null,
                              field_of_study:
                                (filters.field_of_study as string) || null,
                              verified:
                                typeof filters.verified === "boolean"
                                  ? filters.verified
                                  : null,
                            },
                          },
                        });
                      }}
                    >
                      Edit filters
                    </button>
                    <button
                      className="danger-link"
                      onClick={() =>
                        confirm("Delete this saved search?") &&
                        remove.mutate(item.id)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="vault-empty">
              <h3>No saved searches</h3>
              <p>Set filters in the catalogue, then save the search.</p>
            </div>
          )}
          {runResult ? (
            <div className="saved-run">
              <h3>{runResult.name}</h3>
              {runResult.items.length ? (
                runResult.items.map((item, index) => (
                  <p key={String(item.id ?? index)}>
                    {String(item.name ?? "Catalogue result")}
                  </p>
                ))
              ) : (
                <p>No new matches for this search.</p>
              )}
            </div>
          ) : null}
        </section>
        <section className="match-panel">
          <header>
            <Compass />
            <div>
              <h2>Find relevant opportunities</h2>
              <p>Use academic context to rank programmes and scholarships.</p>
            </div>
          </header>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              runMatch.mutate({
                degree_level: String(d.get("degree_level")) || null,
                field_of_study: String(d.get("field_of_study")) || null,
                country_code: String(d.get("country_code")) || null,
                limit: Number(d.get("limit")),
              });
            }}
          >
            <label>
              Degree level
              <input name="degree_level" placeholder="Master's" />
            </label>
            <label>
              Field of study
              <input name="field_of_study" placeholder="Public policy" />
            </label>
            <label>
              Country code
              <input name="country_code" maxLength={2} placeholder="GB" />
            </label>
            <label>
              Results
              <select name="limit" defaultValue="10">
                <option>5</option>
                <option>10</option>
                <option>20</option>
              </select>
            </label>
            <button className="primary" disabled={runMatch.isPending}>
              <Search />
              {runMatch.isPending ? "Matching…" : "Find matches"}
            </button>
          </form>
        </section>
      </div>
      {matches ? (
        <Results
          title="Your matches"
          data={matches.items}
          disclaimer={matches.disclaimer}
        />
      ) : null}
      <Results
        title="Recommended for your profile"
        data={recommendations.data?.items ?? []}
        disclaimer={recommendations.data?.disclaimer}
        pending={recommendations.isPending}
      />
    </div>
  );
}

function Results({
  title,
  data,
  disclaimer,
  pending,
}: {
  title: string;
  data: Match[];
  disclaimer?: string;
  pending?: boolean;
}) {
  return (
    <section className="recommendation-section">
      <header>
        <div>
          <h2>{title}</h2>
          <p>
            {pending
              ? "Loading recommendations…"
              : `${data.length} opportunities surfaced`}
          </p>
        </div>
      </header>
      <div className="recommendation-list">
        {data.map((item) => (
          <article key={`${item.type}-${item.id}`}>
            <div>
              <span>{label(item.type)}</span>
              <h3>{item.name}</h3>
              <p>
                {item.institution_name ??
                  "Institution details available in catalogue"}
              </p>
            </div>
            <ul>
              {item.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <div>
              <small>Relevance score {item.score}</small>
              <Link
                to={`/app/applications?create=1&catalogueType=${item.type}&catalogueId=${item.id}&title=${encodeURIComponent(item.name)}`}
              >
                Create application
              </Link>
            </div>
          </article>
        ))}
      </div>
      {disclaimer ? (
        <p className="recommendation-disclaimer">
          <strong>How to read this:</strong> {disclaimer}
        </p>
      ) : null}
    </section>
  );
}
