import { CountryCombobox } from "../../../components/filters/CountryCombobox";
import { RepeatableList } from "./RepeatableList";
import {
  degreeLevels,
  newId,
  proficiencyLevels,
  type EducationEntry,
  type HonorEntry,
  type LanguageEntry,
  type ResearchEntry,
  type TestEntry,
} from "../model";

export function EducationSection({
  entries,
  onChange,
}: {
  entries: EducationEntry[];
  onChange: (next: EducationEntry[]) => void;
}) {
  return (
    <RepeatableList
      entries={entries}
      onChange={onChange}
      addLabel="Add education"
      emptyText="No education history added yet."
      createEntry={() => ({
        id: newId(),
        institution: "",
        degree: "",
        field_of_study: "",
        start_date: "",
        end_date: "",
        grade: "",
        grade_scale: "",
        country: "",
        description: "",
      })}
      renderSummary={(entry) =>
        entry.institution || entry.degree
          ? `${entry.degree || "Degree"}${entry.institution ? ` · ${entry.institution}` : ""}`
          : "New education entry"
      }
      renderFields={(entry, update) => (
        <>
          <label>
            Institution
            <input value={entry.institution} onChange={(e) => update({ institution: e.target.value })} />
          </label>
          <label>
            Degree
            <select value={entry.degree} onChange={(e) => update({ degree: e.target.value })}>
              <option value="">Select…</option>
              {degreeLevels.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Field of study
            <input value={entry.field_of_study} onChange={(e) => update({ field_of_study: e.target.value })} />
          </label>
          <div>
            <CountryCombobox label="Country" value={entry.country} onChange={(code) => update({ country: code })} />
          </div>
          <label>
            Start date
            <input type="date" value={entry.start_date} onChange={(e) => update({ start_date: e.target.value })} />
          </label>
          <label>
            End date (or expected)
            <input type="date" value={entry.end_date} onChange={(e) => update({ end_date: e.target.value })} />
          </label>
          <label>
            Grade
            <input value={entry.grade} onChange={(e) => update({ grade: e.target.value })} placeholder="3.8" />
          </label>
          <label>
            Grade scale
            <input value={entry.grade_scale} onChange={(e) => update({ grade_scale: e.target.value })} placeholder="4.0 GPA" />
          </label>
          <label className="wide">
            Description
            <textarea rows={2} value={entry.description} onChange={(e) => update({ description: e.target.value })} />
          </label>
        </>
      )}
    />
  );
}

export function TestsSection({
  entries,
  onChange,
}: {
  entries: TestEntry[];
  onChange: (next: TestEntry[]) => void;
}) {
  return (
    <RepeatableList
      entries={entries}
      onChange={onChange}
      addLabel="Add test score"
      emptyText="No standardized test scores added yet."
      createEntry={() => ({ id: newId(), test_type: "", overall_score: "", test_date: "", expiration_date: "" })}
      renderSummary={(entry) => entry.test_type || "New test score"}
      renderFields={(entry, update) => (
        <>
          <label>
            Test type
            <input value={entry.test_type} onChange={(e) => update({ test_type: e.target.value })} placeholder="IELTS, TOEFL, GRE, SAT…" />
          </label>
          <label>
            Overall score
            <input value={entry.overall_score} onChange={(e) => update({ overall_score: e.target.value })} />
          </label>
          <label>
            Test date
            <input type="date" value={entry.test_date} onChange={(e) => update({ test_date: e.target.value })} />
          </label>
          <label>
            Expiration date
            <input type="date" value={entry.expiration_date} onChange={(e) => update({ expiration_date: e.target.value })} />
          </label>
        </>
      )}
    />
  );
}

export function LanguagesSection({
  entries,
  onChange,
}: {
  entries: LanguageEntry[];
  onChange: (next: LanguageEntry[]) => void;
}) {
  return (
    <RepeatableList
      entries={entries}
      onChange={onChange}
      addLabel="Add language"
      emptyText="No languages added yet."
      createEntry={() => ({ id: newId(), language: "", proficiency: "", certification: "", score: "", expiration_date: "" })}
      renderSummary={(entry) => entry.language || "New language"}
      renderFields={(entry, update) => (
        <>
          <label>
            Language
            <input value={entry.language} onChange={(e) => update({ language: e.target.value })} />
          </label>
          <label>
            Proficiency
            <select value={entry.proficiency} onChange={(e) => update({ proficiency: e.target.value })}>
              <option value="">Select…</option>
              {proficiencyLevels.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Certification
            <input value={entry.certification} onChange={(e) => update({ certification: e.target.value })} placeholder="IELTS, DELF, HSK…" />
          </label>
          <label>
            Score
            <input value={entry.score} onChange={(e) => update({ score: e.target.value })} />
          </label>
          <label>
            Expiration date
            <input type="date" value={entry.expiration_date} onChange={(e) => update({ expiration_date: e.target.value })} />
          </label>
        </>
      )}
    />
  );
}

export function ResearchSection({
  entries,
  onChange,
}: {
  entries: ResearchEntry[];
  onChange: (next: ResearchEntry[]) => void;
}) {
  return (
    <RepeatableList
      entries={entries}
      onChange={onChange}
      addLabel="Add research experience"
      emptyText="No research experience added yet."
      createEntry={() => ({
        id: newId(),
        project_title: "",
        institution: "",
        supervisor: "",
        start_date: "",
        end_date: "",
        research_question: "",
        outcome: "",
      })}
      renderSummary={(entry) => entry.project_title || "New research entry"}
      renderFields={(entry, update) => (
        <>
          <label className="wide">
            Project title
            <input value={entry.project_title} onChange={(e) => update({ project_title: e.target.value })} />
          </label>
          <label>
            Institution
            <input value={entry.institution} onChange={(e) => update({ institution: e.target.value })} />
          </label>
          <label>
            Supervisor
            <input value={entry.supervisor} onChange={(e) => update({ supervisor: e.target.value })} />
          </label>
          <label>
            Start date
            <input type="date" value={entry.start_date} onChange={(e) => update({ start_date: e.target.value })} />
          </label>
          <label>
            End date
            <input type="date" value={entry.end_date} onChange={(e) => update({ end_date: e.target.value })} />
          </label>
          <label className="wide">
            Research question
            <textarea rows={2} value={entry.research_question} onChange={(e) => update({ research_question: e.target.value })} />
          </label>
          <label className="wide">
            Outcome
            <textarea rows={2} value={entry.outcome} onChange={(e) => update({ outcome: e.target.value })} />
          </label>
        </>
      )}
    />
  );
}

export function HonorsSection({
  entries,
  onChange,
}: {
  entries: HonorEntry[];
  onChange: (next: HonorEntry[]) => void;
}) {
  return (
    <RepeatableList
      entries={entries}
      onChange={onChange}
      addLabel="Add honor or activity"
      emptyText="No honors or activities added yet."
      createEntry={() => ({ id: newId(), title: "", organisation: "", category: "", date: "", description: "" })}
      renderSummary={(entry) => entry.title || "New entry"}
      renderFields={(entry, update) => (
        <>
          <label>
            Title
            <input value={entry.title} onChange={(e) => update({ title: e.target.value })} />
          </label>
          <label>
            Organisation
            <input value={entry.organisation} onChange={(e) => update({ organisation: e.target.value })} />
          </label>
          <label>
            Category
            <input value={entry.category} onChange={(e) => update({ category: e.target.value })} placeholder="Award, leadership, volunteering…" />
          </label>
          <label>
            Date
            <input type="date" value={entry.date} onChange={(e) => update({ date: e.target.value })} />
          </label>
          <label className="wide">
            Description
            <textarea rows={2} value={entry.description} onChange={(e) => update({ description: e.target.value })} />
          </label>
        </>
      )}
    />
  );
}
