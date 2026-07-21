import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { discoveryApi, type CatalogueFilters } from "../../../lib/api/phase2";
import { queryKeys } from "../../../lib/api/queryKeys";
import { usePromptDialog } from "../../../components/PromptDialog";
import { kindSingular, title, type Kind } from "../model";

/**
 * Saves the current catalogue filters via the real saved-search endpoint.
 * Notifications default off here (quick-save has no room for a frequency
 * picker) — turn them on from the saved search's "Edit filters" dialog on
 * the Saved Searches & Matches page.
 */
export function SaveSearchButton({ kind, filters }: { kind: Kind; filters: CatalogueFilters }) {
  const qc = useQueryClient();
  const requestText = usePromptDialog();
  const mutation = useMutation({
    mutationFn: (name: string) =>
      discoveryApi.createSavedSearch({
        name,
        entity_type: kindSingular[kind],
        notification_frequency: "never",
        notify_on_new_matches: false,
        filters: {
          search: filters.search,
          country: filters.country,
          degree_level: filters.degreeLevel,
          field_of_study: filters.fieldOfStudy,
          verified: filters.verified,
        },
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.savedSearches }),
  });

  async function save() {
    const defaultName = [
      title(kindSingular[kind]),
      filters.search,
      filters.country,
      filters.verified ? "Verified only" : null,
    ]
      .filter(Boolean)
      .join(" · ");
    const name = await requestText({
      title: "Save this search",
      label: "Search name",
      initialValue: defaultName,
      required: true,
      submitLabel: "Save search",
    });
    if (name) mutation.mutate(name);
  }

  return (
    <button
      type="button"
      className="apps-filters-trigger"
      disabled={mutation.isPending}
      onClick={save}
    >
      <Bookmark aria-hidden="true" />
      {mutation.isSuccess ? "Search saved" : "Save search"}
    </button>
  );
}
