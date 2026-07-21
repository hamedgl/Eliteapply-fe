import type { components } from "../../generated/api/schema";

type S = components["schemas"];
export type Profile = S["AcademicProfileResponse"];

/**
 * `sections` is a fully open JSON bag server-side (`additionalProperties: true`,
 * no per-key schema) — the shape below is a client convention, not a backend
 * contract. Older profiles may still have the legacy `{ summary: string }`
 * shape per section; readers here fall back gracefully rather than lose data.
 */
export type EducationEntry = {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  grade: string;
  grade_scale: string;
  country: string;
  description: string;
};

export type TestEntry = {
  id: string;
  test_type: string;
  overall_score: string;
  test_date: string;
  expiration_date: string;
};

export type LanguageEntry = {
  id: string;
  language: string;
  proficiency: string;
  certification: string;
  score: string;
  expiration_date: string;
};

export type ResearchEntry = {
  id: string;
  project_title: string;
  institution: string;
  supervisor: string;
  start_date: string;
  end_date: string;
  research_question: string;
  outcome: string;
};

export type HonorEntry = {
  id: string;
  title: string;
  organisation: string;
  category: string;
  date: string;
  description: string;
};

export type GoalsSection = {
  fields_of_study: string[];
  preferred_intake: string;
  study_mode: string;
  funding_requirement: string;
};

export type InterestsSection = {
  summary: string;
  interest_tags: string[];
};

export const newId = () => crypto.randomUUID();

function asEntries<T>(raw: unknown, fallback: (legacy: string) => T | null): T[] {
  if (raw && typeof raw === "object" && Array.isArray((raw as { entries?: unknown }).entries)) {
    return (raw as { entries: T[] }).entries;
  }
  // Legacy shape: `{ summary: "..." }` or a bare string — migrate to one entry.
  const legacyText =
    typeof raw === "string"
      ? raw
      : raw && typeof raw === "object" && typeof (raw as Record<string, unknown>).summary === "string"
        ? ((raw as Record<string, unknown>).summary as string)
        : "";
  if (!legacyText.trim()) return [];
  const migrated = fallback(legacyText);
  return migrated ? [migrated] : [];
}

export function readEducation(sections: Record<string, unknown>): EducationEntry[] {
  return asEntries(sections.education, (text) => ({
    id: newId(),
    institution: "",
    degree: "",
    field_of_study: "",
    start_date: "",
    end_date: "",
    grade: "",
    grade_scale: "",
    country: "",
    description: text,
  }));
}

export function readTests(sections: Record<string, unknown>): TestEntry[] {
  return asEntries(sections.standardized_tests, (text) => ({
    id: newId(),
    test_type: text,
    overall_score: "",
    test_date: "",
    expiration_date: "",
  }));
}

export function readLanguages(sections: Record<string, unknown>): LanguageEntry[] {
  return asEntries<LanguageEntry>(sections.languages, () => null);
}

export function readResearch(sections: Record<string, unknown>): ResearchEntry[] {
  return asEntries(sections.research_experience, (text) => ({
    id: newId(),
    project_title: "",
    institution: "",
    supervisor: "",
    start_date: "",
    end_date: "",
    research_question: "",
    outcome: text,
  }));
}

export function readHonors(sections: Record<string, unknown>): HonorEntry[] {
  return asEntries(sections.honors_and_activities, (text) => ({
    id: newId(),
    title: text,
    organisation: "",
    category: "",
    date: "",
    description: "",
  }));
}

export function readGoals(sections: Record<string, unknown>): GoalsSection {
  const raw = sections.goals as Partial<GoalsSection> | undefined;
  return {
    fields_of_study: raw?.fields_of_study ?? [],
    preferred_intake: raw?.preferred_intake ?? "",
    study_mode: raw?.study_mode ?? "",
    funding_requirement: raw?.funding_requirement ?? "",
  };
}

export function readInterests(sections: Record<string, unknown>): InterestsSection {
  const raw = sections.academic_interests;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const value = raw as Record<string, unknown>;
    return {
      summary: typeof value.summary === "string" ? value.summary : "",
      interest_tags: Array.isArray(value.interest_tags) ? (value.interest_tags as string[]) : [],
    };
  }
  return { summary: typeof raw === "string" ? raw : "", interest_tags: [] };
}

export const applicantTypes = [
  "First-time undergraduate",
  "Transfer student",
  "Graduate applicant",
  "International student",
  "Returning / non-traditional student",
] as const;

export const studyLevels = [
  "Undergraduate",
  "Postgraduate (Master's)",
  "Doctoral (PhD)",
  "Non-degree / exchange",
] as const;

export const studyModes = ["On campus", "Online", "Hybrid"] as const;

export const degreeLevels = ["Bachelor's", "Master's", "PhD", "Diploma", "Certificate", "Other"] as const;

export const proficiencyLevels = [
  "Native",
  "Fluent",
  "Advanced",
  "Intermediate",
  "Basic",
] as const;

export type SectionKey =
  | "goals"
  | "education"
  | "academic_interests"
  | "research_experience"
  | "honors_and_activities"
  | "standardized_tests"
  | "languages";

export const sectionLabels: Record<SectionKey, string> = {
  goals: "Goals",
  education: "Education",
  academic_interests: "Academic interests",
  research_experience: "Research experience",
  honors_and_activities: "Honors and activities",
  standardized_tests: "Standardized tests",
  languages: "Languages",
};

export const sectionOrder: SectionKey[] = [
  "goals",
  "education",
  "academic_interests",
  "research_experience",
  "honors_and_activities",
  "standardized_tests",
  "languages",
];

/** Every section is optional — only Goals + Education are the two "core" ones for the headline completion stat. */
export const CORE_SECTIONS: SectionKey[] = ["goals", "education"];

export type ProfileDraft = {
  applicant_type: string;
  intended_study_level: string;
  target_countries: string[];
  goals: GoalsSection;
  education: EducationEntry[];
  interests: InterestsSection;
  research: ResearchEntry[];
  honors: HonorEntry[];
  tests: TestEntry[];
  languages: LanguageEntry[];
};

export function readDraft(profile: Profile | null): ProfileDraft {
  const sections = (profile?.sections ?? {}) as Record<string, unknown>;
  return {
    applicant_type: profile?.applicant_type ?? "",
    intended_study_level: profile?.intended_study_level ?? "",
    target_countries: profile?.target_countries ?? [],
    goals: readGoals(sections),
    education: readEducation(sections),
    interests: readInterests(sections),
    research: readResearch(sections),
    honors: readHonors(sections),
    tests: readTests(sections),
    languages: readLanguages(sections),
  };
}

/** Builds the AcademicProfileUpsert body from a draft, preserving unknown existing section keys untouched. */
export function draftToUpsert(
  draft: ProfileDraft,
  previousSections: Record<string, unknown> = {},
): S["AcademicProfileUpsert"] {
  return {
    applicant_type: draft.applicant_type || null,
    intended_study_level: draft.intended_study_level || null,
    target_countries: draft.target_countries,
    sections: {
      ...previousSections,
      goals: draft.goals,
      education: { entries: draft.education },
      academic_interests: draft.interests,
      research_experience: { entries: draft.research },
      honors_and_activities: { entries: draft.honors },
      standardized_tests: { entries: draft.tests },
      languages: { entries: draft.languages },
    },
    completion: computeCompletion(draft),
  };
}

export function computeCompletion(draft: ProfileDraft): Record<string, boolean> {
  return {
    goals: Boolean(
      draft.applicant_type && draft.intended_study_level && draft.target_countries.length,
    ),
    education: draft.education.length > 0,
    academic_interests: Boolean(draft.interests.summary.trim() || draft.interests.interest_tags.length),
    research_experience: draft.research.length > 0,
    honors_and_activities: draft.honors.length > 0,
    standardized_tests: draft.tests.length > 0,
    languages: draft.languages.length > 0,
  };
}

export function profileCompletionPercent(completion: Record<string, boolean>) {
  const keys = sectionOrder;
  const done = keys.filter((key) => completion[key]).length;
  return Math.round((done / keys.length) * 100);
}

