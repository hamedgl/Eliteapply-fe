import {
  Award,
  Archive as ArchiveIcon,
  CalendarX,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  Landmark,
  MessagesSquare,
  PencilLine,
  Search,
  Send,
  Sparkles,
  Star,
  Trophy,
  Undo2,
  Users,
  XCircle,
} from "lucide-react";
import { deadlineInfo, label, STAGE_TONE, type Application } from "../model";

const STAGE_ICON: Record<string, typeof Search> = {
  researching: Search,
  shortlisted: Star,
  preparing: PencilLine,
  waiting_for_documents: FileText,
  waiting_for_reference: Users,
  ready_to_submit: CheckCircle2,
  submitted: Send,
  under_review: Eye,
  interview: MessagesSquare,
  waitlisted: Clock,
  offered: Award,
  awarded: Trophy,
  rejected: XCircle,
  withdrawn: Undo2,
  expired: CalendarX,
  archived: ArchiveIcon,
};

/** Semantic stage pill: colour + icon + text, never colour alone. */
export function StagePill({ stage }: { stage: string }) {
  const tone = STAGE_TONE[stage] ?? "neutral";
  const Icon = STAGE_ICON[stage] ?? Search;
  return (
    <span className={`apps-stage-pill apps-tone-${tone}`}>
      <Icon aria-hidden="true" />
      {label(stage)}
    </span>
  );
}

const TYPE_ICON: Record<string, typeof GraduationCap> = {
  programme: GraduationCap,
  scholarship: Sparkles,
  fellowship: Landmark,
  grant: Award,
};

export function TypeTag({ type }: { type: string }) {
  const Icon = TYPE_ICON[type] ?? GraduationCap;
  return (
    <span className="apps-type-tag">
      <Icon aria-hidden="true" />
      {label(type)}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: string }) {
  return (
    <span className={`apps-priority apps-priority-${priority}`}>
      <span aria-hidden="true" className="apps-priority-dot" />
      {label(priority)}
    </span>
  );
}

export function DeadlineCell({ app }: { app: Application }) {
  const info = deadlineInfo(app.primary_deadline_at, app.stage);
  return (
    <div className={`apps-deadline apps-deadline-${info.urgency}`}>
      <span className="apps-deadline-primary">{info.primary}</span>
      {info.secondary ? (
        <span className="apps-deadline-secondary">{info.secondary}</span>
      ) : null}
    </div>
  );
}
