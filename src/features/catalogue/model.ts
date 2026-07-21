import type { components } from "../../generated/api/schema";

type S = components["schemas"];
export type Kind = "institutions" | "programmes" | "scholarships";
export type CatalogueItem =
  | S["InstitutionResponse"]
  | S["ProgrammeResponse"]
  | S["ScholarshipResponse"];

export const kindSingular: Record<Kind, "institution" | "programme" | "scholarship"> = {
  institutions: "institution",
  programmes: "programme",
  scholarships: "scholarship",
};

export const kindLabel: Record<Kind, string> = {
  institutions: "Institutions",
  programmes: "Programmes",
  scholarships: "Scholarships",
};

export const title = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase());

export function itemMeta(item: CatalogueItem) {
  return item as CatalogueItem & {
    country_code?: string;
    degree_level?: string | null;
    field_of_study?: string | null;
    provider_name?: string | null;
    award_summary?: string | null;
    institution_id?: string | null;
    programme_count?: number;
    duration?: string | null;
    delivery_mode?: string | null;
    language?: string | null;
    tuition?: string | null;
    intake?: string | null;
    deadline_at?: string | null;
    funding_type?: string | null;
    eligibility?: string | null;
    is_open?: boolean;
    institution_type?: string | null;
  };
}
