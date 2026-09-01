import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  Folder,
  GraduationCap,
  Link2,
  ListChecks,
  Lightbulb,
  Loader2,
  LockKeyhole,
  Pause,
  PenLine,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import closingPathIllustration from "../../assets/illustrations/application-path.webp";
import connectedWorkspaceIllustration from "../../assets/illustrations/connected-workspace.webp";
import comparisonWith from "../../assets/comparison-with.webp";
import comparisonWithout from "../../assets/comparison-without.webp";
import { usePageSeo } from "../../seo/usePageSeo";
import { MarketingHeader } from "../marketing/MarketingShell";
import { guideSteps, PercentageGauge } from "./landingShared";
import { TrackerPreview } from "./components/TrackerCapabilityPreview";
import { WritingCapabilityPreview } from "./components/WritingCapabilityPreview";
import { DocumentsCapabilityPreview } from "./components/DocumentsCapabilityPreview";
import { ReferencesCapabilityPreview } from "./components/ReferencesCapabilityPreview";
import { ReadinessCapabilityPreview } from "./components/ReadinessCapabilityPreview";
import {
  createInitialHeroTaskState,
  heroAiActions,
  type HeroAiActionId,
  heroWorkspaceApplications,
  type HeroWorkspaceTask,
  workflowProgress,
  workflowStageDetails,
} from "./landingData";




export function LandingPage() {
  usePageSeo("/");
  const [activeGuide, setActiveGuide] = useState(0);
  const [tourPaused, setTourPaused] = useState(false);
  const [tourHovered, setTourHovered] = useState(false);
  const [tourVisible, setTourVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const guidedRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduceMotion(media.matches);
    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      setTourVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setTourVisible(entry.isIntersecting),
      { threshold: 0.35 },
    );
    const section = guidedRef.current;
    if (section) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (tourPaused || tourHovered || !tourVisible || reduceMotion) return;
    const timer = window.setTimeout(
      () => setActiveGuide((current) => (current + 1) % guideSteps.length),
      4800,
    );
    return () => window.clearTimeout(timer);
  }, [activeGuide, reduceMotion, tourHovered, tourPaused, tourVisible]);

  const selectGuide = (index: number) => {
    setActiveGuide(index);
  };

  return (
    <main className="marketing phase-one-marketing">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <MarketingHeader />

      <section className="phase-one-hero" id="main-content" tabIndex={-1}>
        <div className="phase-one-hero-copy">
          <p className="hero-category">
            AI-Powered Scholarship Application Platform
          </p>
          <h1>
            Plan, write and submit stronger scholarship applications with AI.
          </h1>
          <p>
            Turn every opportunity into a clear application plan with an{" "}
            <strong className="hero-ai-term">
              AI-powered scholarship writing assistant
            </strong>
            , intelligent evidence matching, and{" "}
            <strong className="hero-ai-term">
              AI feedback before submission
            </strong>
            —all while keeping your experience and voice authentic.
          </p>
          <div className="phase-one-actions">
            <Link className="landing-button" to="/register" reloadDocument>
              Start with AI — Free <ArrowRight aria-hidden="true" />
            </Link>
            <a className="landing-button secondary" href="#how-it-works">
              See how it works
            </a>
          </div>
          <p className="phase-one-assurance">
            <span>AI-guided, evidence-based and always under your control</span>
            <span>No credit card required</span>
          </p>
        </div>
        <HeroFocusPreview />
      </section>

      <CredibilityStrip />

      <ProblemOutcome />

      <section
        className="capabilities"
        id="product"
        aria-labelledby="capabilities-title"
      >
        <header className="phase-one-section-heading capability-intro">
          <div>
            <p className="section-context">One connected workspace</p>
            <h2 id="capabilities-title">
              The structure behind a stronger application process.
            </h2>
            <p>
              Each part of your application stays connected, so deadlines,
              evidence, writing and people do not become separate systems to
              maintain.
            </p>
          </div>
          <img
            src={connectedWorkspaceIllustration}
            alt=""
            width="1080"
            height="1080"
            loading="lazy"
            decoding="async"
            aria-hidden="true"
          />
        </header>
        <CapabilitySection
          id="application-tracker"
          label="Scholarship application tracker"
          title="See every application, deadline and next action in one place."
          description="Track status, deadline, priority, progress, missing requirements and recent activity—then act on the next responsible step."
          points={[
            "Status, priority and deadline context",
            "Progress and missing requirements",
            "Last activity and next responsible action",
          ]}
          preview="tracker"
          route="/features/scholarship-application-tracker"
        />
        <CapabilitySection
          id="writing-workspace"
          label="Scholarship personal statement workspace"
          title="Build each statement from evidence—not from a blank page."
          description="Break down the prompt, connect relevant evidence and keep draft versions, notes, documents and word-count guidance in view while your authentic voice stays in control."
          points={[
            "Prompt and requirement breakdown",
            "Evidence mapping and draft versions",
            "Clarity review without replacing your voice",
          ]}
          preview="writing"
          route="/features/personal-statement-workspace"
          reverse
        />
        <CapabilitySection
          id="documents-evidence"
          label="Scholarship document organiser"
          title="Keep transcripts, certificates and supporting evidence connected to the right application."
          description="Organise documents once, reuse them without duplicate uploads and see which requirements are covered, missing or waiting for a newer version."
          points={[
            "Requirement-to-document mapping",
            "Missing-item and version visibility",
            "Controlled access, download and deletion",
          ]}
          preview="documents"
          route="/features/document-organiser"
        />
        <CapabilitySection
          id="reference-tracking"
          label="Scholarship reference tracker"
          title="Track reference requirements before they become last-minute emergencies."
          description="Keep the referee, requirement, request status, due date, follow-up state and supporting context visible in one place."
          points={[
            "Request and confirmation status",
            "Due dates and follow-up state",
            "Supporting context for each referee",
          ]}
          preview="references"
          route="/features/reference-tracking"
          reverse
        />
        <CapabilitySection
          id="readiness-review"
          label="Scholarship application checklist"
          title="Know what is ready, what is missing and what deserves one final review."
          description="Review requirements, evidence, writing, references, declarations and deadline context together before you make the final submission decision."
          points={[
            "Coverage across every requirement",
            "Explicit missing and follow-up items",
            "A final checklist—not a success prediction",
          ]}
          preview="readiness"
          route="/features/submission-readiness"
        />
      </section>

      <section ref={guidedRef} className="phase-one-workflow" id="how-it-works">
        <header className="phase-one-section-heading workflow-heading">
          <p className="section-context">How it works</p>
          <h2>
            From opportunity to final check, keep the whole application
            connected.
          </h2>
          <p>
            Four concrete stages turn a complex application into a plan you can
            understand, review and own.
          </p>
        </header>
        <GuidedWorkflowBoard
          activeGuide={activeGuide}
          animated={!reduceMotion}
          isRunning={!tourPaused && !tourHovered && tourVisible && !reduceMotion}
          manual={reduceMotion}
          paused={tourPaused}
          onSelect={selectGuide}
          onToggle={() => setTourPaused((paused) => !paused)}
          onHoverStart={() => setTourHovered(true)}
          onHoverEnd={() => setTourHovered(false)}
        />
      </section>

      <StudentUseCases />

      <TrustAndComparison />

      <ProductNote />

      <FaqSection />

      <section className="phase-one-closing">
        <div className="closing-copy">
          <h2>Give every application a clearer path to submission.</h2>
          <p>
            Start with one scholarship. Organise the requirements, prepare the
            evidence and move forward with confidence.
          </p>
          <div className="phase-one-actions inverse-actions">
            <Link className="landing-button" to="/register" reloadDocument>
              Start free <ArrowRight aria-hidden="true" />
            </Link>
            <a className="landing-button secondary" href="#sample-workspace">
              Explore the sample workspace
            </a>
          </div>
          <p className="closing-reassurance">
            <ShieldCheck aria-hidden="true" /> No credit card required
          </p>
        </div>
        <div className="closing-route" aria-hidden="true">
          <img
            src={closingPathIllustration}
            alt=""
            width="1080"
            height="1080"
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>

      <PhaseOneFooter />
    </main>
  );
}


function HeroFocusPreview() {
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>(
    heroWorkspaceApplications[0].id,
  );
  const [taskState, setTaskState] = useState(createInitialHeroTaskState);
  const [actionPanelOpen, setActionPanelOpen] = useState(false);
  const [aiActionId, setAiActionId] = useState<HeroAiActionId>("review");
  const [aiPending, setAiPending] = useState(false);
  const aiTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(aiTimeoutRef.current), []);

  const activeAiAction =
    heroAiActions.find((action) => action.id === aiActionId) ??
    heroAiActions[heroAiActions.length - 1];

  const currentApplication =
    heroWorkspaceApplications.find(
      (application) => application.id === selectedApplicationId,
    ) ?? heroWorkspaceApplications[0];
  const initialCompleted = currentApplication.tasks.filter(
    (task) => task.done,
  ).length;
  const completedTasks = currentApplication.tasks.filter(
    (task) => taskState[currentApplication.id]?.[task.id],
  ).length;
  const completionDifference = completedTasks - initialCompleted;
  const readiness = Math.max(
    0,
    Math.min(100, currentApplication.readiness + completionDifference * 8),
  );
  const requirementsCovered = Math.max(
    0,
    currentApplication.requirementsCovered + completionDifference,
  );
  const attentionCount = currentApplication.tasks.length - completedTasks;

  const handleTaskChange = (task: HeroWorkspaceTask, checked: boolean) => {
    setTaskState((previous) => ({
      ...previous,
      [currentApplication.id]: {
        ...previous[currentApplication.id],
        [task.id]: checked,
      },
    }));
  };

  const handleApplicationChange = (applicationId: string) => {
    setSelectedApplicationId(applicationId);
    setActionPanelOpen(false);
  };

  const resetSample = () => {
    setTaskState(createInitialHeroTaskState());
    setActionPanelOpen(false);
    window.clearTimeout(aiTimeoutRef.current);
    setAiPending(false);
    setAiActionId("review");
  };

  const handleAiAction = (id: HeroAiActionId) => {
    window.clearTimeout(aiTimeoutRef.current);
    setAiPending(true);
    aiTimeoutRef.current = window.setTimeout(() => {
      setAiActionId(id);
      setAiPending(false);
    }, 650);
  };

  return (
    <section
      className="hero-focus-preview"
      id="sample-workspace"
      aria-label="Interactive EliteApply sample workspace"
    >
      <header>
        <div>
          <span className="preview-mark" aria-hidden="true">
            E
          </span>
          <div>
            <small>Current application</small>
            <strong>{currentApplication.programme}</strong>
          </div>
        </div>
        <span className="preview-state">{currentApplication.status}</span>
      </header>
      <div className="hero-sample-toolbar">
        <label>
          <span>Try a sample application</span>
          <select
            aria-label="Sample application"
            value={selectedApplicationId}
            onChange={(event) => handleApplicationChange(event.target.value)}
          >
            {heroWorkspaceApplications.map((application) => (
              <option key={application.id} value={application.id}>
                {application.programme}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={resetSample}>
          <RotateCcw aria-hidden="true" /> Reset
        </button>
      </div>
      <div className="hero-ai-panel">
        <div className="hero-ai-panel-heading">
          <span>AI assistant</span>
          <span
            className={`hero-ai-status${aiPending ? " pending" : ""}`}
            role="status"
          >
            {aiPending ? (
              <Loader2 className="spin-icon" aria-hidden="true" />
            ) : (
              <CheckCircle2 aria-hidden="true" />
            )}
            {aiPending ? "Working…" : activeAiAction.status}
          </span>
        </div>
        <div className="hero-ai-actions">
          {heroAiActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className={action.id === aiActionId ? "active" : ""}
              aria-pressed={action.id === aiActionId}
              onClick={() => handleAiAction(action.id)}
            >
              <action.Icon aria-hidden="true" />
              {action.label}
            </button>
          ))}
        </div>
      </div>
      <div className="hero-moments">
        <button
          className="hero-next-action"
          type="button"
          aria-expanded={actionPanelOpen}
          aria-controls="hero-action-panel"
          onClick={() => setActionPanelOpen((open) => !open)}
        >
          <ClipboardCheck aria-hidden="true" />
          <div>
            <small>Next responsible action</small>
            <strong>{currentApplication.nextAction}</strong>
            <span>{currentApplication.actionDetail}</span>
          </div>
          <span className="hero-action-cta">
            <span>{actionPanelOpen ? "Close" : "Open task list"}</span>
            <ChevronRight aria-hidden="true" />
          </span>
        </button>
        <article>
          <CheckCircle2 aria-hidden="true" />
          <div>
            <small>Application readiness</small>
            <strong aria-live="polite">{readiness}%</strong>
            <span
              className="preview-progress"
              role="progressbar"
              aria-label={`${readiness}% ready`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={readiness}
            >
              <i style={{ width: `${readiness}%` }} />
            </span>
          </div>
        </article>
        <article>
          <CalendarDays aria-hidden="true" />
          <div>
            <small>Next deadline</small>
            <strong>{currentApplication.deadlineDays} days</strong>
            <span>{currentApplication.deadlineDate}</span>
          </div>
        </article>
        {actionPanelOpen ? (
          <div className="hero-action-panel" id="hero-action-panel">
            <header>
              <div>
                <strong>Priority checklist</strong>
                <span>Check an item to see readiness update.</span>
              </div>
              <span>{attentionCount} remaining</span>
            </header>
            <div className="hero-task-list">
              {currentApplication.tasks.map((task) => {
                const checked = Boolean(
                  taskState[currentApplication.id]?.[task.id],
                );
                return (
                  <label className={checked ? "complete" : ""} key={task.id}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        handleTaskChange(task, event.target.checked)
                      }
                    />
                    <span>
                      <strong>{task.label}</strong>
                      <small>{task.detail}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      <footer aria-live="polite">
        <span>
          <Check aria-hidden="true" /> {requirementsCovered} requirements
          covered
        </span>
        <span>
          {attentionCount} {attentionCount === 1 ? "item needs" : "items need"}{" "}
          attention
        </span>
      </footer>
    </section>
  );
}


function CredibilityStrip() {
  const points = [
    [GraduationCap, "Built for students managing multiple applications"],
    [LockKeyhole, "Private by default"],
    [ListChecks, "Structured around real application requirements"],
    [Folder, "Designed for documents, evidence and references"],
  ] as const;
  return (
    <section
      className="credibility-strip"
      aria-label="EliteApply product principles"
    >
      {points.map(([Icon, text]) => (
        <div key={text}>
          <Icon aria-hidden="true" />
          <span>{text}</span>
        </div>
      ))}
    </section>
  );
}


const withoutItems = [
  "Deadlines spread across tabs, emails and calendars",
  "Repeated requirements copied into notes",
  "Drafts with unclear versions",
  "Evidence and documents stored in different places",
  "Reference requests followed up manually",
  "Duplicate effort retyping details for every application",
  "Final checks performed under pressure",
] as const;

const withItems = [
  "AI turns scholarship requirements into actionable tasks",
  "AI-powered writing assistant strengthens every statement",
  "AI matches your evidence to each application requirement",
  "Drafts, documents and references stay intelligently connected",
  "AI flags missing information and unsupported claims",
  "AI feedback improves your application before submission",
] as const;

const withMediaTags = [
  "Write with AI",
  "Match evidence",
  "Run AI review",
] as const;


function ProblemOutcome() {
  return (
    <section className="problem-outcome" aria-labelledby="problem-title">
      <header className="problem-heading">
        <p className="section-context">From scattered to AI-structured</p>
        <h2 id="problem-title">
          Turn scholarship application <span>chaos</span> into an{" "}
          <strong>AI-guided</strong> submission plan.
        </h2>
        <p>
          EliteApply combines intelligent planning, AI writing support and
          pre-submission feedback—so you always know what to do next.
        </p>
      </header>
      <div className="comparison-flow">
        <article className="comparison-column without-column">
          <header>
            <span className="comparison-status-icon" aria-hidden="true">
              <X />
            </span>
            <div>
              <h3>Without EliteApply</h3>
              <p>Disconnected. Manual. Stressful.</p>
            </div>
          </header>
          <img
            className="comparison-media"
            src={comparisonWithout}
            alt="Scholarship deadlines, emails, requirements and document drafts scattered across tabs and notes."
            width="700"
            height="474"
            loading="lazy"
            decoding="async"
          />
          <ul>
            {withoutItems.map((item) => (
              <li key={item}>
                <span className="comparison-list-icon" aria-hidden="true">
                  <X />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </article>
        <div className="comparison-arrow" aria-hidden="true">
          <ArrowRight />
        </div>
        <article className="comparison-column with-column">
          <header>
            <span className="comparison-status-icon" aria-hidden="true">
              <Check />
            </span>
            <div>
              <h3>With EliteApply AI</h3>
              <p>Guided. Connected. Submission-ready.</p>
            </div>
          </header>
          <img
            className="comparison-media"
            src={comparisonWith}
            alt="EliteApply timeline, actionable tasks, centralized documents and progress tracking in one structured workspace."
            width="700"
            height="474"
            loading="lazy"
            decoding="async"
          />
          <div className="comparison-media-tags" aria-hidden="true">
            {withMediaTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <ul>
            {withItems.map((item) => (
              <li key={item}>
                <span className="comparison-list-icon" aria-hidden="true">
                  <Check />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}


type CapabilityPreview =
  | "tracker"
  | "writing"
  | "documents"
  | "references"
  | "readiness";


function CapabilitySection({
  id,
  label,
  title,
  description,
  points,
  preview,
  route,
  reverse = false,
}: {
  id: string;
  label: string;
  title: string;
  description: string;
  points: readonly string[];
  preview: CapabilityPreview;
  route: string;
  reverse?: boolean;
}) {
  return (
    <article
      className={`capability-section ${reverse ? "reverse" : ""}`}
      id={id}
    >
      <div className="capability-copy">
        <p className="section-context">{label}</p>
        <h3>{title}</h3>
        <p>{description}</p>
        <ul>
          {points.map((point) => (
            <li key={point}>
              <Check aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
        <Link className="capability-link" to={route}>
          Explore this capability <ArrowRight aria-hidden="true" />
        </Link>
      </div>
      <CapabilityProductPreview kind={preview} />
    </article>
  );
}


function CapabilityProductPreview({ kind }: { kind: CapabilityPreview }) {
  if (kind === "tracker") return <TrackerPreview />;
  if (kind === "writing") return <WritingCapabilityPreview />;
  if (kind === "documents") return <DocumentsCapabilityPreview />;
  if (kind === "references") return <ReferencesCapabilityPreview />;
  return <ReadinessCapabilityPreview />;
}


function StudentUseCases() {
  const cases = [
    [
      "Undergraduate scholarships",
      "Keep first major applications structured while building reusable evidence.",
    ],
    [
      "Master's scholarships",
      "Coordinate programme requirements, funding essays and supporting documents.",
    ],
    [
      "PhD funding",
      "Connect research proposals, supervisor context, evidence and references.",
    ],
    [
      "International scholarships",
      "Keep country-specific documents, deadlines and application details visible.",
    ],
    [
      "Fellowships and competitive programmes",
      "Manage multi-stage requirements without splitting the story across tools.",
    ],
  ] as const;
  const applicationAreas = [
    {
      label: "Eligibility",
      detail: "Requirements confirmed",
      status: "Complete",
      Icon: ClipboardCheck,
    },
    {
      label: "Writing",
      detail: "Core drafts prepared",
      status: "Complete",
      Icon: PenLine,
    },
    {
      label: "Evidence",
      detail: "2 items to connect",
      status: "In progress",
      Icon: Link2,
    },
    {
      label: "Documents",
      detail: "1 document missing",
      status: "In progress",
      Icon: Folder,
    },
    {
      label: "References",
      detail: "Requests being tracked",
      status: "In progress",
      Icon: Users,
    },
    {
      label: "Final checks",
      detail: "Available when ready",
      status: "Upcoming",
      Icon: ListChecks,
    },
  ] as const;
  return (
    <section
      className="student-use-cases"
      id="for-students"
      aria-labelledby="students-title"
    >
      <header className="phase-one-section-heading">
        <p className="section-context">For students</p>
        <h2 id="students-title">
          Built for serious applications at every stage.
        </h2>
        <p>
          One flexible structure for different application types—without
          pretending every process is identical.
        </p>
      </header>
      <div className="use-case-layout">
        <ol>
          {cases.map(([title, copy], index) => (
            <li key={title}>
              <span>{index + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
              <ChevronRight aria-hidden="true" />
            </li>
          ))}
        </ol>
        <div
          className="application-map"
          aria-label="Example connected application workspace"
        >
          <div className="map-root">
            <span className="map-root-icon">
              <GraduationCap aria-hidden="true" />
            </span>
            <span>
              <small>Application workspace</small>
              <strong>One connected application</strong>
            </span>
            <span className="map-summary">5 of 6 areas underway</span>
          </div>
          <div className="map-branches">
            {applicationAreas.map(({ label, detail, status, Icon }) => (
              <article
                key={label}
                className={`map-area map-area-${status.toLowerCase().replace(" ", "-")}`}
              >
                <span className="map-area-icon">
                  <Icon aria-hidden="true" />
                </span>
                <span className="map-area-copy">
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
                <span className="map-status">
                  {status === "Complete" ? (
                    <CheckCircle2 aria-hidden="true" />
                  ) : status === "In progress" ? (
                    <Clock3 aria-hidden="true" />
                  ) : (
                    <ChevronRight aria-hidden="true" />
                  )}
                  {status}
                </span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


const comparisonRows = [
  [
    ListChecks,
    "Requirement structure",
    "Built for",
    "Partial",
    "Partial",
    "Partial",
  ],
  [
    CalendarDays,
    "Deadline tracking",
    "Built for",
    "Partial",
    "Built for",
    "Partial",
  ],
  [
    PenLine,
    "Draft and evidence connection",
    "Built for",
    "Partial",
    "Partial",
    "Partial",
  ],
  [
    Link2,
    "Reference tracking",
    "Built for",
    "Partial",
    "Partial",
    "Partial",
  ],
  [
    ShieldCheck,
    "Readiness review",
    "Built for",
    "Not purpose-built",
    "Partial",
    "Not purpose-built",
  ],
  [
    Folder,
    "Reusable documents",
    "Built for",
    "Partial",
    "Partial",
    "Built for",
  ],
  [
    Sparkles,
    "Guided next action",
    "Built for",
    "Not purpose-built",
    "Partial",
    "Not purpose-built",
  ],
] as const;


function TrustAndComparison() {
  const trust = [
    [
      LockKeyhole,
      "Private account workspace",
      "Your application workspace requires your account session.",
    ],
    [
      ShieldCheck,
      "Memory-only active session",
      "Access tokens are kept in browser memory, not persistent browser storage.",
    ],
    [
      Trash2,
      "Document and account controls",
      "Download or delete documents, export your data and request account deletion.",
    ],
    [
      PenLine,
      "Transparent assistance",
      "Writing guidance supports your process; it does not replace your voice or promise an outcome.",
    ],
  ] as const;
  return (
    <section className="trust-comparison" id="privacy">
      <div className="trust-panel">
        <Link
          className="marketing-brand inverse-brand trust-panel-brand"
          to="/"
        >
          EliteApply
        </Link>
        <p className="section-context">Privacy and control</p>
        <h2>
          Your applications contain personal work. Treating them carefully is
          part of the product.
        </h2>
        <div className="trust-list">
          {trust.map(([Icon, title, copy]) => (
            <article key={title}>
              <span className="trust-icon" aria-hidden="true">
                <Icon aria-hidden="true" />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
        <nav aria-label="Trust and legal information">
          <Link to="/security">Security approach</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/accessibility">Accessibility</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </div>
      <div className="tool-comparison">
        <div className="tool-comparison-top">
          <header>
            <p className="section-context">Purpose-built structure</p>
            <h2>
              Why use a purpose-built application workspace instead of a
              spreadsheet?
            </h2>
            <p>
              EliteApply gives you structure, AI guidance, deadlines, and
              review tools—so nothing important falls through the cracks.
            </p>
          </header>
          <aside className="tool-comparison-card">
            <span className="marketing-brand tool-comparison-card-brand">
              EliteApply
            </span>
            <p>
              A purpose-built workspace for scholarship applications—designed
              to help you submit your strongest work.
            </p>
            <ul className="tool-comparison-card-pills">
              <li>
                <Sparkles aria-hidden="true" /> AI guidance
              </li>
              <li>
                <CalendarDays aria-hidden="true" /> Deadline tracking
              </li>
              <li>
                <Users aria-hidden="true" /> Readiness review
              </li>
            </ul>
          </aside>
        </div>
        <div
          className="comparison-table-wrap"
          tabIndex={0}
          aria-label="Scrollable comparison table"
        >
          <table>
            <caption className="sr-only">
              Comparison of EliteApply with general productivity tools
            </caption>
            <thead>
              <tr>
                <th>Capability</th>
                <th>EliteApply</th>
                <th>Spreadsheet</th>
                <th>Task manager</th>
                <th>Notes app</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([RowIcon, label, ...fits]) => (
                <tr key={label}>
                  <th scope="row">
                    <span className="tool-comparison-row-label">
                      <span
                        className="tool-comparison-row-icon"
                        aria-hidden="true"
                      >
                        <RowIcon aria-hidden="true" />
                      </span>
                      {label}
                    </span>
                  </th>
                  {fits.map((cell, index) => (
                    <td key={`${label}-${cell}-${index}`}>
                      <span data-fit={cell}>
                        {cell === "Built for" && <Check aria-hidden="true" />}
                        {cell}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="comparison-table-footnote">
          <ShieldCheck aria-hidden="true" />
          Your data is private and never used to train models.
        </p>
      </div>
    </section>
  );
}


function ProductNote() {
  return (
    <section
      className="product-note"
      id="pricing"
      aria-labelledby="product-note-title"
    >
      <div>
        <p className="section-context">A note from the product</p>
        <h2 id="product-note-title">
          Built around the real structure of applications.
        </h2>
        <p>
          EliteApply connects requirements, evidence, written materials,
          documents, references and deadlines so you can present your best work.
        </p>
        <p>
          It does not promise outcomes, influence selection decisions or replace
          your voice. You remain the author of your application.
        </p>
      </div>
      <aside>
        <span>Pricing</span>
        <strong>Free to start while EliteApply is in early access.</strong>
        <p>
          Paid plans are not currently available. No credit card is required.
        </p>
        <Link className="landing-button" to="/register" reloadDocument>
          Start free <ArrowRight aria-hidden="true" />
        </Link>
      </aside>
    </section>
  );
}


const faqs = [
  [
    "What is EliteApply?",
    "EliteApply is a scholarship application workspace for tracking opportunities, requirements, deadlines, writing, evidence, documents and references in one connected place.",
  ],
  [
    "Is EliteApply a scholarship search engine?",
    "No. EliteApply helps you organise opportunities you are considering or applying for. It is not currently a scholarship search engine.",
  ],
  [
    "Can I track multiple applications?",
    "Yes. Each application can keep its own deadline, status, requirements, tasks, documents and next actions.",
  ],
  [
    "Does EliteApply write my personal statement?",
    "No. EliteApply can help you structure ideas, connect evidence and review clarity, but you stay responsible for the content and your authentic voice.",
  ],
  [
    "Can I organise references and supporting documents?",
    "Yes. You can organise academic documents, connect them to applications and track reference requests and their status.",
  ],
  [
    "Is my application content private?",
    "Your workspace requires an account session, and access tokens are kept in browser memory. Review the Privacy Policy for the approved legal details before relying on any privacy claim.",
  ],
  [
    "Can I start for free?",
    "Yes. EliteApply is free to start during early access and does not currently offer paid plans.",
  ],
  [
    "Can international students use EliteApply?",
    "Yes. The workspace is designed for applicants managing scholarships, programmes, fellowships and grants across countries.",
  ],
  [
    "Does EliteApply guarantee a scholarship?",
    "No. EliteApply organises your process and helps surface missing work. Scholarship decisions remain entirely with the provider.",
  ],
  [
    "Can I export or delete my data?",
    "Yes. Account settings include data export and account deletion controls, and document controls include download and deletion.",
  ],
] as const;


function FaqSection() {
  return (
    <section className="faq-section" id="faq" aria-labelledby="faq-title">
      <header className="phase-one-section-heading">
        <p className="section-context">Student questions</p>
        <h2 id="faq-title">Questions students ask before starting.</h2>
        <p>Direct answers, without promises the product cannot make.</p>
      </header>
      <div className="faq-list">
        {faqs.map(([question, answer], index) => (
          <details key={question} open={index === 0}>
            <summary>
              {question}
              <ChevronDown aria-hidden="true" />
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}


function PhaseOneFooter() {
  return (
    <footer className="phase-one-footer">
      <div>
        <Link className="marketing-brand inverse-brand" to="/">
          EliteApply
        </Link>
        <p>A calm workspace for scholarship applications.</p>
      </div>
      <nav aria-label="Product">
        <strong>Product</strong>
        <Link to="/features/scholarship-application-tracker">
          Application tracker
        </Link>
        <Link to="/features/personal-statement-workspace">
          Writing workspace
        </Link>
        <Link to="/features/document-organiser">Documents and evidence</Link>
        <Link to="/features/reference-tracking">References</Link>
      </nav>
      <nav aria-label="Explore">
        <strong>Explore</strong>
        <Link to="/how-it-works">How it works</Link>
        <Link to="/for-students">For students</Link>
        <Link to="/pricing">Pricing</Link>
        <Link to="/resources">Resources</Link>
      </nav>
      <nav aria-label="Company and legal">
        <strong>Company</strong>
        <Link to="/about">About</Link>
        <Link to="/security">Security</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/accessibility">Accessibility</Link>
        <Link to="/contact">Contact</Link>
      </nav>
      <div className="footer-bottom">
        <span>© 2026 Executive Precision Era · EliteApply</span>
        <Link to="/login" reloadDocument>
          Sign in
        </Link>
      </div>
    </footer>
  );
}


function WorkflowStageIcon({ index }: { index: number }) {
  return index === 0 ? (
    <Search aria-hidden="true" />
  ) : index === 1 ? (
    <ClipboardCheck aria-hidden="true" />
  ) : index === 2 ? (
    <FileText aria-hidden="true" />
  ) : (
    <CheckCircle2 aria-hidden="true" />
  );
}


function GuidedWorkflowBoard({
  activeGuide,
  animated,
  isRunning,
  manual,
  paused,
  onSelect,
  onToggle,
  onHoverStart,
  onHoverEnd,
}: {
  activeGuide: number;
  animated: boolean;
  isRunning: boolean;
  manual: boolean;
  paused: boolean;
  onSelect: (index: number) => void;
  onToggle: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}) {
  const stage = workflowStageDetails[activeGuide];
  const baselineProgress = workflowProgress[activeGuide];
  const railRef = useRef<HTMLOListElement>(null);
  const [taskOverrides, setTaskOverrides] = useState<Record<string, boolean>>(
    {},
  );

  const stageTasks = stage.tasks.map((task) => {
    const key = `${activeGuide}:${task.title}`;
    const done = key in taskOverrides ? taskOverrides[key] : task.done;
    return { ...task, done, key };
  });
  const completedCount = stageTasks.filter((task) => task.done).length;
  const totalCount = stageTasks.length;
  const completionPct = Math.round((completedCount / totalCount) * 100);
  const progress = baselineProgress.map((value, index) =>
    index === activeGuide ? completionPct : value,
  );
  const overallProgress = Math.round(
    progress.reduce((sum, value) => sum + value, 0) / progress.length,
  );

  function toggleTask(taskKey: string, currentDone: boolean) {
    setTaskOverrides((prev) => ({ ...prev, [taskKey]: !currentDone }));
  }

  function resetDemo() {
    setTaskOverrides({});
    onSelect(0);
  }

  function handleRailKeyDown(event: React.KeyboardEvent<HTMLOListElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = (activeGuide + delta + guideSteps.length) % guideSteps.length;
    onSelect(next);
    railRef.current
      ?.querySelector<HTMLButtonElement>(`#workflow-stage-tab-${next}`)
      ?.focus();
  }

  return (
    <div
      className="guided-workflow"
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
    >
      <div className="workflow-tour-meta">
        <span aria-live="polite">
          Stage {activeGuide + 1} of {guideSteps.length}
        </span>
        <div className="workflow-tour-controls">
          {manual ? (
            <span>Manual tour</span>
          ) : (
            <button
              type="button"
              className="tour-toggle"
              onClick={onToggle}
              aria-label={paused ? "Play product tour" : "Pause product tour"}
            >
              {paused ? (
                <Play aria-hidden="true" />
              ) : (
                <Pause aria-hidden="true" />
              )}
              {paused ? "Play" : "Pause"}
            </button>
          )}
          <button
            type="button"
            className="tour-restart"
            onClick={resetDemo}
            aria-label="Restart the demo from stage one"
          >
            <RotateCcw aria-hidden="true" />
            Restart
          </button>
        </div>
      </div>
      <div
        className={`workflow-tour-segments${isRunning ? " running" : ""}`}
        aria-hidden="true"
      >
        {guideSteps.map((step, index) => (
          <span
            key={step.number}
            className={
              index < activeGuide
                ? "complete"
                : index === activeGuide
                  ? "active"
                  : ""
            }
          >
            {index === activeGuide ? <i key={activeGuide} /> : null}
          </span>
        ))}
      </div>
      <div className="workflow-stage-rail-scroll">
        <ol
          className="workflow-stage-rail"
          role="tablist"
          aria-label="Application stages"
          ref={railRef}
          onKeyDown={handleRailKeyDown}
        >
          {workflowStageDetails.map((item, index) => (
            <li
              role="presentation"
              className={
                index === activeGuide
                  ? "active"
                  : index < activeGuide
                    ? "complete"
                    : ""
              }
              key={item.title}
            >
              <button
                type="button"
                id={`workflow-stage-tab-${index}`}
                role="tab"
                // Without an explicit name the tab announces as the number plus
                // the title plus the summary line.
                aria-label={`Show stage ${index + 1}: ${item.title}`}
                aria-selected={index === activeGuide}
                aria-controls="workflow-preview"
                tabIndex={index === activeGuide ? 0 : -1}
                onClick={() => onSelect(index)}
              >
                <span className="workflow-stage-icon">
                  <WorkflowStageIcon index={index} />
                  <b>{index + 1}</b>
                </span>
                <strong>{item.title}</strong>
                <small>{item.summary}</small>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <section
        id="workflow-preview"
        role="tabpanel"
        // aria-labelledby points at the selected tab, which is the correct name
        // for a tabpanel; an aria-label here would be silently ignored.
        aria-labelledby={`workflow-stage-tab-${activeGuide}`}
        className={`workflow-application${animated ? " workflow-animated" : ""}`}
      >
        <header className="workflow-application-header">
          <div className="workflow-opportunity">
            <span aria-hidden="true">
              <BriefcaseBusiness />
            </span>
            <div>
              <small>Opportunity</small>
              <strong>Research Fellowship</strong>
            </div>
            <em>In progress</em>
          </div>
          <div className="workflow-deadline">
            <CalendarDays aria-hidden="true" />
            <span>
              <small>Application deadline</small>
              <strong>15 Dec 2026</strong>
            </span>
          </div>
          <Link className="workflow-open-application" to="/product-preview">
            View full application <ChevronRight aria-hidden="true" />
          </Link>
        </header>

        <div className="workflow-application-grid">
          <aside className="workflow-stage-navigation">
            <span>Application stages</span>
            <ol>
              {workflowStageDetails.map((item, index) => (
                <li
                  className={
                    index === activeGuide
                      ? "active"
                      : index < activeGuide
                        ? "complete"
                        : ""
                  }
                  key={item.title}
                >
                  <button
                    type="button"
                    aria-label={`Open ${item.title} stage`}
                    aria-pressed={index === activeGuide}
                    onClick={() => onSelect(index)}
                  >
                    <span>{index + 1}</span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.summary}</small>
                    </span>
                    {index < activeGuide ? (
                      <Check aria-hidden="true" />
                    ) : index > activeGuide ? (
                      <LockKeyhole aria-hidden="true" />
                    ) : (
                      <ChevronRight aria-hidden="true" />
                    )}
                  </button>
                </li>
              ))}
            </ol>
          </aside>

          <section className="workflow-stage-main">
            <header>
              <span className="workflow-current-icon">
                <WorkflowStageIcon index={activeGuide} />
              </span>
              <div aria-live="polite">
                <h3>
                  Stage {activeGuide + 1}: {stage.title}
                </h3>
                <p>{stage.description}</p>
              </div>
            </header>
            <div className="workflow-stage-meter">
              <span style={{ transform: `scaleX(${completionPct / 100})` }} />
              <small>
                {completedCount} / {totalCount} completed
              </small>
            </div>
            <ul className="workflow-stage-checklist" key={stage.title}>
              {stageTasks.map((task) => (
                <li className={task.done ? "complete" : ""} key={task.title}>
                  <button
                    type="button"
                    className="workflow-task-row"
                    aria-pressed={task.done}
                    aria-label={`${task.done ? "Mark pending:" : "Mark complete:"} ${task.title}`}
                    onClick={() => toggleTask(task.key, task.done)}
                  >
                    <span className="workflow-task-state">
                      {task.done ? <Check aria-hidden="true" /> : null}
                    </span>
                    <span>
                      <strong>{task.title}</strong>
                      <small>{task.copy}</small>
                    </span>
                    <em>{task.done ? task.doneAction : task.pendingAction}</em>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <aside
            className="workflow-progress-panel"
            aria-label="Application progress"
          >
            <h3>Application progress</h3>
            <PercentageGauge value={overallProgress} label="Overall progress" />
            <ul>
              {workflowStageDetails.map((item, index) => (
                <li
                  className={index === activeGuide ? "active" : ""}
                  key={item.title}
                >
                  <span>
                    {progress[index] === 100 ? (
                      <CheckCircle2 aria-hidden="true" />
                    ) : (
                      <WorkflowStageIcon index={index} />
                    )}
                    {item.title}
                  </span>
                  <strong>{progress[index]}%</strong>
                </li>
              ))}
            </ul>
            <div className="workflow-guidance">
              <Lightbulb aria-hidden="true" />
              <span>
                <strong>Stay on track</strong>
                <small>
                  Complete the current tasks to unlock the next stage.
                </small>
              </span>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}


