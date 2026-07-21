import type { components } from "../../generated/api/schema";

type S = components["schemas"];
export type SavedSearch = S["SavedSearchResponse"];
export type Match = S["OpportunityMatchResult"];

export const entityTypeLabel: Record<string, string> = {
  institution: "Institution",
  programme: "Programme",
  scholarship: "Scholarship",
};

export type FitLevel = "strong" | "good" | "possible" | "limited";

export function fitLevel(score: number): { level: FitLevel; label: string; tone: "green" | "blue" | "amber" | "grey" } {
  if (score >= 80) return { level: "strong", label: "Strong match", tone: "green" };
  if (score >= 60) return { level: "good", label: "Good match", tone: "blue" };
  if (score >= 40) return { level: "possible", label: "Possible match", tone: "amber" };
  return { level: "limited", label: "Limited profile data", tone: "grey" };
}

/** Human-readable summary of a saved search's stored filters — never raw codes/ids. */
export function describeFilters(
  entityType: string,
  filters: Record<string, unknown>,
  countryName: (code: string) => string | null,
): string {
  const parts: string[] = [entityTypeLabel[entityType] ?? entityType];
  if (typeof filters.search === "string" && filters.search) parts.push(`"${filters.search}"`);
  if (typeof filters.country === "string" && filters.country)
    parts.push(countryName(filters.country) ?? filters.country);
  if (typeof filters.degree_level === "string" && filters.degree_level) parts.push(filters.degree_level);
  if (typeof filters.field_of_study === "string" && filters.field_of_study) parts.push(filters.field_of_study);
  if (filters.verified === true) parts.push("Verified only");
  return parts.join(" · ");
}
