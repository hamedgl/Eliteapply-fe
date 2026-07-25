import type { components } from "../../generated/api/schema";

type S = components["schemas"];
export type Profile = S["AcademicProfileResponse"];

/**
 * `AcademicProfileSections` fixes the section keys; each section stays open
 * (`additionalProperties: true`), so the entry shapes below are a client
 * convention. Older profiles may still hold the legacy `{ summary: string }`
 * shape per section; readers fall back gracefully rather than lose data.
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

/*
 * `AcademicProfileSections` names these sections `tests`, `research`, `honors`
 * and `interests`. The server now normalises legacy long keys on read and a
 * migration renamed the stored ones, so this is a safety net for anything the
 * server has not normalised (older instance, cached response): reads accept
 * either name and writes emit the canonical key only.
 */
const LEGACY_SECTION_KEYS: Record<string, string> = {
  tests: "standardized_tests",
  research: "research_experience",
  honors: "honors_and_activities",
  interests: "academic_interests",
};

function readSection(sections: Record<string, unknown>, key: string) {
  const legacyKey = LEGACY_SECTION_KEYS[key];
  return sections[key] ?? (legacyKey ? sections[legacyKey] : undefined);
}

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
  return asEntries(readSection(sections, "education"), (text) => ({
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
  return asEntries(readSection(sections, "tests"), (text) => ({
    id: newId(),
    test_type: text,
    overall_score: "",
    test_date: "",
    expiration_date: "",
  }));
}

export function readLanguages(sections: Record<string, unknown>): LanguageEntry[] {
  return asEntries<LanguageEntry>(readSection(sections, "languages"), () => null);
}

export function readResearch(sections: Record<string, unknown>): ResearchEntry[] {
  return asEntries(readSection(sections, "research"), (text) => ({
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
  return asEntries(readSection(sections, "honors"), (text) => ({
    id: newId(),
    title: text,
    organisation: "",
    category: "",
    date: "",
    description: "",
  }));
}

export function readGoals(sections: Record<string, unknown>): GoalsSection {
  const raw = readSection(sections, "goals") as Partial<GoalsSection> | undefined;
  return {
    fields_of_study: raw?.fields_of_study ?? [],
    preferred_intake: raw?.preferred_intake ?? "",
    study_mode: raw?.study_mode ?? "",
    funding_requirement: raw?.funding_requirement ?? "",
  };
}

export function readInterests(sections: Record<string, unknown>): InterestsSection {
  const raw = readSection(sections, "interests");
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
  | "interests"
  | "research"
  | "honors"
  | "tests"
  | "languages";

export const sectionLabels: Record<SectionKey, string> = {
  goals: "Goals",
  education: "Education",
  interests: "Academic interests",
  research: "Research experience",
  honors: "Honors and activities",
  tests: "Standardized tests",
  languages: "Languages",
};

export const sectionOrder: SectionKey[] = [
  "goals",
  "education",
  "interests",
  "research",
  "honors",
  "tests",
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
  // Legacy duplicates are dropped, otherwise a saved profile would carry both
  // `tests` and `standardized_tests` forever and readers could diverge.
  const carried = Object.fromEntries(
    Object.entries(previousSections).filter(
      ([key]) => !Object.values(LEGACY_SECTION_KEYS).includes(key),
    ),
  );
  return {
    applicant_type: draft.applicant_type || null,
    intended_study_level: draft.intended_study_level || null,
    target_countries: draft.target_countries,
    sections: {
      ...carried,
      goals: draft.goals,
      education: { entries: draft.education },
      interests: draft.interests,
      research: { entries: draft.research },
      honors: { entries: draft.honors },
      tests: { entries: draft.tests },
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
    interests: Boolean(draft.interests.summary.trim() || draft.interests.interest_tags.length),
    research: draft.research.length > 0,
    honors: draft.honors.length > 0,
    tests: draft.tests.length > 0,
    languages: draft.languages.length > 0,
  };
}

export function profileCompletionPercent(completion: Record<string, boolean>) {
  const keys = sectionOrder;
  const done = keys.filter((key) => completion[key]).length;
  return Math.round((done / keys.length) * 100);
}

