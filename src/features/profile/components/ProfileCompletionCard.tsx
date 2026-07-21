import { CheckCircle2, Circle, History } from "lucide-react";
import { ProgressBar } from "../../../components/data-display/ProgressBar";
import { formatDate } from "../../applications/model";
import { profileCompletionPercent, sectionLabels, sectionOrder, type SectionKey } from "../model";

export function ProfileCompletionCard({
  completion,
  updatedAt,
  onViewHistory,
}: {
  completion: Record<string, boolean>;
  updatedAt: string | null;
  onViewHistory: () => void;
}) {
  const percent = profileCompletionPercent(completion);
  const done = sectionOrder.filter((key) => completion[key]).length;
  return (
    <aside className="apps-card profile-completion-card">
      <h2>Profile health</h2>
      <ProgressBar percent={percent} label="Profile completion" />
      <p className="profile-completion-summary">
        {percent}% complete · {done} of {sectionOrder.length} sections ready
      </p>
      <ul className="profile-completion-list">
        {sectionOrder.map((key: SectionKey) => (
          <li key={key}>
            {completion[key] ? (
              <CheckCircle2 aria-hidden="true" className="profile-check-done" />
            ) : (
              <Circle aria-hidden="true" className="profile-check-todo" />
            )}
            <span>{sectionLabels[key]}</span>
          </li>
        ))}
      </ul>
      {updatedAt ? <p className="profile-last-saved">Last saved {formatDate(updatedAt)}</p> : null}
      <button type="button" className="apps-inline-link" onClick={onViewHistory}>
        <History aria-hidden="true" /> View version history
      </button>
    </aside>
  );
}
