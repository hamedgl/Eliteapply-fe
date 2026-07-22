import { ApiError } from "../../lib/api/errors";

const FIELD_LABELS: Record<string, string> = {
  institution: "Institution",
  field_of_study: "Field of study",
};

export type AcademicProfileRequirement = {
  detail: string;
  missingFields: string[];
};

export function academicProfileRequirement(
  error: unknown,
): AcademicProfileRequirement | null {
  if (
    !(error instanceof ApiError) ||
    error.status !== 422 ||
    error.code !== "academic_profile_incomplete" ||
    error.details?.required_action !== "complete_academic_profile"
  )
    return null;

  return {
    detail: error.message,
    missingFields: Array.isArray(error.details.missing_fields)
      ? error.details.missing_fields.filter(
          (field): field is string => typeof field === "string",
        )
      : [],
  };
}

export const academicProfileFieldLabel = (field: string) =>
  FIELD_LABELS[field] ?? field.replaceAll("_", " ");
