import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ENTITY_META,
  SEARCH_ENTITY_TYPES,
  clearRecentSearches,
  highlightParts,
  inlineCompletion,
  pushRecentSearch,
  readRecentSearches,
  resultPath,
  type SearchResultItem,
} from "../features/search/model";
import { autoReadPlan, dayBucket, groupByDay } from "../features/notifications/model";
import { searchApi } from "../lib/api/phase3";

function item(overrides: Partial<SearchResultItem> = {}): SearchResultItem {
  return {
    entity_type: "application",
    entity_id: "11111111-1111-1111-1111-111111111111",
    title: "Oxford MSc",
    subtitle: null,
    snippet: null,
    status: null,
    updated_at: null,
    ...overrides,
  };
}

describe("global search request", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("sends the term, joined types and limit, and forwards the abort signal", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json({ query: "x", groups: [], total: 0 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await searchApi.global("oxford msc", {
      types: ["application", "document"],
      limit: 4,
      signal: controller.signal,
    });

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/search?");
    expect(url).toContain("q=oxford+msc");
    expect(url).toContain("types=application%2Cdocument");
    expect(url).toContain("limit=4");
    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);
  });

  it("omits the types parameter when nothing narrows the search", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json({ query: "x", groups: [], total: 0 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await searchApi.global("essay", { types: [] });

    expect(String(fetchMock.mock.calls[0][0])).not.toContain("types=");
  });
});

describe("inline autocomplete", () => {
  it("completes only when the query is a case-insensitive prefix of the top result", () => {
    expect(inlineCompletion("oxf", "Oxford MSc")).toBe("ord MSc");
    expect(inlineCompletion("OXF", "Oxford MSc")).toBe("ord MSc");
    expect(inlineCompletion("msc", "Oxford MSc")).toBe("");
    expect(inlineCompletion("", "Oxford MSc")).toBe("");
    expect(inlineCompletion("oxf", undefined)).toBe("");
  });
});

describe("match highlighting", () => {
  it("splits around the first case-insensitive hit", () => {
    expect(highlightParts("Oxford MSc", "ford")).toEqual(["Ox", "ford", " MSc"]);
    expect(highlightParts("Oxford MSc", "OXFORD")).toEqual(["", "Oxford", " MSc"]);
  });

  it("returns the text untouched when there is no hit", () => {
    expect(highlightParts("Oxford MSc", "cambridge")).toEqual(["Oxford MSc"]);
    expect(highlightParts("Oxford MSc", "  ")).toEqual(["Oxford MSc"]);
  });
});

describe("result routing", () => {
  it("has a route for every entity type the backend can return", () => {
    for (const type of SEARCH_ENTITY_TYPES) {
      const path = resultPath(item({ entity_type: type, title: "Some title" }));
      expect(path.startsWith("/app/")).toBe(true);
    }
    expect(Object.keys(ENTITY_META)).toHaveLength(SEARCH_ENTITY_TYPES.length);
  });

  it("deep-links records with a detail route by id and stories by title", () => {
    expect(resultPath(item({ entity_type: "application" }))).toBe(
      "/app/applications/11111111-1111-1111-1111-111111111111",
    );
    expect(resultPath(item({ entity_type: "programme" }))).toBe(
      "/app/catalogue/programmes/11111111-1111-1111-1111-111111111111",
    );
    expect(resultPath(item({ entity_type: "story", title: "Team lead" }))).toBe(
      "/app/stories?search=Team%20lead",
    );
  });
});

describe("recent searches", () => {
  beforeEach(() => clearRecentSearches());

  it("keeps the newest first, de-duplicates, and caps the list", () => {
    for (const term of ["one", "two", "three", "four", "five", "six", "seven"]) {
      pushRecentSearch(term);
    }
    const recents = readRecentSearches();
    expect(recents[0]).toBe("seven");
    expect(recents).toHaveLength(6);
    expect(recents).not.toContain("one");

    pushRecentSearch("three");
    expect(readRecentSearches()[0]).toBe("three");
    expect(readRecentSearches().filter((term) => term === "three")).toHaveLength(1);
  });

  it("ignores terms too short to have been searched", () => {
    pushRecentSearch("a");
    pushRecentSearch("   ");
    expect(readRecentSearches()).toEqual([]);
  });
});

describe("notification day grouping", () => {
  // Buckets are local-day based, so build fixtures from a local noon anchor
  // rather than UTC literals that could land on either side of midnight.
  const now = new Date(2026, 6, 27, 12, 0, 0);
  const daysAgo = (days: number, hour = 9) =>
    new Date(2026, 6, 27 - days, hour, 0, 0).toISOString();

  it("labels today and yesterday relative to the local day boundary", () => {
    expect(dayBucket(daysAgo(0), now)).toBe("Today");
    expect(dayBucket(daysAgo(1), now)).toBe("Yesterday");
    expect(dayBucket(daysAgo(7), now)).not.toBe("Today");
  });

  it("preserves order and merges only adjacent items from the same day", () => {
    const groups = groupByDay(
      [
        { created_at: daysAgo(0, 11) },
        { created_at: daysAgo(0, 8) },
        { created_at: daysAgo(1, 22) },
      ],
      now,
    );
    expect(groups.map((group) => group.label)).toEqual(["Today", "Yesterday"]);
    expect(groups[0].items).toHaveLength(2);
    expect(groups[1].items).toHaveLength(1);
  });
});

describe("notification auto-read plan", () => {
  it("collapses to one mark-all request when everything unread is on screen", () => {
    expect(autoReadPlan(["a", "b", "c"], 3)).toEqual({ markAll: true, ids: [] });
    // More on screen than the counter reports (a stale count) still means
    // nothing is left behind, so mark-all is still correct.
    expect(autoReadPlan(["a", "b", "c"], 2)).toEqual({ markAll: true, ids: [] });
  });

  it("marks only the visible rows when unread notifications remain below the fold", () => {
    expect(autoReadPlan(["a", "b"], 9)).toEqual({ markAll: false, ids: ["a", "b"] });
  });

  it("does nothing when there is nothing unread on screen", () => {
    expect(autoReadPlan([], 4)).toEqual({ markAll: false, ids: [] });
  });

  it("falls back to per-row marking when the unread count has not loaded yet", () => {
    expect(autoReadPlan(["a"], 0)).toEqual({ markAll: false, ids: ["a"] });
  });
});
