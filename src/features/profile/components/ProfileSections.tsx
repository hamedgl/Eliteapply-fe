import { X } from "lucide-react";
import { Select } from "../../../components/ui/select";
import { CountryCombobox } from "../../../components/filters/CountryCombobox";
import { countryName } from "../../../lib/countries";
import {
  applicantTypes,
  studyLevels,
  studyModes,
  type GoalsSection,
  type InterestsSection,
} from "../model";

const parseTags = (value: string) =>
  value.split(",").map((tag) => tag.trim()).filter(Boolean);

export function GoalsFields({
  applicantType,
  studyLevel,
  countries,
  goals,
  onApplicantType,
  onStudyLevel,
  onCountries,
  onGoals,
}: {
  applicantType: string;
  studyLevel: string;
  countries: string[];
  goals: GoalsSection;
  onApplicantType: (value: string) => void;
  onStudyLevel: (value: string) => void;
  onCountries: (value: string[]) => void;
  onGoals: (patch: Partial<GoalsSection>) => void;
}) {
  return (
    <div className="form-grid">
      <label>
        Applicant type
        <Select
          value={applicantType}
          onChange={(val) => onApplicantType(typeof val === "string" ? val : val?.target?.value)}
          placeholder="Select…"
          options={applicantTypes.map((item) => ({ value: item, label: item }))}
        />
      </label>
      <label>
        Intended study level
        <Select
          value={studyLevel}
          onChange={(val) => onStudyLevel(typeof val === "string" ? val : val?.target?.value)}
          placeholder="Select…"
          options={studyLevels.map((item) => ({ value: item, label: item }))}
        />
      </label>
      <div className="wide">
        <span className="profile-field-label">Target countries</span>
        {countries.length ? (
          <div className="profile-tag-row">
            {countries.map((code) => (
              <span className="apps-chip" key={code}>
                {countryName(code) ?? code}
                <button
                  type="button"
                  aria-label={`Remove ${countryName(code) ?? code}`}
                  onClick={() => onCountries(countries.filter((c) => c !== code))}
                >
                  <X aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <CountryCombobox
          label="Add a target country"
          value=""
          onChange={(code) => {
            if (code && !countries.includes(code)) onCountries([...countries, code]);
          }}
        />
      </div>
      <label>
        Preferred intake
        <input
          value={goals.preferred_intake}
          onChange={(event) => onGoals({ preferred_intake: event.target.value })}
          placeholder="Autumn 2027"
        />
      </label>
      <label>
        Study mode
        <Select
          value={goals.study_mode}
          onChange={(val) => onGoals({ study_mode: typeof val === "string" ? val : val?.target?.value })}
          placeholder="Select…"
          options={studyModes.map((item) => ({ value: item, label: item }))}
        />
      </label>
      <label className="wide">
        Fields of study
        <input
          value={goals.fields_of_study.join(", ")}
          onChange={(event) => onGoals({ fields_of_study: parseTags(event.target.value) })}
          placeholder="Public policy, Data science"
        />
      </label>
      <label className="wide">
        Funding requirement
        <input
          value={goals.funding_requirement}
          onChange={(event) => onGoals({ funding_requirement: event.target.value })}
          placeholder="Full funding needed, self-funded, partial scholarship…"
        />
      </label>
    </div>
  );
}

export function InterestsFields({
  interests,
  onChange,
}: {
  interests: InterestsSection;
  onChange: (patch: Partial<InterestsSection>) => void;
}) {
  return (
    <div className="form-grid">
      <label className="wide">
        Interest tags
        <input
          value={interests.interest_tags.join(", ")}
          onChange={(event) => onChange({ interest_tags: parseTags(event.target.value) })}
          placeholder="Public policy, Machine learning, Comparative law"
        />
      </label>
      <label className="wide">
        Summary
        <textarea
          rows={4}
          value={interests.summary}
          onChange={(event) => onChange({ summary: event.target.value })}
          placeholder="What draws you to these areas, and what you want to explore next."
        />
      </label>
    </div>
  );
}
