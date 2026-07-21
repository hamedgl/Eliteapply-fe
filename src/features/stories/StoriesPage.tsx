import { useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookMarked, CheckCircle2, Plus, Search, Share2, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { writingApi, storiesApi } from "../../lib/api/phase3";
import { queryKeys } from "../../lib/api/queryKeys";
import { PageHeader } from "../../components/page/PageHeader";
import { SummaryStrip } from "../../components/page/SummaryStrip";
import { EmptyState } from "../../components/data-display/EmptyState";
import { ConfirmationDialog } from "../../components/actions/ConfirmationDialog";
import { StoryCard } from "./components/StoryCard";
import { StoryEditor } from "./components/StoryEditor";
import { StoryAiAssistModal } from "./components/StoryAiAssistModal";
import { LinkEntitiesModal } from "./components/LinkEntitiesModal";
import { categories, label, sensitivities, storyReadiness, type Story } from "./model";
import "../../styles/workspace.css";
import "./stories.css";

export function StoriesPage() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Story | null | "new">(null);
  const [deleting, setDeleting] = useState<Story | null>(null);
  const [aiAssistStory, setAiAssistStory] = useState<Story | null>(null);
  const [linkingStory, setLinkingStory] = useState<Story | null>(null);

  const search = params.get("search") ?? "";
  const category = params.get("category") ?? "";
  const sensitivity = params.get("sensitivity") ?? "";
  const includeArchived = params.get("includeArchived") === "true";

  const setParam = (key: string, value: string) => {
    const copy = new URLSearchParams(params);
    if (value) copy.set(key, value);
    else copy.delete(key);
    setParams(copy, { replace: true });
  };

  const filters = useMemo(
    () => ({
      search: search || undefined,
      category: category || undefined,
      sensitivity: sensitivity || undefined,
      includeArchived: includeArchived || undefined,
    }),
    [search, category, sensitivity, includeArchived],
  );

  const q = useInfiniteQuery({
    queryKey: queryKeys.stories(filters),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => storiesApi.stories({ ...filters, cursor: pageParam }),
    getNextPageParam: (page) => (page.has_more ? page.next_cursor : undefined),
  });
  const items = q.data?.pages.flatMap((page) => page.items) ?? [];

  const stats = useMemo(() => {
    const active = items.filter((story) => !story.is_archived);
    const ready = active.filter((story) => storyReadiness(story).ready);
    const needsEvidence = active.filter((story) => !storyReadiness(story).ready);
    const shareable = active.filter((story) => story.sensitivity === "shareable");
    return {
      total: active.length,
      ready: ready.length,
      needsEvidence: needsEvidence.length,
      shareable: shareable.length,
    };
  }, [items]);

  const remove = useMutation({
    mutationFn: (id: string) => writingApi.deleteStory(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["stories"] });
      setDeleting(null);
    },
  });

  const archive = useMutation({
    mutationFn: (id: string) => storiesApi.archiveStory(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["stories"] }),
  });

  const unarchive = useMutation({
    mutationFn: (id: string) => storiesApi.unarchiveStory(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["stories"] }),
  });

  const duplicate = useMutation({
    mutationFn: (story: Story) =>
      writingApi.createStory({
        category: story.category,
        title: `${story.title} (copy)`,
        situation: story.situation,
        action: story.action,
        outcome: story.outcome,
        reflection: story.reflection,
        sensitivity: story.sensitivity,
        skills_values: story.skills_values,
        prompt_types: story.prompt_types,
        evidence: story.evidence,
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["stories"] }),
  });

  const clearFilters = () => setParams({}, { replace: true });
  const noFiltersActive = !search && !category && !sensitivity && !includeArchived;

  if (q.isPending)
    return (
      <div className="apps-skeleton" aria-busy="true" aria-label="Loading stories">
        <div className="apps-skeleton-summary">
          {Array.from({ length: 4 }).map((_, i) => (
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

  if (q.isError)
    return (
      <div className="apps-page-error" role="alert">
        <h1>We couldn’t load your stories.</h1>
        <button className="primary" onClick={() => q.refetch()}>
          Try again
        </button>
      </div>
    );

  return (
    <div className="page apps-page">
      <PageHeader
        eyebrow="Writing evidence"
        title="Story & evidence bank"
        description="Capture reusable achievements and experiences for essays, interviews and applications."
        actions={
          <button className="primary" type="button" onClick={() => setEditing("new")}>
            <Plus aria-hidden="true" /> Add story
          </button>
        }
      />

      <SummaryStrip
        metrics={[
          { key: "total", icon: BookMarked, value: stats.total, label: "Active stories" },
          { key: "ready", icon: CheckCircle2, value: stats.ready, label: "Ready to use" },
          {
            key: "needs-evidence",
            icon: BookMarked,
            value: stats.needsEvidence,
            label: "Needs evidence",
            attention: stats.needsEvidence > 0,
          },
          { key: "shareable", icon: Share2, value: stats.shareable, label: "Shareable" },
        ]}
      />

      <div className="apps-card apps-toolbar">
        <div className="apps-toolbar-search">
          <Search aria-hidden="true" />
          <input
            type="search"
            aria-label="Search stories, achievements or organisations"
            value={search}
            onChange={(event) => setParam("search", event.target.value)}
            placeholder="Search stories, achievements or organisations"
          />
          {search ? (
            <button type="button" aria-label="Clear search" onClick={() => setParam("search", "")}>
              <X aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <label className="apps-quick-filter">
          Category
          <select value={category} onChange={(event) => setParam("category", event.target.value)}>
            <option value="">All categories</option>
            {categories.map((item) => (
              <option value={item} key={item}>
                {label(item)}
              </option>
            ))}
          </select>
        </label>

        <label className="apps-quick-filter">
          Privacy
          <select value={sensitivity} onChange={(event) => setParam("sensitivity", event.target.value)}>
            <option value="">All</option>
            {sensitivities.map((item) => (
              <option value={item} key={item}>
                {label(item)}
              </option>
            ))}
          </select>
        </label>

        <label className="check-field" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setParam("includeArchived", e.target.checked ? "true" : "")}
          />
          Include archived
        </label>
      </div>

      {items.length ? (
        <div className="story-list">
          {items.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onEdit={() => setEditing(story)}
              onDuplicate={() => duplicate.mutate(story)}
              onDelete={() => setDeleting(story)}
              onArchive={() => archive.mutate(story.id)}
              onUnarchive={() => unarchive.mutate(story.id)}
              onAiAssist={() => setAiAssistStory(story)}
              onLinkEntities={() => setLinkingStory(story)}
            />
          ))}
        </div>
      ) : noFiltersActive ? (
        <EmptyState
          icon={BookMarked}
          heading="Capture your first story"
          description="Reusable stories make essays, interviews and applications faster to write and more specific."
          primaryAction={{ label: "Add story", onClick: () => setEditing("new") }}
        />
      ) : (
        <EmptyState
          variant="filtered"
          icon={Search}
          heading="No stories match these filters"
          primaryAction={{ label: "Clear filters", onClick: clearFilters }}
        />
      )}

      {q.hasNextPage ? (
        <button className="load-more" type="button" disabled={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>
          {q.isFetchingNextPage ? "Loading…" : "Load more stories"}
        </button>
      ) : null}

      {editing ? (
        <StoryEditor story={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      ) : null}

      {deleting ? (
        <ConfirmationDialog
          title={`Delete “${deleting.title}”?`}
          confirmLabel="Delete story"
          pendingLabel="Deleting…"
          pending={remove.isPending}
          onCancel={() => setDeleting(null)}
          onConfirm={() => remove.mutate(deleting.id)}
        >
          <p>This permanently removes the story and its evidence links. This cannot be undone.</p>
        </ConfirmationDialog>
      ) : null}

      {aiAssistStory ? (
        <StoryAiAssistModal
          story={aiAssistStory}
          onClose={() => setAiAssistStory(null)}
          onApplied={() => void q.refetch()}
        />
      ) : null}

      {linkingStory ? (
        <LinkEntitiesModal
          open={Boolean(linkingStory)}
          story={linkingStory}
          onClose={() => setLinkingStory(null)}
        />
      ) : null}
    </div>
  );
}
