import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Clock, CornerDownLeft, Loader2, Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { searchApi } from "../../lib/api/phase3";
import { queryKeys } from "../../lib/api/queryKeys";
import { useDismiss } from "../../lib/dom-hooks";
import { preloadAppRoute } from "../../app/preload";
import { StatusBadge } from "../../components/data-display/StatusBadge";
import { relativeTime } from "../notifications/model";
import {
  ENTITY_META,
  SEARCH_ENTITY_TYPES,
  clearRecentSearches,
  entityMeta,
  highlightParts,
  inlineCompletion,
  pushRecentSearch,
  readRecentSearches,
  resultPath,
  type SearchEntityType,
  type SearchResultItem,
} from "./model";
import "./global-search.css";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 180;
const RESULTS_PER_TYPE = 4;

export type QuickDestination = readonly [href: string, label: string, icon: LucideIcon];

/** One keyboard-navigable row in the panel. */
type Entry =
  | { kind: "scope"; type: SearchEntityType }
  | { kind: "result"; item: SearchResultItem }
  | { kind: "recent"; term: string }
  | { kind: "nav"; destination: QuickDestination };

function Highlighted({ text, term }: { text: string; term: string }) {
  const parts = highlightParts(text, term);
  if (parts.length === 1) return <>{parts[0]}</>;
  return (
    <>
      {parts[0]}
      <mark>{parts[1]}</mark>
      {parts[2]}
    </>
  );
}

/**
 * Inline workspace search for the app topbar.
 *
 * Not a modal: the field lives in the bar and the results hang below it, so
 * searching never takes the page away. Results come from `GET /search`, which
 * matches real record content (applications, documents, drafts, stories,
 * references, reminders, catalogue) rather than only page names.
 */
export function GlobalSearch({
  destinations,
  placeholder = "Search anything…",
}: {
  destinations: readonly QuickDestination[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [scope, setScope] = useState<SearchEntityType | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recents, setRecents] = useState<string[]>(() => readRecentSearches());

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const listboxId = useId();

  const dismissRefs = useMemo(() => [rootRef], []);
  useDismiss(dismissRefs, () => setOpen(false), open);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const isSearching = debounced.length >= MIN_QUERY_LENGTH;
  const results = useQuery({
    queryKey: queryKeys.globalSearch(debounced, scope ? [scope] : []),
    queryFn: ({ signal }) =>
      searchApi.global(debounced, {
        types: scope ? [scope] : [],
        limit: RESULTS_PER_TYPE,
        signal,
      }),
    enabled: open && isSearching,
    // Keep the previous page of results on screen while the next one loads so
    // the panel never flashes empty between keystrokes.
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });

  const groups = useMemo(
    () => (isSearching ? (results.data?.groups ?? []) : []),
    [isSearching, results.data],
  );

  /** Entity types whose name the user appears to be typing — offered as scopes. */
  const typeSuggestions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (scope || term.length < MIN_QUERY_LENGTH) return [];
    return SEARCH_ENTITY_TYPES.filter((type) =>
      ENTITY_META[type].chip.toLowerCase().startsWith(term),
    ).slice(0, 2);
  }, [query, scope]);

  const idleDestinations = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matches = term
      ? destinations.filter(([, label]) => label.toLowerCase().includes(term))
      : destinations;
    return matches.slice(0, 6);
  }, [destinations, query]);

  const entries = useMemo<Entry[]>(() => {
    if (isSearching) {
      return [
        ...typeSuggestions.map((type) => ({ kind: "scope" as const, type })),
        ...groups.flatMap((group) =>
          group.items.map((item) => ({ kind: "result" as const, item })),
        ),
      ];
    }
    return [
      ...recents.map((term) => ({ kind: "recent" as const, term })),
      ...idleDestinations.map((destination) => ({ kind: "nav" as const, destination })),
    ];
  }, [groups, idleDestinations, isSearching, recents, typeSuggestions]);

  useEffect(() => setActiveIndex(0), [debounced, scope, isSearching]);

  // A background refetch can shrink the list under the cursor; keep it in range
  // so aria-activedescendant never points at a row that no longer exists.
  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(entries.length - 1, 0)));
  }, [entries.length]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const topResult = entries.find((entry) => entry.kind === "result");
  const completion =
    scope || typeSuggestions.length
      ? ""
      : inlineCompletion(query, topResult?.kind === "result" ? topResult.item.title : undefined);

  function commit(term: string) {
    setRecents(pushRecentSearch(term));
  }

  function go(path: string) {
    if (isSearching) commit(debounced);
    setOpen(false);
    inputRef.current?.blur();
    navigate(path);
  }

  function activate(entry: Entry | undefined) {
    if (!entry) return;
    if (entry.kind === "result") return go(resultPath(entry.item));
    if (entry.kind === "nav") return go(entry.destination[0]);
    if (entry.kind === "recent") {
      setQuery(entry.term);
      setDebounced(entry.term);
      inputRef.current?.focus();
      return;
    }
    setScope(entry.type);
    inputRef.current?.focus();
  }

  function acceptCompletion() {
    if (!completion) return false;
    setQuery(query + completion);
    setDebounced(query + completion);
    return true;
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const caretAtEnd =
      inputRef.current?.selectionStart === query.length &&
      inputRef.current?.selectionEnd === query.length;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, Math.max(entries.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      activate(entries[activeIndex]);
    } else if ((event.key === "Tab" || (event.key === "ArrowRight" && caretAtEnd)) && completion) {
      event.preventDefault();
      acceptCompletion();
    } else if (event.key === "Escape") {
      // Peel one layer at a time — scope, then text, then the panel — instead of
      // closing outright, and stop the shared dismiss listener from skipping ahead.
      if (scope) {
        event.stopPropagation();
        setScope(null);
      } else if (query) {
        event.stopPropagation();
        setQuery("");
        setDebounced("");
      } else {
        setOpen(false);
        inputRef.current?.blur();
      }
    } else if (event.key === "Backspace" && !query && scope) {
      setScope(null);
    }
  }

  const optionId = (index: number) => `${listboxId}-option-${index}`;
  const showPanel = open;
  const busy = results.isFetching && isSearching;

  let cursor = -1;
  const nextIndex = () => (cursor += 1);

  function rowProps(index: number) {
    return {
      id: optionId(index),
      role: "option" as const,
      "aria-selected": index === activeIndex,
      "data-active": index === activeIndex ? ("true" as const) : undefined,
      className: `global-search-row${index === activeIndex ? " is-active" : ""}`,
      onMouseMove: () => setActiveIndex(index),
    };
  }

  return (
    <div className="global-search" ref={rootRef}>
      <div className={`global-search-field${showPanel ? " is-open" : ""}`}>
        <Search aria-hidden="true" className="global-search-icon" />
        {scope ? (
          <button
            type="button"
            className="global-search-scope"
            onClick={() => {
              setScope(null);
              inputRef.current?.focus();
            }}
          >
            {ENTITY_META[scope].chip}
            <X aria-hidden="true" />
            <span className="sr-only">Clear search filter</span>
          </button>
        ) : null}
        <div className="global-search-entry">
          <span className="global-search-ghost" aria-hidden="true">
            <span>{query}</span>
            {completion}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder={scope ? `Search ${ENTITY_META[scope].chip.toLowerCase()}…` : placeholder}
            aria-label="Search your workspace"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              showPanel && entries.length ? optionId(activeIndex) : undefined
            }
            autoComplete="off"
            spellCheck={false}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
          />
        </div>
        {busy ? (
          <Loader2 aria-hidden="true" className="global-search-spinner" />
        ) : query ? (
          <button
            type="button"
            className="global-search-clear"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setDebounced("");
              inputRef.current?.focus();
            }}
          >
            <X aria-hidden="true" />
          </button>
        ) : (
          <kbd className="global-search-kbd">⌘K</kbd>
        )}
      </div>

      {showPanel ? (
        <div className="global-search-panel" ref={listRef}>
          <div id={listboxId} role="listbox" aria-label="Search results">
            {isSearching ? (
              <>
                {typeSuggestions.length ? (
                  <div className="global-search-section">
                    <p className="global-search-section-head">Narrow the search</p>
                    {typeSuggestions.map((type) => {
                      const index = nextIndex();
                      const Icon = ENTITY_META[type].icon;
                      return (
                        <button
                          key={type}
                          type="button"
                          {...rowProps(index)}
                          onClick={() => activate({ kind: "scope", type })}
                        >
                          <Icon aria-hidden="true" className="global-search-row-icon" />
                          <span className="global-search-row-body">
                            <span className="global-search-row-title">
                              Search {ENTITY_META[type].chip} only
                            </span>
                          </span>
                          <CornerDownLeft aria-hidden="true" className="global-search-row-hint" />
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {results.isError ? (
                  <div className="global-search-status" role="alert">
                    <p>Search is unavailable right now.</p>
                    <button type="button" onClick={() => results.refetch()}>
                      Try again
                    </button>
                  </div>
                ) : results.isPending ? (
                  <div className="global-search-skeleton" aria-hidden="true">
                    {[0, 1, 2].map((row) => (
                      <span key={row} />
                    ))}
                  </div>
                ) : groups.length ? (
                  groups.map((group) => {
                    const meta = entityMeta(group.entity_type);
                    const Icon = meta.icon;
                    return (
                      <div className="global-search-section" key={group.entity_type}>
                        <p className="global-search-section-head">
                          {meta.label}
                          {group.has_more ? <span>more available</span> : null}
                        </p>
                        {group.items.map((item) => {
                          const index = nextIndex();
                          return (
                            <button
                              key={`${item.entity_type}-${item.entity_id}`}
                              type="button"
                              {...rowProps(index)}
                              onPointerEnter={() => preloadAppRoute(resultPath(item))}
                              onClick={() => activate({ kind: "result", item })}
                            >
                              <Icon aria-hidden="true" className="global-search-row-icon" />
                              <span className="global-search-row-body">
                                <span className="global-search-row-title">
                                  <Highlighted text={item.title} term={debounced} />
                                </span>
                                {item.snippet ? (
                                  <span className="global-search-row-snippet">
                                    <Highlighted text={item.snippet} term={debounced} />
                                  </span>
                                ) : null}
                                <span className="global-search-row-meta">
                                  {item.status ? (
                                    <StatusBadge tone={meta.tone}>{item.status}</StatusBadge>
                                  ) : null}
                                  {item.subtitle ? <span>{item.subtitle}</span> : null}
                                  {item.updated_at ? (
                                    <time dateTime={item.updated_at}>
                                      {relativeTime(item.updated_at)}
                                    </time>
                                  ) : null}
                                </span>
                              </span>
                              <ArrowUpRight aria-hidden="true" className="global-search-row-hint" />
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                ) : (
                  <div className="global-search-status">
                    <p>
                      No matches for <strong>{debounced}</strong>
                      {scope ? ` in ${ENTITY_META[scope].chip.toLowerCase()}` : null}.
                    </p>
                    {scope ? (
                      <button type="button" onClick={() => setScope(null)}>
                        Search everything instead
                      </button>
                    ) : null}
                  </div>
                )}
              </>
            ) : (
              <>
                {recents.length ? (
                  <div className="global-search-section">
                    <p className="global-search-section-head">
                      Recent
                      <button
                        type="button"
                        className="global-search-section-action"
                        onClick={() => {
                          clearRecentSearches();
                          setRecents([]);
                        }}
                      >
                        Clear
                      </button>
                    </p>
                    {recents.map((term) => {
                      const index = nextIndex();
                      return (
                        <button
                          key={term}
                          type="button"
                          {...rowProps(index)}
                          onClick={() => activate({ kind: "recent", term })}
                        >
                          <Clock aria-hidden="true" className="global-search-row-icon" />
                          <span className="global-search-row-body">
                            <span className="global-search-row-title">{term}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                <div className="global-search-section">
                  <p className="global-search-section-head">Jump to</p>
                  {idleDestinations.map((destination) => {
                    const index = nextIndex();
                    const [href, label, Icon] = destination;
                    return (
                      <button
                        key={href}
                        type="button"
                        {...rowProps(index)}
                        onPointerEnter={() => preloadAppRoute(href)}
                        onClick={() => activate({ kind: "nav", destination })}
                      >
                        <Icon aria-hidden="true" className="global-search-row-icon" />
                        <span className="global-search-row-body">
                          <span className="global-search-row-title">{label}</span>
                        </span>
                      </button>
                    );
                  })}
                  {idleDestinations.length ? null : (
                    <p className="global-search-status">
                      Keep typing to search your workspace.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          <p className="global-search-footer">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> navigate
            </span>
            <span>
              <kbd>↵</kbd> open
            </span>
            <span>
              <kbd>tab</kbd> complete
            </span>
            <span>
              <kbd>esc</kbd> close
            </span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
