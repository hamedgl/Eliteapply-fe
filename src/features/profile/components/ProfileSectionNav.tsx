import { Link } from "react-router-dom";
import {
  Award,
  Check,
  ClipboardCheck,
  Compass,
  GraduationCap,
  Languages,
  Lightbulb,
  Microscope,
  type LucideIcon,
} from "lucide-react";
import { ProgressBar } from "../../../components/data-display/ProgressBar";
import {
  CORE_SECTIONS,
  profileCompletionPercent,
  sectionCount,
  sectionLabels,
  sectionOrder,
  type ProfileDraft,
  type SectionKey,
} from "../model";

/**
 * Autosave writes several times an hour, so the shared `formatDate` (UTC,
 * date only) would keep reporting a stale-looking day. Local date + time.
 */
const savedAt = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export const sectionIcons: Record<SectionKey, LucideIcon> = {
  goals: Compass,
  education: GraduationCap,
  interests: Lightbulb,
  research: Microscope,
  honors: Award,
  tests: ClipboardCheck,
  languages: Languages,
};

/**
 * Left rail: overall completion plus the section switcher. The nav rows double
 * as the completion checklist — a separate checklist card would repeat the same
 * seven labels twice on one screen. Each section has its own URL, so these are
 * links rather than tabs.
 */
export function ProfileSectionNav({
  draft,
  completion,
  activeSection,
  sectionLink,
  updatedAt,
}: {
  draft: ProfileDraft;
  completion: Record<string, boolean>;
  activeSection: SectionKey;
  sectionLink: (key: SectionKey) => { to: string; state?: unknown };
  updatedAt: string | null;
}) {
  const percent = profileCompletionPercent(completion);
  const done = sectionOrder.filter((key) => completion[key]).length;

  return (
    <aside className="profile-rail">
      <div className="apps-card profile-health">
        <div className="profile-health-head">
          <h2>Profile health</h2>
          <span className="profile-health-ratio">
            <span aria-hidden="true">
              {done}
              <em> / {sectionOrder.length}</em>
            </span>
            <span className="visually-hidden">
              {done} of {sectionOrder.length} sections ready
            </span>
          </span>
        </div>
        <ProgressBar percent={percent} label="Profile completion" />
        {updatedAt ? (
          <p className="profile-last-saved">Last saved {savedAt(updatedAt)}</p>
        ) : null}
      </div>

      <nav className="profile-section-nav" aria-label="Profile sections">
        {sectionOrder.map((key) => {
          const Icon = sectionIcons[key];
          const isDone = Boolean(completion[key]);
          const isCore = CORE_SECTIONS.includes(key);
          const count = sectionCount(draft, key);
          const link = sectionLink(key);
          return (
            <Link
              key={key}
              to={link.to}
              state={link.state}
              replace
              className={`profile-nav-item${activeSection === key ? " is-active" : ""}`}
              aria-current={activeSection === key ? "page" : undefined}
            >
              <Icon aria-hidden="true" className="profile-nav-icon" />
              <span className="profile-nav-label">{sectionLabels[key]}</span>
              {count > 0 ? (
                <span className="profile-nav-count" aria-hidden="true">
                  {count}
                </span>
              ) : null}
              <span
                className={`profile-nav-state${isDone ? " is-done" : ""}${!isDone && !isCore ? " is-optional" : ""}`}
                aria-hidden="true"
              >
                {isDone ? <Check aria-hidden="true" /> : null}
              </span>
              <span className="visually-hidden">
                {isDone ? "Complete" : isCore ? "Incomplete" : "Optional"}
                {count > 0 ? `, ${count} ${count === 1 ? "entry" : "entries"}` : ""}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
