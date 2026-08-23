import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Trash2,
} from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { profileApi } from "../../lib/api/phase2";
import { queryKeys } from "../../lib/api/queryKeys";
import { PageHeader } from "../../components/page/PageHeader";
import { ProfilePageSkeleton } from "../../components/page/PageSkeleton";
import { OverflowMenu } from "../../components/actions/OverflowMenu";
import { StatusBadge } from "../../components/data-display/StatusBadge";
import {
  CORE_SECTIONS,
  computeCompletion,
  draftToUpsert,
  readDraft,
  sectionDescriptions,
  sectionLabels,
  sectionOrder,
  type ProfileDraft,
  type SectionKey,
} from "./model";
import { ProfileSectionNav, sectionIcons } from "./components/ProfileSectionNav";
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

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function AcademicProfilePage() {
  const qc = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const navigationState = readAcademicProfileNavigationState(location.state);
  const returnTo = safeAppPath(navigationState?.returnTo);
  const requestedSection = params.get("section");
  // The section lives in the URL so it survives a refresh and can be linked to.
  const activeSection: SectionKey = sectionOrder.includes(
    requestedSection as SectionKey,
  )
    ? (requestedSection as SectionKey)
    : "goals";
  const sectionLink = (key: SectionKey) => ({
    to: `${location.pathname}?section=${key}`,
    state: location.state,
  });
  const activeIndex = sectionOrder.indexOf(activeSection);
  const previousSection = sectionOrder[activeIndex - 1];
  const nextSection = sectionOrder[activeIndex + 1];

  const [showImport, setShowImport] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
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
      qc.invalidateQueries({ queryKey: queryKeys.recommendations }),
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
    return <ProfilePageSkeleton section={activeSection} />;
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
  const SectionIcon = sectionIcons[activeSection];
  const sectionDone = Boolean(completion[activeSection]);

  return (
    <div className="page apps-page">
      <PageHeader
        title="Academic profile"
        description="Keep your academic background, goals and achievements in one reusable profile."
        meta={
          profile ? (
            <span className="profile-header-meta">
              <span>Version {profile.version}</span>
              <SaveIndicator status={saveStatus} />
            </span>
          ) : (
            "Not saved yet"
          )
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
        <div className="profile-save-error" role="alert">
          <AlertTriangle aria-hidden="true" />
          <p>
            We couldn’t save your academic profile. Your entries are safe on this
            page — retry now, or keep editing and we’ll try again on your next
            change.
          </p>
          <button type="button" onClick={() => save.mutate(draft)}>
            Retry save
          </button>
        </div>
      ) : null}

      <div className="profile-layout">
        <ProfileSectionNav
          draft={draft}
          completion={completion}
          activeSection={activeSection}
          sectionLink={sectionLink}
          updatedAt={profile?.updated_at ?? null}
        />

        <section
          className="apps-card profile-section-panel"
          aria-labelledby="profile-section-title"
        >
          <header className="profile-section-head">
            <span className="profile-section-icon" aria-hidden="true">
              <SectionIcon aria-hidden="true" />
            </span>
            <div>
              <h2 id="profile-section-title">{sectionLabels[activeSection]}</h2>
              <p>{sectionDescriptions[activeSection]}</p>
            </div>
            <StatusBadge
              tone={sectionDone ? "green" : "grey"}
              icon={sectionDone ? Check : undefined}
            >
              {sectionDone
                ? "Complete"
                : CORE_SECTIONS.includes(activeSection)
                  ? "Needs details"
                  : "Optional"}
            </StatusBadge>
          </header>

          <div className="profile-section-body">
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
                onCountries={(value) =>
                  updateDraft({ target_countries: value })
                }
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
            {activeSection === "interests" ? (
              <InterestsFields
                interests={draft.interests}
                onChange={(patch) =>
                  updateDraft({ interests: { ...draft.interests, ...patch } })
                }
              />
            ) : null}
            {activeSection === "research" ? (
              <ResearchSection
                entries={draft.research}
                onChange={(value) => updateDraft({ research: value })}
              />
            ) : null}
            {activeSection === "honors" ? (
              <HonorsSection
                entries={draft.honors}
                onChange={(value) => updateDraft({ honors: value })}
              />
            ) : null}
            {activeSection === "tests" ? (
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
          </div>

          <footer className="profile-section-foot">
            <SaveIndicator status={saveStatus} live />
            <div className="profile-section-steps">
              {previousSection ? (
                <Link
                  className="profile-step-link"
                  {...sectionLink(previousSection)}
                  replace
                >
                  <ArrowLeft aria-hidden="true" />
                  {sectionLabels[previousSection]}
                </Link>
              ) : null}
              {nextSection ? (
                <Link
                  className="profile-step-link is-next"
                  {...sectionLink(nextSection)}
                  replace
                >
                  {sectionLabels[nextSection]}
                  <ArrowRight aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </footer>
        </section>
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

const SAVE_COPY: Record<SaveStatus, string> = {
  idle: "Up to date",
  saving: "Saving your changes…",
  saved: "All changes saved.",
  error: "Save failed",
};
const SAVE_COPY_COMPACT: Record<SaveStatus, string> = {
  idle: "Up to date",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
};

/**
 * Autosave state. It appears twice (header + panel footer), so only the footer
 * is a live region — otherwise every save is announced twice — and the header
 * uses the short wording so the same sentence isn't printed on screen twice.
 */
function SaveIndicator({ status, live }: { status: SaveStatus; live?: boolean }) {
  const copy = live ? SAVE_COPY : SAVE_COPY_COMPACT;
  return (
    <span
      className={`profile-save-state is-${status}`}
      role={live ? "status" : undefined}
      aria-hidden={live ? undefined : true}
    >
      {status === "saving" ? (
        <Loader2 aria-hidden="true" className="profile-save-spinner" />
      ) : status === "error" ? (
        <AlertTriangle aria-hidden="true" />
      ) : (
        <Check aria-hidden="true" />
      )}
      {copy[status]}
    </span>
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
