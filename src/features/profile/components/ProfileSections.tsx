import { X } from "lucide-react";
import { Select } from "../../../components/ui/select";
import { CountryCombobox } from "../../../components/filters/CountryCombobox";
import { countryName } from "../../../lib/countries";
import { TagInput } from "./TagInput";
import {
  applicantTypes,
  studyLevels,
  studyModes,
  type GoalsSection,
  type InterestsSection,
} from "../model";

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
      <div className="wide profile-tag-field">
        <CountryCombobox
          label="Target countries"
          value=""
          onChange={(code) => {
            if (code && !countries.includes(code)) onCountries([...countries, code]);
          }}
        />
        {countries.length ? (
          <ul className="profile-tag-row is-below">
            {countries.map((code) => (
              <li className="apps-chip" key={code}>
                {countryName(code) ?? code}
                <button
                  type="button"
                  aria-label={`Remove ${countryName(code) ?? code}`}
                  onClick={() => onCountries(countries.filter((c) => c !== code))}
                >
                  <X aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="profile-field-hint">
            Search and select each country you plan to apply to.
          </p>
        )}
      </div>
      <div className="wide profile-tag-field" id="profile-nationalities">
        <CountryCombobox
          label="Your nationality or citizenship"
          value=""
          onChange={(code) => {
            const name = countryName(code);
            if (name && !goals.nationalities.includes(name))
              onGoals({ nationalities: [...goals.nationalities, name] });
          }}
        />
        {goals.nationalities.length ? (
          <ul className="profile-tag-row is-below">
            {goals.nationalities.map((nationality) => (
              <li className="apps-chip" key={nationality}>
                {nationality}
                <button
                  type="button"
                  aria-label={`Remove ${nationality}`}
                  onClick={() =>
                    onGoals({
                      nationalities: goals.nationalities.filter(
                        (item) => item !== nationality,
                      ),
                    })
                  }
                >
                  <X aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="profile-field-hint">
            Used only to check nationality-restricted opportunities.
          </p>
        )}
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
      <div className="wide">
        <TagInput
          label="Fields of study"
          hint="Press Enter or comma to add each field."
          placeholder="Public policy"
          values={goals.fields_of_study}
          onChange={(fields_of_study) => onGoals({ fields_of_study })}
        />
      </div>
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
      <div className="wide">
        <TagInput
          label="Interest tags"
          hint="Press Enter or comma to add each topic."
          placeholder="Machine learning"
          values={interests.interest_tags}
          onChange={(interest_tags) => onChange({ interest_tags })}
        />
      </div>
      <label className="wide">
        Summary
        <textarea
          rows={6}
          value={interests.summary}
          onChange={(event) => onChange({ summary: event.target.value })}
          placeholder="What draws you to these areas, and what you want to explore next."
        />
      </label>
    </div>
  );
}
