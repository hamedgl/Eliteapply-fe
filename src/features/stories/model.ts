import type { components } from "../../generated/api/schema";

type S = components["schemas"];
export type Story = S["StoryResponse"];

/** The only categories the backend accepts. */
export const categories = [
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

export const sensitivities = ["private", "sensitive", "shareable"] as const;

export const sensitivityMeta: Record<
  (typeof sensitivities)[number],
  { tone: "grey" | "amber" | "green"; label: string; description: string }
> = {
  private: { tone: "grey", label: "Private", description: "Only visible to you." },
  sensitive: {
    tone: "amber",
    label: "Sensitive",
    description: "Requires confirmation before it's used in generated content.",
  },
  shareable: {
    tone: "green",
    label: "Shareable",
    description: "May be reused in generated application content.",
  },
};

export const label = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase());

/** Client convention for the untyped `evidence` field: {label, url}. Unknown shapes degrade gracefully. */
export type EvidenceItem = { label: string; url?: string };

export function readEvidence(raw: Story["evidence"]): EvidenceItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const value = entry as Record<string, unknown>;
    const label = typeof value.label === "string" ? value.label : JSON.stringify(entry);
    const url = typeof value.url === "string" ? value.url : undefined;
    return { label, url };
  });
}

/**
 * Readiness is computed client-side — there's no readiness field on
 * StoryResponse. "Ready" means the core SAOR content plus a reflection and
 * at least one piece of evidence or a named skill; numeric outcomes are
 * never required.
 */
export function storyReadiness(story: Story) {
  const hasCore = Boolean(story.situation.trim() && story.action.trim() && story.outcome.trim());
  const hasReflection = Boolean(story.reflection?.trim());
  const hasSupport = (story.evidence?.length ?? 0) > 0 || (story.skills_values?.length ?? 0) > 0;
  if (hasCore && hasReflection && hasSupport) return { ready: true, text: "Ready to use" };
  if (!hasCore) return { ready: false, text: "Needs core details" };
  return { ready: false, text: "Needs evidence" };
}
