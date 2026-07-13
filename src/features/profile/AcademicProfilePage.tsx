import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, GraduationCap } from "lucide-react";
import { profileApi } from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
const known = [
  "education",
  "academic_interests",
  "honors_and_activities",
  "standardized_tests",
  "research_experience",
];
export function AcademicProfilePage() {
  const qc = useQueryClient(),
    [message, setMessage] = useState("");
  const q = useQuery({ queryKey: queryKeys.profile, queryFn: profileApi.get });
  const versions = useQuery({
    queryKey: queryKeys.profileVersions,
    queryFn: profileApi.versions,
  });
  const save = useMutation({
    mutationFn: profileApi.save,
    onSuccess: () => {
      setMessage("Academic profile saved.");
      void qc.invalidateQueries({ queryKey: queryKeys.profile });
      void qc.invalidateQueries({ queryKey: queryKeys.profileVersions });
    },
  });
  if (q.isPending) return <div className="page">Loading academic profile…</div>;
  if (q.isError)
    return (
      <div className="page error-state">
        <h1>Academic profile unavailable</h1>
        <button className="primary" onClick={() => q.refetch()}>
          Try again
        </button>
      </div>
    );
  const p = q.data;
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const sections = { ...(p.sections ?? {}) };
    for (const key of known) {
      const value = String(d.get(key) ?? "").trim();
      if (value)
        sections[key] = {
          ...(typeof sections[key] === "object"
            ? (sections[key] as object)
            : {}),
          summary: value,
        };
      else delete sections[key];
    }
    save.mutate({
      applicant_type: String(d.get("applicant_type")) || null,
      intended_study_level: String(d.get("intended_study_level")) || null,
      target_countries: String(d.get("target_countries"))
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      sections,
      provenance: p.provenance,
      completion: p.completion,
    });
  }
  return (
    <div className="page profile-page">
      <header className="page-heading">
        <div>
          <h1>Academic Profile</h1>
          <p>Your reusable source of truth for every application.</p>
        </div>
        <span>Version {p.version}</span>
      </header>
      <form className="profile-layout" onSubmit={submit}>
        <main>
          <section>
            <h2>Direction</h2>
            <div className="form-grid">
              <label>
                Applicant type
                <input
                  name="applicant_type"
                  defaultValue={p.applicant_type ?? ""}
                  placeholder="International student"
                />
              </label>
              <label>
                Intended study level
                <input
                  name="intended_study_level"
                  defaultValue={p.intended_study_level ?? ""}
                  placeholder="Postgraduate"
                />
              </label>
              <label className="wide">
                Target countries
                <input
                  name="target_countries"
                  defaultValue={(p.target_countries ?? []).join(", ")}
                  placeholder="Portugal, United Kingdom"
                />
              </label>
            </div>
          </section>
          <section>
            <h2>Academic evidence</h2>
            {known.map((key) => (
              <label key={key}>
                {key.replaceAll("_", " ")}
                <textarea
                  name={key}
                  rows={3}
                  defaultValue={sectionSummary((p.sections ?? {})[key])}
                  placeholder="Add a concise factual summary. Structured editors will evolve with the contract."
                />
              </label>
            ))}
          </section>
          <button className="primary" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save academic profile"}
          </button>
          <p role="status">{message}</p>
        </main>
        <aside>
          <GraduationCap />
          <h2>Completion</h2>
          <ul>
          {Object.entries(p.completion ?? {}).map(([key, value]) => (
              <li key={key}>
                <span>{key.replaceAll("_", " ")}</span>
                <strong>{value ? "Complete" : "Needs attention"}</strong>
              </li>
            ))}
          </ul>
          <h2>
            <Clock3 /> Version history
          </h2>
          {versions.data?.map((x) => (
            <div className="version-row" key={x.id}>
              <strong>Version {x.version_number}</strong>
              <span>
                {new Intl.DateTimeFormat(undefined, {
                  dateStyle: "medium",
                }).format(new Date(x.created_at))}
              </span>
              <small>{x.reason}</small>
            </div>
          ))}
          <p className="muted">
            History is read-only because the API has no restore endpoint.
          </p>
        </aside>
      </form>
    </div>
  );
}
function sectionSummary(value: unknown) {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    typeof (value as Record<string, unknown>).summary === "string"
  )
    return String((value as Record<string, unknown>).summary);
  return "";
}
