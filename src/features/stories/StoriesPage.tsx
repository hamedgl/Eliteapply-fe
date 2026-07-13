import { useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { components } from "../../generated/api/schema";
import { writingApi } from "../../lib/api/phase3";
import { queryKeys } from "../../lib/api/queryKeys";
type S = components["schemas"];
type Story = S["StoryResponse"];
const categories = [
  "academic_achievement",
  "research_challenge",
  "leadership",
  "community_impact",
  "volunteering",
  "failure_recovery",
  "personal_hardship",
  "career_transition",
  "innovation",
  "collaboration",
  "ethical_decision",
  "long_term_goal",
] as const;
const label = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase());

export function StoriesPage() {
  const qc = useQueryClient(),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState<Story | null>(null),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [sensitivity, setSensitivity] = useState("");
  const filters = useMemo(
    () => ({
      search: search || undefined,
      category: category || undefined,
      sensitivity: sensitivity || undefined,
    }),
    [search, category, sensitivity],
  );
  const q = useInfiniteQuery({
    queryKey: queryKeys.stories(filters),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      writingApi.stories({ ...filters, cursor: pageParam }),
    getNextPageParam: (page) => (page.has_more ? page.next_cursor : undefined),
  });
  const items = q.data?.pages.flatMap((page) => page.items) ?? [];
  const remove = useMutation({
    mutationFn: writingApi.deleteStory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stories"] }),
  });
  return (
    <div className="page phase2-page stories-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Writing evidence</span>
          <h1>Story & evidence bank</h1>
          <p>
            Keep reusable examples private, sensitive or shareable. Story
            content is never sent to analytics.
          </p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          Add story
        </button>
      </header>
      <section className="story-filters" aria-label="Story filters">
        <label>
          Search
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stories"
          />
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {label(item)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sensitivity
          <select
            value={sensitivity}
            onChange={(e) => setSensitivity(e.target.value)}
          >
            <option value="">All sensitivity</option>
            <option value="private">Private</option>
            <option value="sensitive">Sensitive</option>
            <option value="shareable">Shareable</option>
          </select>
        </label>
      </section>
      {q.isPending ? (
        <p role="status">Loading stories…</p>
      ) : items.length ? (
        <div className="story-list">
          {items.map((item) => (
            <article className="story-row" key={item.id}>
              <header>
                <div>
                  <span className={`sensitivity-badge ${item.sensitivity}`}>
                    {label(item.sensitivity)}
                  </span>
                  <h2>{item.title}</h2>
                  <p>
                    {label(item.category)} · version {item.version}
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => {
                      setEditing(item);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="danger-link"
                    onClick={() =>
                      confirm("Delete this evidence story?") &&
                      remove.mutate(item.id)
                    }
                  >
                    Delete
                  </button>
                </div>
              </header>
              <dl>
                <div>
                  <dt>Situation</dt>
                  <dd>{item.situation}</dd>
                </div>
                <div>
                  <dt>Action</dt>
                  <dd>{item.action}</dd>
                </div>
                <div>
                  <dt>Outcome</dt>
                  <dd>{item.outcome}</dd>
                </div>
                {item.reflection ? (
                  <div>
                    <dt>Reflection</dt>
                    <dd>{item.reflection}</dd>
                  </div>
                ) : null}
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <div className="vault-empty">
          <h2>No stories match</h2>
          <p>Add a story or adjust the filters.</p>
        </div>
      )}
      {q.hasNextPage ? (
        <button
          className="load-more"
          onClick={() => q.fetchNextPage()}
          disabled={q.isFetchingNextPage}
        >
          {q.isFetchingNextPage ? "Loading…" : "Load more stories"}
        </button>
      ) : null}
      {open ? (
        <StoryDialog
          story={editing}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            void qc.invalidateQueries({ queryKey: ["stories"] });
          }}
        />
      ) : null}
    </div>
  );
}

function StoryDialog({
  story,
  onClose,
  onSaved,
}: {
  story: Story | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const values = {
      category: d.get("category") as Story["category"],
      title: String(d.get("title")),
      situation: String(d.get("situation")),
      action: String(d.get("action")),
      outcome: String(d.get("outcome")),
      reflection: String(d.get("reflection")) || null,
      sensitivity: d.get("sensitivity") as Story["sensitivity"],
      evidence: [],
      skills_values: [],
      prompt_types: [],
    };
    try {
      if (story)
        await writingApi.updateStory(story.id, {
          expected_version: story.version,
          ...values,
        });
      else await writingApi.createStory(values);
      onSaved();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Story could not be saved.",
      );
    }
  }
  return (
    <div className="dialog-backdrop">
      <form className="dialog settings-form story-dialog" onSubmit={submit}>
        <header>
          <div>
            <h2>{story ? "Edit evidence story" : "Add evidence story"}</h2>
            <p>
              {story
                ? `Saving against version ${story.version}. Conflicts will not overwrite newer work.`
                : "Capture the parts you may reuse in future writing."}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <label>
          Category
          <select name="category" defaultValue={story?.category}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {label(item)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Title
          <input
            name="title"
            required
            minLength={2}
            defaultValue={story?.title}
          />
        </label>
        {(["situation", "action", "outcome", "reflection"] as const).map(
          (field) => (
            <label key={field}>
              {label(field)}
              <textarea
                name={field}
                required={field !== "reflection"}
                minLength={field === "reflection" ? undefined : 2}
                defaultValue={story?.[field] ?? ""}
              />
            </label>
          ),
        )}
        <label>
          Sensitivity
          <select
            name="sensitivity"
            defaultValue={story?.sensitivity ?? "private"}
          >
            <option value="private">Private — only you</option>
            <option value="sensitive">Sensitive — explicit use only</option>
            <option value="shareable">
              Shareable — available for suggestions
            </option>
          </select>
        </label>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="dialog-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary">
            {story ? "Save changes" : "Save story"}
          </button>
        </div>
      </form>
    </div>
  );
}
