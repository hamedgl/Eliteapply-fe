import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { profileApi } from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
import { PageHeader } from "../../components/page/PageHeader";
import { OverflowMenu } from "../../components/actions/OverflowMenu";
import {
  CORE_SECTIONS,
  computeCompletion,
  draftToUpsert,
  readDraft,
  sectionLabels,
  sectionOrder,
  type ProfileDraft,
  type SectionKey,
} from "./model";
import { ProfileCompletionCard } from "./components/ProfileCompletionCard";
import { DeleteProfileDialog } from "./components/DeleteProfileDialog";
import { ImportProfileDialog } from "./components/ImportProfileDialog";
import { GoalsFields, InterestsFields } from "./components/ProfileSections";
import {
  EducationSection,
  HonorsSection,
  LanguagesSection,
  ResearchSection,
  TestsSection,
} from "./components/ProfileRepeatableSections";
import "../../styles/workspace.css";
import "./profile.css";
import {
  readAcademicProfileNavigationState,
  safeAppPath,
} from "../../lib/navigation";

const AUTOSAVE_DELAY = 1200;

export function AcademicProfilePage() {
  const qc = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const navigationState = readAcademicProfileNavigationState(location.state);
  const returnTo = safeAppPath(navigationState?.returnTo);
  const requestedSection = params.get("section");
  const [activeSection, setActiveSection] = useState<SectionKey>(() =>
    sectionOrder.includes(requestedSection as SectionKey)
      ? (requestedSection as SectionKey)
      : "goals",
  );
  const [showImport, setShowImport] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const dirtyRef = useRef(false);

  const query = useQuery({
    queryKey: queryKeys.profile,
    queryFn: profileApi.get,
  });

  const refreshRelated = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.profile }),
      qc.invalidateQueries({ queryKey: queryKeys.profileVersions }),
      qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
      qc.invalidateQueries({ queryKey: queryKeys.onboarding }),
    ]);
  };

  const save = useMutation({
    mutationFn: (nextDraft: ProfileDraft) =>
      profileApi.save(
        draftToUpsert(
          nextDraft,
          (query.data?.sections ?? {}) as Record<string, unknown>,
        ),
      ),
    onMutate: () => setSaveStatus("saving"),
    onSuccess: async (profile, savedDraft) => {
      qc.setQueryData(queryKeys.profile, profile);
      dirtyRef.current = false;
      setSaveStatus("saved");
      const refresh = refreshRelated();
      if (
        returnTo &&
        navigationState?.writingGenerationDraft &&
        profileRequirementComplete(savedDraft, navigationState.missingFields)
      )
        navigate(returnTo, {
          replace: true,
          state: {
            writingGenerationDraft: navigationState.writingGenerationDraft,
          },
        });
      await refresh;
    },
    onError: () => setSaveStatus("error"),
  });

  const remove = useMutation({
    mutationFn: profileApi.remove,
    onSuccess: async () => {
      setConfirmingDelete(false);
      qc.setQueryData(queryKeys.profile, null);
      setDraft(null);
      await refreshRelated();
    },
  });

  // Load the draft once profile data arrives; local edits after that don't get clobbered by refetches.
  useEffect(() => {
    if (draft === null && query.data !== undefined)
      setDraft(readDraft(query.data));
  }, [query.data, draft]);

  // Debounced autosave.
  useEffect(() => {
    if (!draft || !dirtyRef.current) return;
    const timer = setTimeout(() => save.mutate(draft), AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const updateDraft = (patch: Partial<ProfileDraft>) => {
    dirtyRef.current = true;
    setSaveStatus("idle");
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const completion = useMemo(
    () => (draft ? computeCompletion(draft) : {}),
    [draft],
  );

  if (query.isPending || !draft)
    return (
      <div
        className="apps-skeleton"
        aria-busy="true"
        aria-label="Loading academic profile"
      >
        <div className="skeleton apps-skeleton-toolbar" />
        <div className="apps-skeleton-table">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="skeleton apps-skeleton-row" key={i} />
          ))}
        </div>
      </div>
    );
  if (query.isError)
    return (
      <div className="apps-page-error" role="alert">
        <h1>We couldn’t load your academic profile.</h1>
        <button className="primary" onClick={() => query.refetch()}>
          Try again
        </button>
      </div>
    );

  const profile = query.data;

  return (
    <div className="page apps-page profile-page">
      <PageHeader
        title="Academic profile"
        description="Keep your academic background, goals and achievements in one reusable profile."
        meta={
          profile
            ? `Version ${profile.version} · ${
                saveStatus === "saving"
                  ? "Saving…"
                  : saveStatus === "error"
                    ? "Save failed"
                    : saveStatus === "saved"
                      ? "Saved"
                      : "Up to date"
              }`
            : "Not saved yet"
        }
        actions={
          <>
            <button type="button" onClick={() => setShowImport(true)}>
              Import profile
            </button>
            {profile ? (
              <OverflowMenu
                label="Profile actions"
                items={[
                  {
                    key: "delete",
                    label: "Delete profile",
                    icon: Trash2,
                    danger: true,
                    onClick: () => setConfirmingDelete(true),
                  },
                ]}
              />
            ) : null}
          </>
        }
      />

      {save.isError ? (
        <p className="form-error" role="alert">
          We couldn’t save your academic profile. Your entries are still here;
          retrying automatically.
        </p>
      ) : null}

      <div className="profile-layout">
        <nav className="profile-section-nav" aria-label="Profile sections">
          {sectionOrder.map((key) => (
            <button
              key={key}
              type="button"
              className={activeSection === key ? "selected" : ""}
              aria-current={activeSection === key}
              onClick={() => setActiveSection(key)}
            >
              {sectionLabels[key]}
              <span
                className={`profile-nav-dot${completion[key] ? " is-done" : ""}${!completion[key] && !CORE_SECTIONS.includes(key) ? " is-optional" : ""}`}
              >
                {completion[key]
                  ? "Complete"
                  : CORE_SECTIONS.includes(key)
                    ? "Incomplete"
                    : "Optional"}
              </span>
            </button>
          ))}
        </nav>

        <main className="apps-card profile-section-panel">
          <h2>{sectionLabels[activeSection]}</h2>
          {activeSection === "goals" ? (
            <GoalsFields
              applicantType={draft.applicant_type}
              studyLevel={draft.intended_study_level}
              countries={draft.target_countries}
              goals={draft.goals}
              onApplicantType={(value) =>
                updateDraft({ applicant_type: value })
              }
              onStudyLevel={(value) =>
                updateDraft({ intended_study_level: value })
              }
              onCountries={(value) => updateDraft({ target_countries: value })}
              onGoals={(patch) =>
                updateDraft({ goals: { ...draft.goals, ...patch } })
              }
            />
          ) : null}
          {activeSection === "education" ? (
            <EducationSection
              entries={draft.education}
              onChange={(value) => updateDraft({ education: value })}
            />
          ) : null}
          {activeSection === "academic_interests" ? (
            <InterestsFields
              interests={draft.interests}
              onChange={(patch) =>
                updateDraft({ interests: { ...draft.interests, ...patch } })
              }
            />
          ) : null}
          {activeSection === "research_experience" ? (
            <ResearchSection
              entries={draft.research}
              onChange={(value) => updateDraft({ research: value })}
            />
          ) : null}
          {activeSection === "honors_and_activities" ? (
            <HonorsSection
              entries={draft.honors}
              onChange={(value) => updateDraft({ honors: value })}
            />
          ) : null}
          {activeSection === "standardized_tests" ? (
            <TestsSection
              entries={draft.tests}
              onChange={(value) => updateDraft({ tests: value })}
            />
          ) : null}
          {activeSection === "languages" ? (
            <LanguagesSection
              entries={draft.languages}
              onChange={(value) => updateDraft({ languages: value })}
            />
          ) : null}
        </main>

        <ProfileCompletionCard
          completion={completion}
          updatedAt={profile?.updated_at ?? null}
        />
      </div>

      {showImport ? (
        <ImportProfileDialog
          currentVersion={profile?.version ?? null}
          onClose={() => setShowImport(false)}
        />
      ) : null}
      {confirmingDelete ? (
        <DeleteProfileDialog
          pending={remove.isPending}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => remove.mutate()}
        />
      ) : null}
    </div>
  );
}

function profileRequirementComplete(
  draft: ProfileDraft,
  missingFields: string[],
) {
  return missingFields.every((field) => {
    if (field === "institution")
      return draft.education.some((entry) => entry.institution.trim());
    if (field === "field_of_study")
      return (
        draft.education.some((entry) => entry.field_of_study.trim()) ||
        draft.goals.fields_of_study.some((field) => field.trim())
      );
    return false;
  });
}
