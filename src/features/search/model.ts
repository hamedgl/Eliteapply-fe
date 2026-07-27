import {
  Award,
  BookOpen,
  CalendarClock,
  Compass,
  FileText,
  FolderKanban,
  GraduationCap,
  Library,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { components } from "../../generated/api/schema";
import type { BadgeTone } from "../../components/data-display/StatusBadge";

export type SearchResultItem = components["schemas"]["SearchResultItem"];
export type SearchGroup = components["schemas"]["SearchGroup"];
export type SearchEntityType = SearchResultItem["entity_type"];

type EntityMeta = {
  /** Plural heading shown above a result group. */
  label: string;
  /** Short label used on the scope filter chips. */
  chip: string;
  icon: LucideIcon;
  tone: BadgeTone;
  /** Client route for a single record — the API deliberately returns none. */
  path: (item: SearchResultItem) => string;
};

/** Mirrors the backend's `SearchEntityType` literal (app/schemas/search.py). */
export const ENTITY_META: Record<SearchEntityType, EntityMeta> = {
  application: {
    label: "Applications",
    chip: "Applications",
    icon: FolderKanban,
    tone: "blue",
    path: (item) => `/app/applications/${item.entity_id}`,
  },
  document: {
    label: "Documents",
    chip: "Documents",
    icon: FileText,
    tone: "teal",
    path: (item) => `/app/documents/${item.entity_id}`,
  },
  writing_document: {
    label: "Writing Studio",
    chip: "Writing",
    icon: BookOpen,
    tone: "indigo",
    path: (item) => `/app/writing/${item.entity_id}`,
  },
  story: {
    label: "Story Bank",
    chip: "Stories",
    icon: Library,
    tone: "violet",
    // No per-story route exists; deep-link the list with the title pre-filtered.
    path: (item) => `/app/stories?search=${encodeURIComponent(item.title)}`,
  },
  reference: {
    label: "References",
    chip: "References",
    icon: Users,
    tone: "amber",
    path: (item) => `/app/references/${item.entity_id}`,
  },
  reminder: {
    label: "Reminders",
    chip: "Reminders",
    icon: CalendarClock,
    tone: "grey",
    path: () => "/app/reminders?tab=all",
  },
  institution: {
    label: "Institutions",
    chip: "Institutions",
    icon: GraduationCap,
    tone: "blue",
    path: (item) => `/app/catalogue/institutions/${item.entity_id}`,
  },
  programme: {
    label: "Programmes",
    chip: "Programmes",
    icon: Compass,
    tone: "indigo",
    path: (item) => `/app/catalogue/programmes/${item.entity_id}`,
  },
  scholarship: {
    label: "Scholarships",
    chip: "Scholarships",
    icon: Award,
    tone: "green",
    path: (item) => `/app/catalogue/scholarships/${item.entity_id}`,
  },
};

export const SEARCH_ENTITY_TYPES = Object.keys(ENTITY_META) as SearchEntityType[];

export function entityMeta(type: SearchEntityType | string): EntityMeta {
  return ENTITY_META[type as SearchEntityType] ?? ENTITY_META.application;
}

export function resultPath(item: SearchResultItem) {
  return entityMeta(item.entity_type).path(item);
}

/** Splits `text` into the matched run and its surrounds so the hit can be marked. */
export function highlightParts(text: string, term: string) {
  const needle = term.trim();
  if (!needle) return [text];
  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) return [text];
  return [
    text.slice(0, index),
    text.slice(index, index + needle.length),
    text.slice(index + needle.length),
  ];
}

/**
 * The remainder of `title` when the user's query is a prefix of it — the text
 * rendered as inline autocomplete behind the caret. Returns "" when the top
 * result doesn't start with what was typed, so nothing is suggested rather than
 * something misleading.
 */
export function inlineCompletion(query: string, title: string | undefined) {
  if (!query || !title) return "";
  return title.toLowerCase().startsWith(query.toLowerCase())
    ? title.slice(query.length)
    : "";
}

const RECENTS_KEY = "eliteapply-recent-searches";
const MAX_RECENTS = 6;

export function readRecentSearches(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]");
    return Array.isArray(raw)
      ? raw.filter((value): value is string => typeof value === "string").slice(0, MAX_RECENTS)
      : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(query: string): string[] {
  const term = query.trim();
  if (term.length < 2) return readRecentSearches();
  const next = [term, ...readRecentSearches().filter((value) => value !== term)].slice(
    0,
    MAX_RECENTS,
  );
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    // Private-mode storage failures must not break search.
  }
  return next;
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(RECENTS_KEY);
  } catch {
    // ignored — see pushRecentSearch
  }
}
