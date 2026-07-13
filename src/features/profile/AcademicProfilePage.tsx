import { useRef, useState } from "react";
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
    [message, setMessage] = useState(""),
    [selectedVersion, setSelectedVersion] = useState("");
  const importDialog = useRef<HTMLDialogElement>(null);
  const q = useQuery({ queryKey: queryKeys.profile, queryFn: profileApi.get });
  const versions = useQuery({
    queryKey: queryKeys.profileVersions,
    queryFn: profileApi.versions,
    enabled: q.data != null,
  });
  const version = useQuery({
    queryKey: [...queryKeys.profileVersions, selectedVersion],
    queryFn: () => profileApi.version(selectedVersion),
    enabled: Boolean(selectedVersion),
  });
  const refreshRelated = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.profile }),
      qc.invalidateQueries({ queryKey: queryKeys.profileVersions }),
      qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
      qc.invalidateQueries({ queryKey: queryKeys.onboarding }),
      qc.invalidateQueries({ queryKey: ["application-intelligence"] }),
    ]);
  };
  const save = useMutation({
    mutationFn: profileApi.save,
    onSuccess: (profile) => {
      qc.setQueryData(queryKeys.profile, profile);
      setMessage("Academic profile saved.");
      void qc.invalidateQueries({ queryKey: queryKeys.profileVersions });
    },
  });
  const restore = useMutation({
    mutationFn: (id: string) =>
      profileApi.restore(id, { expected_version: q.data?.version ?? null }),
    onSuccess: async () => {
      setMessage("The selected academic profile version was restored.");
      await refreshRelated();
    },
  });
  const importProfile = useMutation({
    mutationFn: profileApi.import,
    onSuccess: async () => {
      importDialog.current?.close();
      setMessage("Academic profile imported.");
      await refreshRelated();
    },
  });
  const remove = useMutation({
    mutationFn: profileApi.remove,
    onSuccess: async () => {
      setSelectedVersion("");
      setMessage("Academic profile deleted. Your account remains active.");
      qc.setQueryData(queryKeys.profile, null);
      await refreshRelated();
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
  const p = q.data ?? null;
  const completionEntries = Object.entries(p?.completion ?? {});
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    save.reset();
    const d = new FormData(e.currentTarget);
    const sections = { ...(p?.sections ?? {}) };
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
      provenance: p?.provenance,
      completion: p?.completion,
    });
  }
  return (
    <div className="page profile-page">
      <header className="page-heading">
        <div>
          <h1>Academic Profile</h1>
          <p>Your reusable source of truth for every application.</p>
        </div>
        <div className="profile-heading-actions">
          <span>{p ? `Version ${p.version}` : "Not saved yet"}</span>
          <button type="button" onClick={() => importDialog.current?.showModal()}>
            Import profile
          </button>
          {p ? <button className="danger" type="button" disabled={remove.isPending} onClick={() => {
            if (confirm("Delete your academic profile and its reusable application context? This cannot be undone.")) remove.mutate();
          }}>{remove.isPending ? "Deleting…" : "Delete profile"}</button> : null}
        </div>
      </header>
      <dialog ref={importDialog} className="dialog profile-import-dialog">
        <form method="dialog" className="settings-form" onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          importProfile.mutate({
            expected_version: p?.version ?? null,
            applicant_type: String(data.get("applicant_type")) || null,
            intended_study_level: String(data.get("intended_study_level")) || null,
            target_countries: String(data.get("target_countries")).split(",").map((item) => item.trim()).filter(Boolean),
            sections: { education: { summary: String(data.get("education_summary")) } },
            overwrite_existing: data.get("overwrite_existing") === "on",
          });
        }}>
          <h2>Import academic profile</h2>
          <p>Review the structured information before importing. Existing sections are preserved unless overwrite is selected.</p>
          <label>Applicant category to import<input name="applicant_type" /></label>
          <label>Study level to import<input name="intended_study_level" /></label>
          <label>Country list to import<input name="target_countries" placeholder="Portugal, United Kingdom" /></label>
          <label>Academic background to import<textarea name="education_summary" rows={5} /></label>
          <label className="check"><input name="overwrite_existing" type="checkbox" />Overwrite matching existing fields</label>
          {importProfile.isError ? <p className="form-error" role="alert">The profile could not be imported. Review the fields and try again.</p> : null}
          <div className="dialog-actions"><button type="button" onClick={() => importDialog.current?.close()}>Cancel</button><button className="primary" disabled={importProfile.isPending}>{importProfile.isPending ? "Importing…" : "Import profile"}</button></div>
        </form>
      </dialog>
      <form className="profile-layout" onSubmit={submit}>
        <main>
          <section>
            <h2>Direction</h2>
            <div className="form-grid">
              <label>
                Applicant type
                <input
                  name="applicant_type"
                  defaultValue={p?.applicant_type ?? ""}
                  placeholder="International student"
                />
              </label>
              <label>
                Intended study level
                <input
                  name="intended_study_level"
                  defaultValue={p?.intended_study_level ?? ""}
                  placeholder="Postgraduate"
                />
              </label>
              <label className="wide">
                Target countries
                <input
                  name="target_countries"
                  defaultValue={(p?.target_countries ?? []).join(", ")}
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
                  defaultValue={sectionSummary((p?.sections ?? {})[key])}
                  placeholder="Add a concise factual summary. Structured editors will evolve with the contract."
                />
              </label>
            ))}
          </section>
          {save.isError ? (
            <p className="form-error" role="alert">
              {save.error instanceof Error
                ? save.error.message
                : "We couldn’t save your academic profile. Your entries are still here; try again."}
            </p>
          ) : null}
          <button className="primary" type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save academic profile"}
          </button>
          <p role="status">{message}</p>
        </main>
        <aside>
          <GraduationCap />
          <h2>Completion</h2>
          <ul>
            {completionEntries.length ? (
              completionEntries.map(([key, value]) => (
                <li key={key}>
                  <span>{key.replaceAll("_", " ")}</span>
                  <strong>{value ? "Complete" : "Needs attention"}</strong>
                </li>
              ))
            ) : (
              <li>
                <span>Academic profile</span>
                <strong>Not started</strong>
              </li>
            )}
          </ul>
          <h2>
            <Clock3 /> Version history
          </h2>
          {p ? (
            versions.isError ? (
              <p className="muted">Version history could not be loaded.</p>
            ) : versions.isPending ? (
              <p className="muted" role="status">
                Loading version history…
              </p>
            ) : versions.data?.length ? (
              versions.data.map((x) => (
                <button className="version-row" type="button" key={x.id} onClick={() => setSelectedVersion(x.id)} aria-pressed={selectedVersion === x.id}>
                  <strong>Version {x.version_number}</strong>
                  <span>{formatVersionDate(x.created_at)}</span>
                  <small>{x.reason}</small>
                </button>
              ))
            ) : (
              <p className="muted">No earlier versions yet.</p>
            )
          ) : (
            <p className="muted">
              Your first version will appear here after you save.
            </p>
          )}
          {version.data ? <section className="version-detail"><h3>Version {version.data.version_number}</h3><p>{version.data.reason}</p><dl>{Object.entries(version.data.snapshot).slice(0, 8).map(([key, value]) => <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{summary(value)}</dd></div>)}</dl><button type="button" disabled={restore.isPending} onClick={() => {
            if (confirm(`Restore version ${version.data.version_number}? Your current profile remains in version history.`)) restore.mutate(version.data.id);
          }}>{restore.isPending ? "Restoring…" : "Restore this version"}</button></section> : null}
        </aside>
      </form>
    </div>
  );
}
function summary(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.join(", ");
  return value && typeof value === "object" ? "Structured information saved" : "Not provided";
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

function formatVersionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    date,
  );
}
