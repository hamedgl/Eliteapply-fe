import {
  ArrowRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  Filter,
  Folder,
  GraduationCap,
  Globe2,
  Link2,
  ListChecks,
  LayoutDashboard,
  Lightbulb,
  Loader2,
  LockKeyhole,
  MapPin,
  Pause,
  PenLine,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import closingPathIllustration from "../../assets/illustrations/application-path.png";
import connectedWorkspaceIllustration from "../../assets/illustrations/connected-workspace.png";
import comparisonWith from "../../assets/comparison-with.webp";
import comparisonWithout from "../../assets/comparison-without.webp";
import { usePageSeo } from "../../seo/usePageSeo";
import { MarketingHeader, MarketingShell } from "../marketing/MarketingShell";

const guideSteps = [
  {
    number: "01",
    label: "Add & capture",
    description:
      "Add a scholarship, programme or application. Capture its deadline, source link and core details.",
    demo: {
      title: "Opportunity details",
      status: "Deadline captured",
    },
  },
  {
    number: "02",
    label: "Break down the requirements",
    description:
      "Turn eligibility rules, essays, evidence and references into a clear, actionable plan.",
    demo: {
      title: "Requirements plan",
      status: "8 tasks organised",
    },
  },
  {
    number: "03",
    label: "Prepare the application",
    description:
      "Draft written materials, organise documents and connect the evidence that supports your story.",
    demo: {
      title: "Personal Statement Draft",
      status: "Saved just now",
    },
  },
  {
    number: "04",
    label: "Review and submit",
    description:
      "Resolve missing items, complete final checks and record the outcome without losing context.",
    demo: {
      title: "Submission Review",
      status: "Ready for final review",
    },
  },
] as const;
type GuideStep = (typeof guideSteps)[number];

const workflowStageDetails = [
  {
    title: "Add & capture",
    summary: "Opportunity details & initial setup",
    description:
      "Add the opportunity and capture the details that shape the application plan.",
    tasks: [
      {
        title: "Opportunity details",
        copy: "Title, organisation, deadline and location",
        done: true,
        doneAction: "Edit details",
        pendingAction: "Add details",
      },
      {
        title: "Programme information",
        copy: "Field of study, level, duration and mode",
        done: true,
        doneAction: "Edit",
        pendingAction: "Add programme info",
      },
      {
        title: "Requirements capture",
        copy: "Documents, eligibility and written materials",
        done: false,
        doneAction: "Review requirements",
        pendingAction: "Add requirements",
      },
      {
        title: "Funding & benefits",
        copy: "Stipend, tuition and other support",
        done: false,
        doneAction: "Review funding",
        pendingAction: "Add details",
      },
      {
        title: "Notes & links",
        copy: "Official sources and personal notes",
        done: false,
        doneAction: "Edit notes",
        pendingAction: "Add notes",
      },
    ],
  },
  {
    title: "Break down",
    summary: "Requirements & tasks breakdown",
    description:
      "Turn every requirement into a visible task with a clear owner and state.",
    tasks: [
      {
        title: "Eligibility criteria",
        copy: "Academic, residency and experience rules",
        done: true,
        doneAction: "Review",
        pendingAction: "Check eligibility",
      },
      {
        title: "Required documents",
        copy: "Transcripts, certificates and identification",
        done: true,
        doneAction: "Review",
        pendingAction: "Add documents",
      },
      {
        title: "Written responses",
        copy: "Prompts, word limits and evidence needs",
        done: true,
        doneAction: "Open plan",
        pendingAction: "Plan responses",
      },
      {
        title: "Reference requirements",
        copy: "Referees, due dates and supporting context",
        done: false,
        doneAction: "Review referees",
        pendingAction: "Add referees",
      },
      {
        title: "Submission instructions",
        copy: "Provider process and final deadline checks",
        done: false,
        doneAction: "Review instructions",
        pendingAction: "Add details",
      },
    ],
  },
  {
    title: "Prepare",
    summary: "Documents, drafts & materials",
    description:
      "Prepare the writing, documents and evidence required for a complete application.",
    tasks: [
      {
        title: "Personal statement",
        copy: "Draft connected to the application prompt",
        done: true,
        doneAction: "Open draft",
        pendingAction: "Start draft",
      },
      {
        title: "Academic CV",
        copy: "Current education, research and experience",
        done: true,
        doneAction: "Review",
        pendingAction: "Add CV",
      },
      {
        title: "Transcripts & certificates",
        copy: "Verified files connected to requirements",
        done: true,
        doneAction: "View files",
        pendingAction: "Upload files",
      },
      {
        title: "Evidence connections",
        copy: "Examples supporting each written claim",
        done: true,
        doneAction: "Review",
        pendingAction: "Connect evidence",
      },
      {
        title: "Referee brief",
        copy: "Relevant context for the outstanding request",
        done: false,
        doneAction: "Edit brief",
        pendingAction: "Prepare brief",
      },
    ],
  },
  {
    title: "Review & submit",
    summary: "Final check & submission",
    description:
      "Resolve the remaining gaps, complete final checks and record the submission.",
    tasks: [
      {
        title: "Requirements covered",
        copy: "Every requirement has a recorded state",
        done: true,
        doneAction: "Review",
        pendingAction: "Check coverage",
      },
      {
        title: "Documents verified",
        copy: "Current versions are linked and readable",
        done: true,
        doneAction: "Review",
        pendingAction: "Verify documents",
      },
      {
        title: "References confirmed",
        copy: "Requests and provider instructions checked",
        done: true,
        doneAction: "Review",
        pendingAction: "Confirm references",
      },
      {
        title: "Final declarations",
        copy: "Accuracy, consent and submission details",
        done: true,
        doneAction: "Open checks",
        pendingAction: "Complete checks",
      },
      {
        title: "Submission record",
        copy: "Record the provider confirmation and outcome",
        done: false,
        doneAction: "Edit record",
        pendingAction: "Record submission",
      },
    ],
  },
] as const;

const workflowProgress = [
  [100, 15, 0, 0],
  [100, 68, 12, 0],
  [100, 100, 72, 15],
  [100, 100, 100, 84],
] as const;

const heroApplications = [
  {
    id: "rhodes",
    university: "University of Oxford",
    programme: "Rhodes Scholarship",
    deadline: "15 September",
    remaining: "24 days",
    progress: 78,
    stage: 2,
    nextAction: "Connect research evidence",
    nextDetail: "Link one verified outcome to your personal statement.",
  },
  {
    id: "stanford",
    university: "Stanford University",
    programme: "Knight-Hennessy Scholars",
    deadline: "1 October",
    remaining: "40 days",
    progress: 62,
    stage: 1,
    nextAction: "Continue your statement",
    nextDetail: "Shape the section connecting your experience to your goals.",
  },
  {
    id: "eth",
    university: "ETH Zürich",
    programme: "Excellence Scholarship",
    deadline: "15 November",
    remaining: "85 days",
    progress: 48,
    stage: 1,
    nextAction: "Confirm programme requirements",
    nextDetail: "Review the academic documents required for submission.",
  },
] as const;

const heroDocuments = [
  {
    id: "statement",
    name: "Statement of Purpose",
    status: "In progress",
    progress: 62,
    updated: "Saved 4 minutes ago",
  },
  {
    id: "cv",
    name: "Academic CV",
    status: "Ready",
    progress: 100,
    updated: "Reviewed yesterday",
  },
  {
    id: "transcripts",
    name: "Academic transcripts",
    status: "Ready",
    progress: 100,
    updated: "2 files verified",
  },
] as const;

const heroViews = [
  { id: "overview", label: "Today", Icon: LayoutDashboard },
  { id: "applications", label: "Applications", Icon: GraduationCap },
  { id: "documents", label: "Documents", Icon: FileText },
] as const;
type HeroView = (typeof heroViews)[number]["id"];
const previewConnections = [
  [
    Folder,
    "Applications",
    "Keep opportunities, deadlines and progress in one place.",
  ],
  [
    FileText,
    "Evidence",
    "Connect documents and proof to the requirements they support.",
  ],
  [
    PenLine,
    "Writing",
    "Shape drafts with the right prompt and evidence in view.",
  ],
  [
    Users,
    "References",
    "Track requests, due dates and follow-up without exposing confidential content.",
  ],
] as const;

type HeroWorkspaceTask = {
  id: string;
  label: string;
  detail: string;
  done: boolean;
};

const heroAiActions = [
  {
    id: "write",
    label: "Write with AI",
    Icon: PenLine,
    status: "AI draft ready — opening paragraph rewritten",
  },
  {
    id: "match",
    label: "Match evidence",
    Icon: Link2,
    status: "Evidence matched to your strongest examples",
  },
  {
    id: "extract",
    label: "Extract requirements",
    Icon: ListChecks,
    status: "6 requirements extracted from the prompt",
  },
  {
    id: "review",
    label: "Run AI review",
    Icon: ShieldCheck,
    status: "AI review complete — 3 improvements suggested",
  },
] as const;
type HeroAiActionId = (typeof heroAiActions)[number]["id"];

const heroWorkspaceApplications = [
  {
    id: "rhodes",
    programme: "Rhodes Scholarship",
    status: "In progress",
    nextAction: "Connect leadership evidence",
    actionDetail: "Personal statement · Evidence map",
    deadlineDays: 18,
    deadlineDate: "15 September",
    readiness: 72,
    requirementsCovered: 9,
    tasks: [
      {
        id: "leadership",
        label: "Connect leadership evidence",
        detail: "Link one verified outcome to your personal statement.",
        done: false,
      },
      {
        id: "opening",
        label: "Shape the opening narrative",
        detail: "Draft reviewed and connected to your motivation notes.",
        done: true,
      },
      {
        id: "referee",
        label: "Confirm referee availability",
        detail: "Send the final briefing note to your academic referee.",
        done: false,
      },
      {
        id: "transcript",
        label: "Verify academic transcript",
        detail: "Official PDF checked against the application requirements.",
        done: true,
      },
      {
        id: "eligibility",
        label: "Review eligibility declaration",
        detail: "Complete the final residency and age criteria check.",
        done: false,
      },
    ],
  },
  {
    id: "knight-hennessy",
    programme: "Knight-Hennessy Scholars",
    status: "Drafting",
    nextAction: "Strengthen the personal statement",
    actionDetail: "Personal statement · Motivation",
    deadlineDays: 34,
    deadlineDate: "1 October",
    readiness: 61,
    requirementsCovered: 7,
    tasks: [
      {
        id: "statement",
        label: "Strengthen the personal statement",
        detail: "Connect your long-term goal to a specific Stanford resource.",
        done: false,
      },
      {
        id: "video",
        label: "Outline the video statement",
        detail: "Three story beats are ready for a first recording.",
        done: true,
      },
      {
        id: "resume",
        label: "Condense the leadership résumé",
        detail: "Reduce two older entries and quantify current impact.",
        done: false,
      },
      {
        id: "references",
        label: "Brief both recommenders",
        detail: "Background notes and submission dates have been shared.",
        done: true,
      },
    ],
  },
  {
    id: "eth",
    programme: "ETH Excellence Scholarship",
    status: "Planning",
    nextAction: "Confirm programme requirements",
    actionDetail: "Eligibility · Document checklist",
    deadlineDays: 79,
    deadlineDate: "15 November",
    readiness: 48,
    requirementsCovered: 5,
    tasks: [
      {
        id: "requirements",
        label: "Confirm programme requirements",
        detail: "Compare the department checklist with the scholarship call.",
        done: false,
      },
      {
        id: "proposal",
        label: "Draft the pre-proposal outline",
        detail: "Research question and methodology still need review.",
        done: false,
      },
      {
        id: "grades",
        label: "Convert the grade summary",
        detail: "Institutional grading scale is attached and verified.",
        done: true,
      },
      {
        id: "supervisor",
        label: "Shortlist potential supervisors",
        detail: "Add one more faculty fit before requesting feedback.",
        done: false,
      },
    ],
  },
] as const;

function createInitialHeroTaskState() {
  return Object.fromEntries(
    heroWorkspaceApplications.map((application) => [
      application.id,
      Object.fromEntries(application.tasks.map((task) => [task.id, task.done])),
    ]),
  ) as Record<string, Record<string, boolean>>;
}

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
          description="Keep the referee, requirement, request status, due date, follow-up state and supporting context visible without exposing confidential final content."
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

export function ProductPreviewPage() {
  usePageSeo("/product-preview");
  const [activeGuide, setActiveGuide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduceMotion(media.matches);
    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion) return;
    const timer = window.setTimeout(
      () => setActiveGuide((current) => (current + 1) % guideSteps.length),
      4800,
    );
    return () => window.clearTimeout(timer);
  }, [activeGuide, paused, reduceMotion]);

  return (
    <MarketingShell>
      <section className="product-preview-hero">
        <div className="product-preview-copy">
          <h1>See how every application comes together.</h1>
          <p>
            Explore a realistic sample workspace, move through the workflow and
            see how deadlines, evidence, writing and references stay connected
            before you create an account.
          </p>
          <div className="phase-one-actions">
            <Link className="landing-button" to="/register" reloadDocument>
              Start free <ArrowRight aria-hidden="true" />
            </Link>
            <a className="landing-button secondary" href="#preview-workflow">
              Explore the workflow
            </a>
          </div>
        </div>
        <ProductPreview />
      </section>

      <section className="preview-page-workflow" id="preview-workflow">
        <header className="preview-workflow-heading">
          <h2>Follow the path from opportunity to final review.</h2>
          <p>
            Four practical stages turn a complex application into a plan you can
            understand, review and own.
          </p>
        </header>
        <div className="workflow-layout">
          <div className="workflow-controller">
            <div className="tour-meta">
              <span aria-live="polite">
                Stage {activeGuide + 1} of {guideSteps.length}
              </span>
              {reduceMotion ? (
                <span>Manual tour</span>
              ) : (
                <button
                  type="button"
                  className="tour-toggle"
                  onClick={() => setPaused((value) => !value)}
                  aria-label={
                    paused ? "Play product tour" : "Pause product tour"
                  }
                >
                  {paused ? (
                    <Play aria-hidden="true" />
                  ) : (
                    <Pause aria-hidden="true" />
                  )}
                  {paused ? "Play" : "Pause"}
                </button>
              )}
            </div>
            <span
              className={`tour-progress ${!paused && !reduceMotion ? "running" : ""}`}
              aria-hidden="true"
              key={`${activeGuide}-${paused}`}
            >
              <i />
            </span>
            <ol
              className="guide-steps"
              aria-label="EliteApply application workflow"
            >
              {guideSteps.map((step, index) => (
                <li
                  className={index === activeGuide ? "active" : ""}
                  key={step.number}
                >
                  <button
                    type="button"
                    className="guide-step-button"
                    aria-pressed={index === activeGuide}
                    aria-controls="workflow-preview"
                    onClick={() => setActiveGuide(index)}
                  >
                    <span className="guide-step-number">{index + 1}</span>
                    <span>
                      <strong>{step.label}</strong>
                      <small>{step.description}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <WorkflowPreview
            key={guideSteps[activeGuide].number}
            step={guideSteps[activeGuide]}
            animated={!reduceMotion}
          />
        </div>
      </section>

      <section
        className="preview-connections"
        aria-labelledby="connections-title"
      >
        <h2 id="connections-title">Everything stays connected.</h2>
        <div>
          {previewConnections.map(([Icon, title, copy]) => (
            <article key={title}>
              <span aria-hidden="true">
                <Icon />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="preview-closing">
        <div>
          <h2>Ready to build your own workspace?</h2>
          <p>Create your workspace and move from plans to progress.</p>
        </div>
        <Link className="landing-button" to="/register" reloadDocument>
          Start free <ArrowRight aria-hidden="true" />
        </Link>
      </section>
    </MarketingShell>
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
            width="1052"
            height="712"
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
            width="1052"
            height="712"
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

function PreviewFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="capability-preview">
      <header>
        <span>{title}</span>
        <small>Sample workspace</small>
      </header>
      {children}
    </div>
  );
}

type TrackerAppItem = {
  id: string;
  name: string;
  grantor: string;
  status: "In progress" | "Planning" | "Drafting" | "Submitted";
  priority: "High" | "Medium" | "Normal";
  deadline: string;
  daysLeft: number;
  nextAction: string;
  requirements: { id: string; label: string; done: boolean }[];
};

const INITIAL_TRACKER_APPS: TrackerAppItem[] = [
  {
    id: "rhodes",
    name: "Rhodes Scholarship",
    grantor: "University of Oxford",
    status: "In progress",
    priority: "High",
    deadline: "15 Sep",
    daysLeft: 54,
    nextAction: "Connect evidence",
    requirements: [
      { id: "stmt", label: "Personal statement (1,000 words)", done: true },
      { id: "refs", label: "3 Academic & leadership references", done: true },
      { id: "trans", label: "Certified university transcript", done: true },
      { id: "evid", label: "Community impact evidence portfolio", done: false },
    ],
  },
  {
    id: "futures",
    name: "Global Futures",
    grantor: "Cambridge Trust",
    status: "Planning",
    priority: "Medium",
    deadline: "2 Oct",
    daysLeft: 71,
    nextAction: "Review requirements",
    requirements: [
      { id: "prop", label: "Research proposal outline", done: true },
      { id: "budg", label: "Estimated study budget plan", done: false },
      { id: "cv", label: "Academic CV (2 pages)", done: true },
      { id: "sup", label: "Faculty sponsor nomination", done: false },
    ],
  },
  {
    id: "fellowship",
    name: "Research Fellowship",
    grantor: "Stanford Graduate School",
    status: "Drafting",
    priority: "High",
    deadline: "18 Oct",
    daysLeft: 87,
    nextAction: "Continue statement",
    requirements: [
      { id: "abstr", label: "Abstract & summary statement", done: true },
      { id: "pub", label: "Publication & project list", done: true },
      { id: "essay", label: "Motivation statement draft", done: false },
      { id: "rec", label: "Department recommendation letter", done: false },
    ],
  },
  {
    id: "fulbright",
    name: "Fulbright Award",
    grantor: "US-UK Educational Commission",
    status: "In progress",
    priority: "High",
    deadline: "24 Oct",
    daysLeft: 93,
    nextAction: "Finalize budget",
    requirements: [
      { id: "host", label: "Host institution affiliation letter", done: true },
      { id: "proj", label: "Project statement", done: true },
      { id: "budg2", label: "Travel & living allowance budget", done: false },
      { id: "ref2", label: "Language evaluation form", done: true },
    ],
  },
  {
    id: "schwarzman",
    name: "Schwarzman Scholars",
    grantor: "Tsinghua University",
    status: "Submitted",
    priority: "Normal",
    deadline: "1 Nov",
    daysLeft: 101,
    nextAction: "Prepare interview",
    requirements: [
      { id: "video", label: "1-minute video introduction", done: true },
      { id: "essay2", label: "Leadership essay", done: true },
      { id: "app", label: "Submitted application form", done: true },
    ],
  },
];

function TrackerPreview() {
  const [apps, setApps] = useState<TrackerAppItem[]>(INITIAL_TRACKER_APPS);
  const [selectedId, setSelectedId] = useState<string>("rhodes");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFilterBarOpen, setIsFilterBarOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const toggleRequirement = (appId: string, reqId: string) => {
    setApps((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;
        const updatedReqs = app.requirements.map((r) =>
          r.id === reqId ? { ...r, done: !r.done } : r,
        );
        const doneCount = updatedReqs.filter((r) => r.done).length;
        const newProgress = Math.round((doneCount / updatedReqs.length) * 100);
        return {
          ...app,
          requirements: updatedReqs,
          status:
            newProgress === 100
              ? "Submitted"
              : app.status === "Submitted"
                ? "In progress"
                : app.status,
        };
      }),
    );
  };

  const handleNextActionClick = (app: TrackerAppItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedId(app.id);
    setToastMessage(`Triggered action: "${app.nextAction}" for ${app.name}`);
  };

  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.grantor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.nextAction.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      app.status.toLowerCase().replace(/\s+/g, "-") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedApp = apps.find((a) => a.id === selectedId) || filteredApps[0];

  const getStatusClass = (status: string) => {
    switch (status) {
      case "In progress":
        return "in-progress";
      case "Planning":
        return "planning";
      case "Drafting":
        return "drafting";
      case "Submitted":
        return "submitted";
      default:
        return "in-progress";
    }
  };

  return (
    <PreviewFrame title="Applications">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="tracker-toast-bar" role="status">
          <span>{toastMessage}</span>
          <button
            className="tracker-icon-btn"
            onClick={() => setToastMessage(null)}
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="preview-toolbar">
        <Search size={18} aria-hidden="true" />
        <input
          type="text"
          className="tracker-search-input"
          placeholder="Search applications (e.g. Rhodes, Stanford)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search applications"
        />
        {searchTerm && (
          <button
            className="tracker-icon-btn"
            onClick={() => setSearchTerm("")}
            title="Clear search"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
        <button
          className={`tracker-icon-btn ${isFilterBarOpen || statusFilter !== "all" ? "active" : ""}`}
          onClick={() => setIsFilterBarOpen((prev) => !prev)}
          title="Filter status"
          aria-label="Toggle status filter"
        >
          <Filter size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Toggleable Filter Chips */}
      {isFilterBarOpen && (
        <div className="tracker-filter-bar">
          <span style={{ color: "var(--m-muted)", fontWeight: 600 }}>Status:</span>
          {[
            { id: "all", label: "All" },
            { id: "in-progress", label: "In progress" },
            { id: "planning", label: "Planning" },
            { id: "drafting", label: "Drafting" },
            { id: "submitted", label: "Submitted" },
          ].map((chip) => (
            <button
              key={chip.id}
              className={`tracker-filter-chip ${statusFilter === chip.id ? "active" : ""}`}
              onClick={() => setStatusFilter(chip.id)}
            >
              {chip.label}
            </button>
          ))}
          {statusFilter !== "all" && (
            <button
              className="tracker-action-btn"
              style={{ fontSize: "0.72rem", marginLeft: "auto" }}
              onClick={() => setStatusFilter("all")}
            >
              Reset filter
            </button>
          )}
        </div>
      )}

      {/* Applications Table */}
      <div
        className="tracker-table"
        role="table"
        aria-label="Sample scholarship applications"
      >
        <div className="tracker-row tracker-head" role="row">
          <span role="columnheader">Application</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Deadline</span>
          <span role="columnheader">Progress</span>
          <span role="columnheader">Next action</span>
        </div>

        {filteredApps.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--m-muted)",
              fontSize: "0.85rem",
            }}
          >
            No applications found matching "{searchTerm}".
            <br />
            <button
              className="tracker-action-btn"
              style={{ marginTop: "0.5rem" }}
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredApps.map((app) => {
            const doneCount = app.requirements.filter((r) => r.done).length;
            const progressPct = Math.round(
              (doneCount / app.requirements.length) * 100,
            );
            const isSelected = selectedApp?.id === app.id;

            return (
              <div
                className={`tracker-row ${isSelected ? "selected" : ""}`}
                role="row"
                tabIndex={0}
                key={app.id}
                onClick={() => setSelectedId(app.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(app.id);
                  }
                }}
                aria-selected={isSelected}
              >
                <span role="cell">
                  <strong>{app.name}</strong>
                  <br />
                  <small style={{ color: "var(--m-muted)", fontWeight: 400 }}>
                    {app.grantor}
                  </small>
                </span>
                <span role="cell">
                  <span className={`status-pill ${getStatusClass(app.status)}`}>
                    {app.status}
                  </span>
                </span>
                <span role="cell">{app.deadline}</span>
                <span role="cell">
                  <i className="mini-progress">
                    <b style={{ width: `${progressPct}%` }} />
                  </i>
                  {progressPct}%
                </span>
                <span role="cell">
                  <button
                    className="tracker-action-btn"
                    onClick={(e) => handleNextActionClick(app, e)}
                    title={`Action: ${app.nextAction}`}
                  >
                    {app.nextAction} <ArrowRight size={12} />
                  </button>
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Application Workspace Detail Card */}
      {selectedApp && (
        <div className="tracker-detail-card">
          <div className="tracker-detail-header">
            <div>
              <h4>{selectedApp.name}</h4>
              <p>
                {selectedApp.grantor} • Priority:{" "}
                <span style={{ fontWeight: 600, color: "var(--m-text-strong)" }}>
                  {selectedApp.priority}
                </span>{" "}
                • {selectedApp.daysLeft} days left ({selectedApp.deadline})
              </p>
            </div>
            <span className={`status-pill ${getStatusClass(selectedApp.status)}`}>
              {selectedApp.status}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.8rem",
              margin: "0.5rem 0",
            }}
          >
            <span style={{ color: "var(--m-text-strong)", fontWeight: 600 }}>
              Requirements checklist (
              {selectedApp.requirements.filter((r) => r.done).length} of{" "}
              {selectedApp.requirements.length} complete):
            </span>
            <span style={{ color: "var(--m-blue)", fontWeight: 600 }}>
              {Math.round(
                (selectedApp.requirements.filter((r) => r.done).length /
                  selectedApp.requirements.length) *
                  100,
              )}
              % overall progress
            </span>
          </div>

          {/* Checklist items */}
          <div className="tracker-req-list">
            {selectedApp.requirements.map((req) => (
              <label
                key={req.id}
                className={`tracker-req-item ${req.done ? "done" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRequirement(selectedApp.id, req.id);
                  setToastMessage(
                    `${req.done ? "Unchecked" : "Completed"}: "${req.label}"`,
                  );
                }}
              >
                <input
                  type="checkbox"
                  checked={req.done}
                  onChange={() => {}}
                  style={{ accentColor: "var(--m-blue)" }}
                />
                <span>{req.label}</span>
              </label>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "1rem",
              paddingTop: "0.75rem",
              borderTop: "1px solid var(--m-line-soft)",
            }}
          >
            <span style={{ fontSize: "0.78rem", color: "var(--m-muted)" }}>
              Tip: Click any requirement item to update progress live!
            </span>
            <button
              className="tracker-action-btn"
              style={{
                background: "var(--m-blue)",
                color: "#ffffff",
                padding: "6px 12px",
                borderRadius: "6px",
              }}
              onClick={(e) => handleNextActionClick(selectedApp, e)}
            >
              {selectedApp.nextAction} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </PreviewFrame>
  );
}

type WritingEvidenceItem = {
  id: string;
  label: string;
  connected: boolean;
};

type WritingScenario = {
  id: string;
  tabLabel: string;
  prompt: string;
  wordLimit: number;
  draft: string;
  polished: string;
  clarityNote: string;
  evidence: WritingEvidenceItem[];
};

const WRITING_SCENARIOS: WritingScenario[] = [
  {
    id: "change",
    tabLabel: "Positive change",
    prompt: "Describe a time you created positive change.",
    wordLimit: 750,
    draft:
      "I noticed that students in my community needed clearer access to academic opportunities, so I organised a weekly peer-support session where we mapped scholarships, wrote sample essays together and tracked outcomes as a group.",
    polished:
      "When I noticed students in my community struggling to find a clear path to academic opportunities, I started a weekly peer-support session — mapping scholarships, workshopping essays together and tracking outcomes as a group. Nine months later, four peers had submitted stronger, evidence-backed applications.",
    clarityNote: "Add one specific outcome to support this point.",
    evidence: [
      { id: "research", label: "Community research project", connected: true },
      { id: "workshop", label: "Workshop outcomes", connected: true },
      { id: "survey", label: "Peer survey data", connected: false },
      { id: "mentor", label: "Faculty mentor notes", connected: false },
    ],
  },
  {
    id: "challenge",
    tabLabel: "Academic challenge",
    prompt: "Describe an academic challenge you overcame.",
    wordLimit: 650,
    draft:
      "In my second year I struggled to balance an intensive lab schedule with coursework. I built a structured revision plan, met with my professor weekly and adjusted my study methods until my grades recovered.",
    polished:
      "In my second year, an intensive lab schedule collided with three core courses and my grades slipped. I rebuilt my study system around weekly professor check-ins and spaced revision — by the following term, my average had recovered by fourteen points.",
    clarityNote: "Name the specific method that turned things around.",
    evidence: [
      { id: "transcript", label: "Term grade comparison", connected: true },
      { id: "plan", label: "Revision plan document", connected: true },
      { id: "email", label: "Professor correspondence", connected: false },
      { id: "lab", label: "Lab performance notes", connected: false },
    ],
  },
  {
    id: "field",
    tabLabel: "Field of study",
    prompt: "What draws you to this field of study?",
    wordLimit: 500,
    draft:
      "My interest in environmental engineering began during a summer internship where I helped monitor water quality in a local river system.",
    polished:
      "My interest in environmental engineering took root the summer I spent monitoring water quality in a local river system — and traced a single pollution spike back to an upstream storm drain.",
    clarityNote: "Anchor the interest to one concrete moment, not a general summary.",
    evidence: [
      { id: "internship", label: "Internship summary report", connected: true },
      { id: "data", label: "Water quality dataset", connected: true },
      { id: "photos", label: "Fieldwork photo log", connected: false },
      { id: "reference", label: "Site supervisor reference", connected: false },
    ],
  },
];

function WritingCapabilityPreview() {
  const [scenarioId, setScenarioId] = useState(WRITING_SCENARIOS[0].id);
  const [draftsById, setDraftsById] = useState<Record<string, string>>(() =>
    Object.fromEntries(WRITING_SCENARIOS.map((s) => [s.id, s.draft])),
  );
  const [evidenceById, setEvidenceById] = useState<
    Record<string, WritingEvidenceItem[]>
  >(() =>
    Object.fromEntries(WRITING_SCENARIOS.map((s) => [s.id, s.evidence])),
  );
  const [historyById, setHistoryById] = useState<Record<string, string | null>>(
    {},
  );
  const [polishState, setPolishState] = useState<
    "idle" | "polishing" | "done"
  >("idle");
  const polishTimeout = useRef<number | undefined>(undefined);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => window.clearTimeout(polishTimeout.current), []);

  const scenario = WRITING_SCENARIOS.find((s) => s.id === scenarioId)!;
  const draft = draftsById[scenario.id];
  const evidence = evidenceById[scenario.id];
  const connectedCount = evidence.filter((item) => item.connected).length;
  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const canUndo = historyById[scenario.id] != null;

  function switchScenario(id: string) {
    window.clearTimeout(polishTimeout.current);
    setScenarioId(id);
    setPolishState("idle");
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const index = WRITING_SCENARIOS.findIndex((s) => s.id === scenario.id);
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next =
      WRITING_SCENARIOS[
        (index + delta + WRITING_SCENARIOS.length) % WRITING_SCENARIOS.length
      ];
    switchScenario(next.id);
    tabsRef.current
      ?.querySelector<HTMLButtonElement>(`#writing-tab-${next.id}`)
      ?.focus();
  }

  function handleDraftChange(value: string) {
    setDraftsById((prev) => ({ ...prev, [scenario.id]: value }));
    if (polishState === "done") setPolishState("idle");
  }

  function toggleEvidence(id: string) {
    setEvidenceById((prev) => ({
      ...prev,
      [scenario.id]: prev[scenario.id].map((item) =>
        item.id === id ? { ...item, connected: !item.connected } : item,
      ),
    }));
  }

  function handlePolish() {
    if (polishState === "polishing") return;
    setPolishState("polishing");
    window.clearTimeout(polishTimeout.current);
    polishTimeout.current = window.setTimeout(() => {
      setHistoryById((prev) => ({ ...prev, [scenario.id]: draft }));
      setDraftsById((prev) => ({ ...prev, [scenario.id]: scenario.polished }));
      setPolishState("done");
    }, 900);
  }

  function handleUndo() {
    const previous = historyById[scenario.id];
    if (previous == null) return;
    setDraftsById((prev) => ({ ...prev, [scenario.id]: previous }));
    setHistoryById((prev) => ({ ...prev, [scenario.id]: null }));
    setPolishState("idle");
  }

  return (
    <PreviewFrame title="Personal statement">
      <div
        className="writing-scenario-tabs"
        role="tablist"
        aria-label="Sample statement prompts"
        ref={tabsRef}
        onKeyDown={handleTabKeyDown}
      >
        {WRITING_SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`writing-tab-${s.id}`}
            aria-selected={s.id === scenario.id}
            aria-controls={`writing-panel-${s.id}`}
            tabIndex={s.id === scenario.id ? 0 : -1}
            className={s.id === scenario.id ? "active" : ""}
            onClick={() => switchScenario(s.id)}
          >
            {s.tabLabel}
          </button>
        ))}
      </div>
      <div
        className="writing-preview-grid"
        role="tabpanel"
        id={`writing-panel-${scenario.id}`}
        aria-labelledby={`writing-tab-${scenario.id}`}
      >
        <div className="writing-main">
          <small>Prompt</small>
          <strong>{scenario.prompt}</strong>
          <div className="draft-block">
            <span>Your draft</span>
            <small className={wordCount > scenario.wordLimit ? "over-limit" : ""}>
              {wordCount} / {scenario.wordLimit} words
            </small>
            <textarea
              className="draft-textarea"
              value={draft}
              onChange={(event) => handleDraftChange(event.target.value)}
              aria-label={`Draft response to: ${scenario.prompt}`}
              spellCheck
            />
            <div className="draft-actions">
              <button
                type="button"
                className="ai-rewrite-btn"
                onClick={handlePolish}
                disabled={polishState === "polishing"}
              >
                {polishState === "polishing" ? (
                  <Loader2 className="spin-icon" aria-hidden="true" />
                ) : (
                  <Sparkles aria-hidden="true" />
                )}
                {polishState === "polishing" ? "Polishing…" : "Polish with AI"}
              </button>
              {canUndo && (
                <button type="button" className="undo-btn" onClick={handleUndo}>
                  <RotateCcw aria-hidden="true" /> Undo
                </button>
              )}
            </div>
            {polishState === "done" && (
              <p className="ai-rewrite-note" role="status">
                <Sparkles aria-hidden="true" />
                Tightened phrasing and sharpened the opening line. Your voice
                stays in control — edit freely or undo.
              </p>
            )}
          </div>
        </div>
        <aside>
          <strong>
            Connected evidence <span className="evidence-count">{connectedCount}</span>
          </strong>
          <div className="evidence-list">
            {evidence.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`evidence-chip ${item.connected ? "connected" : ""}`}
                aria-pressed={item.connected}
                onClick={() => toggleEvidence(item.id)}
              >
                {item.connected ? (
                  <CheckCircle2 aria-hidden="true" />
                ) : (
                  <FileText aria-hidden="true" />
                )}
                <span>{item.label}</span>
                {!item.connected && (
                  <em>
                    <Plus aria-hidden="true" /> Connect
                  </em>
                )}
              </button>
            ))}
          </div>
          <div className="clarity-note">
            <PenLine aria-hidden="true" />
            <span>
              <strong>Clarity review</strong>
              {scenario.clarityNote}
            </span>
          </div>
        </aside>
      </div>
    </PreviewFrame>
  );
}

type DocumentItem = {
  id: string;
  name: string;
  mappedApps: string[];
  status: "Ready" | "Update needed" | "Missing";
  fileSize: string;
  lastUpdated: string;
  version: string;
  reqsCoveredCount: number;
};

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: "transcript",
    name: "Academic transcript",
    mappedApps: ["Rhodes", "Global Futures"],
    status: "Ready",
    fileSize: "2.4 MB",
    lastUpdated: "12 Aug",
    version: "v2.1",
    reqsCoveredCount: 3,
  },
  {
    id: "degree",
    name: "Degree certificate",
    mappedApps: ["Rhodes"],
    status: "Ready",
    fileSize: "1.1 MB",
    lastUpdated: "5 Jun",
    version: "v1.0",
    reqsCoveredCount: 2,
  },
  {
    id: "proposal",
    name: "Research proposal",
    mappedApps: ["Research Fellowship"],
    status: "Update needed",
    fileSize: "840 KB",
    lastUpdated: "15 Jul",
    version: "v1.2",
    reqsCoveredCount: 2,
  },
  {
    id: "portfolio",
    name: "Community impact portfolio",
    mappedApps: ["Rhodes", "Fulbright"],
    status: "Ready",
    fileSize: "4.8 MB",
    lastUpdated: "18 Aug",
    version: "v3.0",
    reqsCoveredCount: 2,
  },
  {
    id: "financial",
    name: "Financial declaration form",
    mappedApps: [],
    status: "Missing",
    fileSize: "—",
    lastUpdated: "Not uploaded",
    version: "—",
    reqsCoveredCount: 0,
  },
];

const AVAILABLE_APPS = [
  "Rhodes",
  "Global Futures",
  "Research Fellowship",
  "Fulbright",
  "Schwarzman",
];

function DocumentsCapabilityPreview() {
  const [docs, setDocs] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [selectedId, setSelectedId] = useState<string>("transcript");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFilterBarOpen, setIsFilterBarOpen] = useState<boolean>(false);
  const [isMappingPickerOpen, setIsMappingPickerOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const toggleAppMapping = (docId: string, appName: string) => {
    setDocs((prev) =>
      prev.map((doc) => {
        if (doc.id !== docId) return doc;
        const isMapped = doc.mappedApps.includes(appName);
        const updatedApps = isMapped
          ? doc.mappedApps.filter((a) => a !== appName)
          : [...doc.mappedApps, appName];
        return {
          ...doc,
          mappedApps: updatedApps,
          status:
            updatedApps.length === 0
              ? "Missing"
              : doc.status === "Missing"
                ? "Ready"
                : doc.status,
        };
      }),
    );
  };

  const handleUploadNewVersion = (doc: DocumentItem) => {
    setDocs((prev) =>
      prev.map((d) => {
        if (d.id !== doc.id) return d;
        const verNum = parseFloat(d.version.replace("v", "")) || 1.0;
        const nextVer = `v${(verNum + 0.1).toFixed(1)}`;
        return {
          ...d,
          status: "Ready",
          version: nextVer,
          lastUpdated: "Just now",
          fileSize: d.fileSize === "—" ? "1.8 MB" : d.fileSize,
        };
      }),
    );
    setToastMessage(
      `Uploaded ${doc.name} ${doc.status === "Missing" ? "v1.0" : "newer version"}! Status is now Ready.`,
    );
  };

  const filteredDocs = docs.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.mappedApps.some((a) =>
        a.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    const matchesStatus =
      statusFilter === "all" ||
      doc.status.toLowerCase().replace(/\s+/g, "-") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedDoc = docs.find((d) => d.id === selectedId) || filteredDocs[0];

  const readyMappedCount = docs.filter(
    (d) => d.status === "Ready" && d.mappedApps.length > 0,
  ).length;
  const connectedCount = Math.min(9, 5 + readyMappedCount);

  return (
    <PreviewFrame title="Documents and evidence">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="tracker-toast-bar"
          role="status"
          style={{ margin: "0.5rem 1.25rem" }}
        >
          <span>{toastMessage}</span>
          <button
            className="tracker-icon-btn"
            onClick={() => setToastMessage(null)}
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="preview-toolbar" style={{ margin: "0.75rem 1.25rem" }}>
        <Search size={18} aria-hidden="true" />
        <input
          type="text"
          className="tracker-search-input"
          placeholder="Search documents or mapped applications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search documents"
        />
        {searchTerm && (
          <button
            className="tracker-icon-btn"
            onClick={() => setSearchTerm("")}
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
        <button
          className={`tracker-icon-btn ${isFilterBarOpen || statusFilter !== "all" ? "active" : ""}`}
          onClick={() => setIsFilterBarOpen((prev) => !prev)}
          title="Filter status"
        >
          <Filter size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Status Filter Chips */}
      {isFilterBarOpen && (
        <div
          className="tracker-filter-bar"
          style={{ margin: "0 1.25rem 0.75rem" }}
        >
          <span style={{ color: "var(--m-muted)", fontWeight: 600 }}>Filter:</span>
          {[
            { id: "all", label: "All" },
            { id: "ready", label: "Ready" },
            { id: "update-needed", label: "Update needed" },
            { id: "missing", label: "Missing" },
          ].map((chip) => (
            <button
              key={chip.id}
              className={`tracker-filter-chip ${statusFilter === chip.id ? "active" : ""}`}
              onClick={() => setStatusFilter(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Document List */}
      <div className="document-preview-list">
        {filteredDocs.length === 0 ? (
          <div
            style={{
              padding: "1.5rem",
              textAlign: "center",
              color: "var(--m-muted)",
              fontSize: "0.82rem",
            }}
          >
            No documents found matching "{searchTerm}".
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <div
                key={doc.id}
                tabIndex={0}
                onClick={() => setSelectedId(doc.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(doc.id);
                  }
                }}
                className={`tracker-row-item ${isSelected ? "selected" : ""}`}
                style={{
                  cursor: "pointer",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "6px",
                  margin: "2px 0",
                  background: isSelected ? "var(--m-selected)" : "transparent",
                  borderLeft: isSelected
                    ? "3px solid var(--m-blue)"
                    : "3px solid transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <FileText
                  aria-hidden="true"
                  style={{
                    color: isSelected ? "var(--m-blue)" : "var(--m-muted)",
                  }}
                />
                <span>
                  <strong>{doc.name}</strong>
                  <small>
                    {doc.mappedApps.length > 0
                      ? `Mapped to ${doc.mappedApps.join(", ")}`
                      : "Not mapped to any application"}
                  </small>
                </span>
                <em
                  className={
                    doc.status === "Update needed"
                      ? "attention"
                      : doc.status === "Missing"
                        ? "missing"
                        : ""
                  }
                >
                  {doc.status}
                </em>
              </div>
            );
          })
        )}
      </div>

      {/* Document Workspace Details Inspector Card */}
      {selectedDoc && (
        <div
          className="tracker-detail-card"
          style={{ margin: "0.5rem 1.25rem 1rem" }}
        >
          <div className="tracker-detail-header">
            <div>
              <h4>{selectedDoc.name}</h4>
              <p>
                Size: <strong>{selectedDoc.fileSize}</strong> • Version:{" "}
                <strong>{selectedDoc.version}</strong> • Updated:{" "}
                {selectedDoc.lastUpdated}
              </p>
            </div>
            <em
              className={
                selectedDoc.status === "Update needed"
                  ? "attention"
                  : selectedDoc.status === "Missing"
                    ? "missing"
                    : ""
              }
            >
              {selectedDoc.status}
            </em>
          </div>

          <div style={{ fontSize: "0.8rem", margin: "0.5rem 0" }}>
            <strong style={{ color: "var(--m-text-strong)" }}>
              Mapped applications:
            </strong>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.4rem",
                marginTop: "0.4rem",
              }}
            >
              {selectedDoc.mappedApps.length === 0 ? (
                <span style={{ fontSize: "0.75rem", color: "var(--m-muted)" }}>
                  No applications mapped yet.
                </span>
              ) : (
                selectedDoc.mappedApps.map((appName) => (
                  <span
                    key={appName}
                    className="tracker-filter-chip active"
                    style={{ fontSize: "0.72rem", padding: "2px 8px" }}
                    onClick={() => toggleAppMapping(selectedDoc.id, appName)}
                    title="Click to unmap"
                  >
                    {appName} ✕
                  </span>
                ))
              )}
              <button
                className="tracker-action-btn"
                style={{ fontSize: "0.72rem" }}
                onClick={() => setIsMappingPickerOpen(!isMappingPickerOpen)}
              >
                + Manage mappings
              </button>
            </div>

            {/* Mapping Selector */}
            {isMappingPickerOpen && (
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.5rem",
                  background: "var(--m-canvas)",
                  borderRadius: "6px",
                  border: "1px solid var(--m-line-soft)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--m-text-strong)",
                  }}
                >
                  Toggle mapping:
                </span>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.3rem",
                    marginTop: "0.3rem",
                  }}
                >
                  {AVAILABLE_APPS.map((appName) => {
                    const isMapped = selectedDoc.mappedApps.includes(appName);
                    return (
                      <button
                        key={appName}
                        className={`tracker-filter-chip ${isMapped ? "active" : ""}`}
                        style={{ fontSize: "0.72rem" }}
                        onClick={() => toggleAppMapping(selectedDoc.id, appName)}
                      >
                        {isMapped ? `✓ ${appName}` : `+ ${appName}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "0.8rem",
              paddingTop: "0.6rem",
              borderTop: "1px solid var(--m-line-soft)",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "var(--m-muted)" }}>
              {selectedDoc.status === "Update needed"
                ? "⚠️ Needs newer document version for 2026 application cycle."
                : "Document is connected and verified."}
            </span>
            <button
              className="tracker-action-btn"
              style={{
                background: "var(--m-blue)",
                color: "#ffffff",
                padding: "5px 10px",
                borderRadius: "6px",
              }}
              onClick={() => handleUploadNewVersion(selectedDoc)}
            >
              {selectedDoc.status === "Missing"
                ? "Upload document"
                : "Upload newer version"}{" "}
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Requirement Coverage Summary Bar */}
      <div
        className="preview-summary"
        style={{ cursor: "pointer" }}
        onClick={() =>
          setToastMessage(
            `Requirement coverage: ${connectedCount} of 9 document requirements connected across all applications.`,
          )
        }
      >
        <Folder aria-hidden="true" />
        <span>
          <strong>Requirement coverage</strong>
          {connectedCount} of 9 document requirements connected
        </span>
      </div>
    </PreviewFrame>
  );
}

type ReferenceItem = {
  id: string;
  name: string;
  requirement: string;
  institution: string;
  status: "Confirmed" | "Request sent" | "Follow-up due" | "Draft";
  due: string;
  lastContact: string;
  attachedContext: string[];
};

const INITIAL_REFERENCES: ReferenceItem[] = [
  {
    id: "khan",
    name: "Dr A. Khan",
    requirement: "Academic reference",
    institution: "University of Oxford",
    status: "Confirmed",
    due: "28 Aug",
    lastContact: "Confirmed 12 Aug",
    attachedContext: ["Certified transcript", "Research abstract", "Custom prompt notes"],
  },
  {
    id: "okoro",
    name: "Prof. D. Okoro",
    requirement: "Research potential",
    institution: "Cambridge Trust",
    status: "Request sent",
    due: "2 Sep",
    lastContact: "Request sent 18 Aug",
    attachedContext: ["Project summary draft", "CV v2"],
  },
  {
    id: "nair",
    name: "M. Priya Nair",
    requirement: "Leadership context",
    institution: "Community NGO",
    status: "Follow-up due",
    due: "5 Sep",
    lastContact: "Sent 5 Aug (18 days ago)",
    attachedContext: ["Leadership initiative log", "Volunteer summary"],
  },
  {
    id: "vance",
    name: "Prof. E. Vance",
    requirement: "Department chair",
    institution: "Stanford Graduate School",
    status: "Confirmed",
    due: "15 Sep",
    lastContact: "Confirmed 15 Aug",
    attachedContext: ["Academic record", "Publication list"],
  },
  {
    id: "tanaka",
    name: "Dr. H. Tanaka",
    requirement: "Laboratory supervisor",
    institution: "RIKEN Institute",
    status: "Draft",
    due: "20 Sep",
    lastContact: "Not sent yet",
    attachedContext: ["Lab project draft"],
  },
];

function ReferencesCapabilityPreview() {
  const [refs, setRefs] = useState<ReferenceItem[]>(INITIAL_REFERENCES);
  const [selectedId, setSelectedId] = useState<string>("khan");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFilterBarOpen, setIsFilterBarOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleSendReminder = (refItem: ReferenceItem) => {
    setRefs((prev) =>
      prev.map((r) => {
        if (r.id !== refItem.id) return r;
        return {
          ...r,
          status: "Request sent",
          lastContact: "Reminder sent just now",
        };
      }),
    );
    setToastMessage(
      `Sent follow-up reminder to ${refItem.name} for ${refItem.requirement}!`,
    );
  };

  const filteredRefs = refs.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requirement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.institution.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      r.status.toLowerCase().replace(/\s+/g, "-") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedRef = refs.find((r) => r.id === selectedId) || filteredRefs[0];

  const confirmedCount = refs.filter((r) => r.status === "Confirmed").length;
  const sentCount = refs.filter((r) => r.status === "Request sent").length;
  const followUpCount = refs.filter((r) => r.status === "Follow-up due").length;

  return (
    <PreviewFrame title="Reference tracking">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="tracker-toast-bar"
          role="status"
          style={{ margin: "0.5rem 1.25rem" }}
        >
          <span>{toastMessage}</span>
          <button
            className="tracker-icon-btn"
            onClick={() => setToastMessage(null)}
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="preview-toolbar" style={{ margin: "0.75rem 1.25rem" }}>
        <Search size={18} aria-hidden="true" />
        <input
          type="text"
          className="tracker-search-input"
          placeholder="Search referees or requirements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search references"
        />
        {searchTerm && (
          <button
            className="tracker-icon-btn"
            onClick={() => setSearchTerm("")}
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
        <button
          className={`tracker-icon-btn ${isFilterBarOpen || statusFilter !== "all" ? "active" : ""}`}
          onClick={() => setIsFilterBarOpen((prev) => !prev)}
          title="Filter status"
        >
          <Filter size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Status Filter Chips */}
      {isFilterBarOpen && (
        <div
          className="tracker-filter-bar"
          style={{ margin: "0 1.25rem 0.75rem" }}
        >
          <span style={{ color: "var(--m-muted)", fontWeight: 600 }}>Filter:</span>
          {[
            { id: "all", label: "All" },
            { id: "confirmed", label: "Confirmed" },
            { id: "request-sent", label: "Request sent" },
            { id: "follow-up-due", label: "Follow-up due" },
            { id: "draft", label: "Draft" },
          ].map((chip) => (
            <button
              key={chip.id}
              className={`tracker-filter-chip ${statusFilter === chip.id ? "active" : ""}`}
              onClick={() => setStatusFilter(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Reference List */}
      <div className="reference-preview-list">
        {filteredRefs.length === 0 ? (
          <div
            style={{
              padding: "1.5rem",
              textAlign: "center",
              color: "var(--m-muted)",
              fontSize: "0.82rem",
            }}
          >
            No references found matching "{searchTerm}".
          </div>
        ) : (
          filteredRefs.map((item) => {
            const isSelected = selectedRef?.id === item.id;
            return (
              <div
                key={item.id}
                tabIndex={0}
                onClick={() => setSelectedId(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(item.id);
                  }
                }}
                style={{
                  cursor: "pointer",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "6px",
                  margin: "2px 0",
                  background: isSelected ? "var(--m-selected)" : "transparent",
                  borderLeft: isSelected
                    ? "3px solid var(--m-blue)"
                    : "3px solid transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.requirement} • {item.institution}
                  </small>
                </span>
                <em data-status={item.status}>{item.status}</em>
                <time>{item.due}</time>
              </div>
            );
          })
        )}
      </div>

      {/* Reference Workspace Inspector Card */}
      {selectedRef && (
        <div
          className="tracker-detail-card"
          style={{ margin: "0.5rem 1.25rem 1rem" }}
        >
          <div className="tracker-detail-header">
            <div>
              <h4>{selectedRef.name}</h4>
              <p>
                {selectedRef.requirement} •{" "}
                <strong>{selectedRef.institution}</strong> • Target Due:{" "}
                <strong>{selectedRef.due}</strong>
              </p>
            </div>
            <em data-status={selectedRef.status}>{selectedRef.status}</em>
          </div>

          <div style={{ fontSize: "0.8rem", margin: "0.5rem 0" }}>
            <p style={{ margin: "0 0 0.4rem 0", color: "var(--m-muted)" }}>
              Last activity:{" "}
              <span style={{ color: "var(--m-text-strong)", fontWeight: 600 }}>
                {selectedRef.lastContact}
              </span>
            </p>
            <strong style={{ color: "var(--m-text-strong)" }}>
              Connected context package:
            </strong>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.4rem",
                marginTop: "0.4rem",
              }}
            >
              {selectedRef.attachedContext.map((ctx) => (
                <span
                  key={ctx}
                  className="tracker-filter-chip"
                  style={{ fontSize: "0.72rem", background: "var(--m-canvas)" }}
                >
                  📄 {ctx}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "0.8rem",
              paddingTop: "0.6rem",
              borderTop: "1px solid var(--m-line-soft)",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "var(--m-muted)" }}>
              {selectedRef.status === "Confirmed"
                ? "✓ Reference is signed and uploaded confidentially."
                : selectedRef.status === "Follow-up due"
                  ? "⚠️ Overdue for follow-up message."
                  : "Request portal is active."}
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {selectedRef.status === "Follow-up due" ||
              selectedRef.status === "Request sent" ? (
                <button
                  className="tracker-action-btn"
                  style={{
                    background: "var(--m-blue)",
                    color: "#ffffff",
                    padding: "5px 10px",
                    borderRadius: "6px",
                  }}
                  onClick={() => handleSendReminder(selectedRef)}
                >
                  Send reminder <ArrowRight size={12} />
                </button>
              ) : selectedRef.status === "Draft" ? (
                <button
                  className="tracker-action-btn"
                  style={{
                    background: "var(--m-blue)",
                    color: "#ffffff",
                    padding: "5px 10px",
                    borderRadius: "6px",
                  }}
                  onClick={() => handleSendReminder(selectedRef)}
                >
                  Send request link <ArrowRight size={12} />
                </button>
              ) : (
                <button
                  className="tracker-action-btn"
                  style={{ fontSize: "0.75rem" }}
                  onClick={() =>
                    setToastMessage(
                      `Verified submission receipt for ${selectedRef.name} (Confidential).`,
                    )
                  }
                >
                  View receipt ✓
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shared Context Summary Bar */}
      <div
        className="preview-summary"
        style={{ cursor: "pointer" }}
        onClick={() =>
          setToastMessage(
            `Reference status overview: ${confirmedCount} confirmed, ${sentCount} request sent, ${followUpCount} follow-up due.`,
          )
        }
      >
        <Users aria-hidden="true" />
        <span>
          <strong>Shared context stays visible</strong>
          {confirmedCount} confirmed, {sentCount} request sent, {followUpCount} follow-up due. Prompt & deadline connected.
        </span>
      </div>
    </PreviewFrame>
  );
}

type TaskItem = {
  id: string;
  label: string;
  done: boolean;
};

type ReadinessArea = {
  id: string;
  name: string;
  status: string;
  action: string;
  tasks: TaskItem[];
};

type ApplicationReadinessData = {
  id: string;
  appName: string;
  daysToDeadline: number;
  deadlineDate: string;
  areas: ReadinessArea[];
};

const INITIAL_READINESS_APPS: ApplicationReadinessData[] = [
  {
    id: "rhodes",
    appName: "Rhodes Scholarship",
    daysToDeadline: 18,
    deadlineDate: "15 Sep",
    areas: [
      {
        id: "reqs",
        name: "Requirements coverage",
        status: "2 missing",
        action: "Review",
        tasks: [
          { id: "r1", label: "Personal statement (1,000 words)", done: true },
          { id: "r2", label: "Certified transcript", done: true },
          { id: "r3", label: "Community impact portfolio", done: false },
          { id: "r4", label: "Financial declaration", done: false },
        ],
      },
      {
        id: "evidence",
        name: "Evidence coverage",
        status: "3 need attention",
        action: "Review",
        tasks: [
          { id: "e1", label: "Peer support program metric", done: true },
          { id: "e2", label: "Faculty mentor verification letter", done: false },
          { id: "e3", label: "Community research data log", done: false },
          { id: "e4", label: "Award certificate scan", done: false },
        ],
      },
      {
        id: "writing",
        name: "Writing status",
        status: "Draft in review",
        action: "Open draft",
        tasks: [
          { id: "w1", label: "Core narrative structure", done: true },
          { id: "w2", label: "Specific outcome metric added", done: true },
          { id: "w3", label: "Proofreading & word count check", done: false },
        ],
      },
      {
        id: "refs",
        name: "Reference status",
        status: "1 follow-up due",
        action: "Follow up",
        tasks: [
          { id: "rf1", label: "Dr A. Khan (Academic)", done: true },
          { id: "rf2", label: "Prof. D. Okoro (Research)", done: true },
          { id: "rf3", label: "M. Priya Nair (Leadership)", done: false },
        ],
      },
      {
        id: "decl",
        name: "Declaration status",
        status: "Not started",
        action: "Complete",
        tasks: [
          { id: "d1", label: "Academic integrity affirmation", done: false },
          { id: "d2", label: "Final submission consent", done: false },
        ],
      },
    ],
  },
  {
    id: "fulbright",
    appName: "Fulbright Award",
    daysToDeadline: 35,
    deadlineDate: "24 Oct",
    areas: [
      {
        id: "reqs2",
        name: "Requirements coverage",
        status: "1 missing",
        action: "Review",
        tasks: [
          { id: "fr1", label: "Host institution affiliation letter", done: true },
          { id: "fr2", label: "Project statement", done: true },
          { id: "fr3", label: "Travel budget plan", done: false },
        ],
      },
      {
        id: "evidence2",
        name: "Evidence coverage",
        status: "All covered",
        action: "Verified",
        tasks: [
          { id: "fe1", label: "Language evaluation", done: true },
          { id: "fe2", label: "Publication record", done: true },
        ],
      },
      {
        id: "writing2",
        name: "Writing status",
        status: "Polished & ready",
        action: "Open draft",
        tasks: [
          { id: "fw1", label: "Final proofreading complete", done: true },
        ],
      },
      {
        id: "refs2",
        name: "Reference status",
        status: "All confirmed",
        action: "Complete",
        tasks: [
          { id: "frf1", label: "3 of 3 References confirmed", done: true },
        ],
      },
      {
        id: "decl2",
        name: "Declaration status",
        status: "Signed",
        action: "Signed",
        tasks: [
          { id: "fd1", label: "Full consent verified", done: true },
        ],
      },
    ],
  },
];

function ReadinessCapabilityPreview() {
  const [apps, setApps] = useState<ApplicationReadinessData[]>(
    INITIAL_READINESS_APPS,
  );
  const [selectedAppId, setSelectedAppId] = useState<string>("rhodes");
  const [selectedAreaId, setSelectedAreaId] = useState<string>("reqs");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const toggleTask = (appId: string, areaId: string, taskId: string) => {
    setApps((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;
        const updatedAreas = app.areas.map((area) => {
          if (area.id !== areaId) return area;
          const updatedTasks = area.tasks.map((t) =>
            t.id === taskId ? { ...t, done: !t.done } : t,
          );
          const doneCount = updatedTasks.filter((t) => t.done).length;
          const totalCount = updatedTasks.length;
          const isComplete = doneCount === totalCount;
          let newStatus = area.status;
          if (isComplete) {
            newStatus = "All complete ✓";
          } else {
            const missing = totalCount - doneCount;
            newStatus = `${missing} missing`;
          }
          return {
            ...area,
            tasks: updatedTasks,
            status: newStatus,
            action: isComplete ? "Verified ✓" : area.action.replace(" ✓", ""),
          };
        });
        return { ...app, areas: updatedAreas };
      }),
    );
  };

  const selectedApp = apps.find((a) => a.id === selectedAppId) || apps[0];

  const totalTasks = selectedApp.areas.flatMap((a) => a.tasks);
  const doneTasks = totalTasks.filter((t) => t.done);
  const readinessPct = Math.round(
    (doneTasks.length / totalTasks.length) * 100,
  );

  const selectedArea =
    selectedApp.areas.find((a) => a.id === selectedAreaId) ||
    selectedApp.areas[0];

  const handleQuickAction = (area: ReadinessArea, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAreaId(area.id);
    const incompleteTask = area.tasks.find((t) => !t.done);
    if (incompleteTask) {
      toggleTask(selectedApp.id, area.id, incompleteTask.id);
      setToastMessage(
        `Completed task: "${incompleteTask.label}" in ${area.name}`,
      );
    } else {
      setToastMessage(`All items in ${area.name} are already verified!`);
    }
  };

  return (
    <PreviewFrame title="Application readiness">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="tracker-toast-bar"
          role="status"
          style={{ margin: "0.5rem 1.25rem 0" }}
        >
          <span>{toastMessage}</span>
          <button
            className="tracker-icon-btn"
            onClick={() => setToastMessage(null)}
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Application Switcher Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          padding: "0.75rem 1.25rem 0.25rem",
          fontSize: "0.8rem",
          overflowX: "auto",
        }}
      >
        {apps.map((app) => (
          <button
            key={app.id}
            className={`tracker-filter-chip ${selectedAppId === app.id ? "active" : ""}`}
            onClick={() => setSelectedAppId(app.id)}
          >
            {app.appName}
          </button>
        ))}
      </div>

      {/* Overview Banner */}
      <div
        className="readiness-overview"
        style={{
          background: readinessPct === 100 ? "#ecfdf5" : "var(--m-pale)",
          transition: "background 0.3s ease",
        }}
      >
        <span>
          <strong
            style={{
              color: readinessPct === 100 ? "#047857" : "var(--m-blue)",
            }}
          >
            {readinessPct}%
          </strong>{" "}
          {readinessPct === 100
            ? "ready for final submission! 🎉"
            : "ready for final review"}
        </span>
        <small>
          {selectedApp.daysToDeadline} days to deadline (
          {selectedApp.deadlineDate})
        </small>
      </div>

      {/* Area Rows List */}
      <div className="readiness-list">
        {selectedApp.areas.map((row) => {
          const isAreaSelected = selectedArea?.id === row.id;
          const isComplete = row.tasks.every((t) => t.done);
          return (
            <div
              key={row.id}
              tabIndex={0}
              onClick={() => setSelectedAreaId(row.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedAreaId(row.id);
                }
              }}
              style={{
                cursor: "pointer",
                padding: "0.65rem 0.8rem",
                borderRadius: "6px",
                margin: "2px 0",
                background: isAreaSelected
                  ? "var(--m-selected)"
                  : "transparent",
                borderLeft: isAreaSelected
                  ? "3px solid var(--m-blue)"
                  : "3px solid transparent",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontWeight: isAreaSelected ? 600 : 400 }}>
                {row.name}
              </span>
              <em
                style={{
                  color: isComplete
                    ? "var(--m-success)"
                    : "var(--m-warning)",
                }}
              >
                {row.status}
              </em>
              <b
                onClick={(e) => handleQuickAction(row, e)}
                style={{ cursor: "pointer" }}
                title={`Click to resolve ${row.name}`}
              >
                {row.action}
              </b>
            </div>
          );
        })}
      </div>

      {/* Selected Readiness Area Task Inspector */}
      {selectedArea && (
        <div
          className="tracker-detail-card"
          style={{ margin: "0.5rem 1.25rem 1rem" }}
        >
          <div className="tracker-detail-header">
            <div>
              <h4>{selectedArea.name}</h4>
              <p>
                {selectedArea.tasks.filter((t) => t.done).length} of{" "}
                {selectedArea.tasks.length} items complete
              </p>
            </div>
            <em
              style={{
                color: selectedArea.tasks.every((t) => t.done)
                  ? "var(--m-success)"
                  : "var(--m-warning)",
              }}
            >
              {selectedArea.status}
            </em>
          </div>

          <div className="tracker-req-list">
            {selectedArea.tasks.map((task) => (
              <label
                key={task.id}
                className={`tracker-req-item ${task.done ? "done" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTask(selectedApp.id, selectedArea.id, task.id);
                  setToastMessage(
                    `${task.done ? "Unchecked" : "Completed"}: "${task.label}"`,
                  );
                }}
              >
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => {}}
                  style={{ accentColor: "var(--m-blue)" }}
                />
                <span>{task.label}</span>
              </label>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "0.8rem",
              paddingTop: "0.6rem",
              borderTop: "1px solid var(--m-line-soft)",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "var(--m-muted)" }}>
              Tip: Click items to toggle readiness status live!
            </span>
            <button
              className="tracker-action-btn"
              style={{
                background: "var(--m-blue)",
                color: "#ffffff",
                padding: "5px 10px",
                borderRadius: "6px",
              }}
              onClick={(e) => handleQuickAction(selectedArea, e)}
            >
              {selectedArea.action} <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      <p className="readiness-disclaimer">
        Readiness shows what is complete or missing. It does not predict an
        award decision.
      </p>
    </PreviewFrame>
  );
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

function ProductPreview() {
  const [activeView, setActiveView] = useState<HeroView>("overview");
  const [selectedApplicationId, setSelectedApplicationId] = useState("rhodes");
  const [selectedDocumentId, setSelectedDocumentId] = useState("statement");
  const activeApplication =
    heroApplications.find(({ id }) => id === selectedApplicationId) ??
    heroApplications[0];
  const activeDocument =
    heroDocuments.find(({ id }) => id === selectedDocumentId) ??
    heroDocuments[0];

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? heroViews.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + heroViews.length) %
            heroViews.length;
    setActiveView(heroViews[nextIndex].id);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [nextIndex]?.focus();
  };

  return (
    <div
      id="hero-demo"
      className="product-window"
      role="region"
      aria-label="Interactive EliteApply sample workspace"
    >
      <h2 className="sr-only">Explore a sample EliteApply workspace</h2>
      <div className="window-bar" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="product-top">
        <strong>EliteApply</strong>
        <div
          className="demo-tabs"
          role="tablist"
          aria-label="Sample workspace views"
        >
          {heroViews.map(({ id, label, Icon }, index) => (
            <button
              type="button"
              role="tab"
              id={`hero-tab-${id}`}
              aria-controls="hero-demo-panel"
              aria-selected={activeView === id}
              tabIndex={activeView === id ? 0 : -1}
              onClick={() => setActiveView(id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              key={id}
            >
              <Icon />
              {label}
            </button>
          ))}
        </div>
        <div className="demo-user" aria-label="Sample student account">
          <span>Sample workspace</span>
          <b>AV</b>
        </div>
      </div>
      <div className="product-demo-body">
        <aside
          className="demo-application-rail"
          aria-label="Sample applications"
        >
          <div className="demo-rail-heading">
            <span>Applications</span>
            <b>{heroApplications.length}</b>
          </div>
          {heroApplications.map((application) => (
            <button
              type="button"
              className={
                application.id === activeApplication.id ? "selected" : ""
              }
              aria-pressed={application.id === activeApplication.id}
              onClick={() => setSelectedApplicationId(application.id)}
              key={application.id}
            >
              <span>
                <strong>{application.university}</strong>
                <small>{application.programme}</small>
              </span>
              <i aria-hidden="true">
                <b style={{ width: `${application.progress}%` }} />
              </i>
              <em>{application.progress}%</em>
            </button>
          ))}
          <p>
            <Clock3 /> Sample data resets when you leave.
          </p>
        </aside>
        <div
          id="hero-demo-panel"
          className="hero-demo-panel"
          role="tabpanel"
          aria-labelledby={`hero-tab-${activeView}`}
          aria-live="polite"
        >
          <header className="demo-panel-header">
            <div>
              <span>{activeApplication.programme}</span>
              <strong>{activeApplication.university}</strong>
            </div>
            <p>
              <CalendarDays /> {activeApplication.deadline}
              <span>{activeApplication.remaining}</span>
            </p>
          </header>
          <div
            className="demo-view"
            key={`${activeView}-${activeApplication.id}`}
          >
            {activeView === "overview" ? (
              <HeroOverview
                application={activeApplication}
                onOpenDocuments={() => setActiveView("documents")}
              />
            ) : activeView === "applications" ? (
              <HeroApplications
                selectedId={activeApplication.id}
                onSelect={setSelectedApplicationId}
              />
            ) : (
              <HeroDocuments
                selectedId={activeDocument.id}
                onSelect={setSelectedDocumentId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroOverview({
  application,
  onOpenDocuments,
}: {
  application: (typeof heroApplications)[number];
  onOpenDocuments: () => void;
}) {
  const readiness = [
    ["Requirements", Math.min(100, application.progress + 12)],
    ["Evidence", application.progress],
    ["Writing", Math.max(24, application.progress - 16)],
    ["References", Math.max(36, application.progress - 8)],
  ] as const;

  return (
    <div className="hero-overview">
      <section className="demo-next-action">
        <div className="demo-section-heading">
          <ClipboardCheck /> Next responsible action
        </div>
        <h3>{application.nextAction}</h3>
        <p>{application.nextDetail}</p>
        <div className="demo-action-meta">
          <span>
            <Clock3 /> Due in {application.remaining}
          </span>
          <span>{application.progress}% ready</span>
        </div>
        <button type="button" onClick={onOpenDocuments}>
          Open supporting documents <ChevronRight />
        </button>
      </section>
      <section className="demo-readiness">
        <div className="demo-section-heading">Application readiness</div>
        {readiness.map(([label, value]) => (
          <div className="demo-progress-row" key={label}>
            <span>{label}</span>
            <i aria-hidden="true">
              <b style={{ width: `${value}%` }} />
            </i>
            <em>{value}%</em>
          </div>
        ))}
      </section>
      <section className="demo-stage-path">
        <div className="demo-section-heading">Application path</div>
        <ol>
          {["Plan", "Prepare", "Submit", "Follow up"].map((label, index) => (
            <li
              className={index <= application.stage ? "complete" : ""}
              key={label}
            >
              <span>{index <= application.stage ? <Check /> : index + 1}</span>
              <strong>{label}</strong>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function HeroApplications({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const selected =
    heroApplications.find(({ id }) => id === selectedId) ?? heroApplications[0];

  return (
    <div className="hero-applications-view">
      <section className="demo-application-table">
        <div className="demo-section-heading">Three active applications</div>
        {heroApplications.map((application) => (
          <button
            type="button"
            className={application.id === selectedId ? "selected" : ""}
            aria-pressed={application.id === selectedId}
            onClick={() => onSelect(application.id)}
            key={application.id}
          >
            <span>
              <strong>{application.programme}</strong>
              <small>{application.university}</small>
            </span>
            <time>{application.deadline}</time>
            <b>{application.progress}%</b>
            <ChevronRight />
          </button>
        ))}
      </section>
      <section className="demo-application-detail">
        <span>Selected application</span>
        <h3>{selected.programme}</h3>
        <p>{selected.university}</p>
        <dl>
          <div>
            <dt>Deadline</dt>
            <dd>{selected.deadline}</dd>
          </div>
          <div>
            <dt>Readiness</dt>
            <dd>{selected.progress}%</dd>
          </div>
          <div>
            <dt>Next step</dt>
            <dd>{selected.nextAction}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function HeroDocuments({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const selected =
    heroDocuments.find(({ id }) => id === selectedId) ?? heroDocuments[0];

  return (
    <div className="hero-documents-view">
      <section className="demo-document-list">
        <div className="demo-section-heading">Application documents</div>
        {heroDocuments.map((document) => (
          <button
            type="button"
            className={document.id === selectedId ? "selected" : ""}
            aria-pressed={document.id === selectedId}
            onClick={() => onSelect(document.id)}
            key={document.id}
          >
            <FileText />
            <span>
              <strong>{document.name}</strong>
              <small>{document.updated}</small>
            </span>
            <b>{document.progress}%</b>
          </button>
        ))}
      </section>
      <section className="demo-document-preview">
        <div>
          <span>{selected.status}</span>
          <small>{selected.updated}</small>
        </div>
        <h3>{selected.name}</h3>
        {selected.id === "statement" ? (
          <>
            <p className="demo-document-lead">
              Advancing equitable access through research and community.
            </p>
            <p>
              My experience has taught me to connect rigorous research with
              practical, community-led outcomes.
            </p>
            <i className="demo-copy-line long" />
            <i className="demo-copy-line" />
            <i className="demo-copy-line short" />
          </>
        ) : (
          <div className="demo-document-ready">
            <CheckCircle2 />
            <strong>Ready to use</strong>
            <span>
              This document is verified and connected to the application.
            </span>
          </div>
        )}
      </section>
    </div>
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
        aria-labelledby={`workflow-stage-tab-${activeGuide}`}
        className={`workflow-application${animated ? " workflow-animated" : ""}`}
        aria-label={`${stage.title} application workflow demonstration`}
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

function WorkflowPreview({
  step,
  animated,
}: {
  step: GuideStep;
  animated: boolean;
}) {
  const { demo } = step;

  return (
    <div
      id="workflow-preview"
      className={`workflow-window${animated ? " demo-animated" : ""}`}
      role="img"
      aria-label={`EliteApply demonstration for ${step.label}: ${demo.title}`}
    >
      <header>
        {step.number === "01" ? (
          <Search />
        ) : step.number === "02" ? (
          <Folder />
        ) : step.number === "03" ? (
          <PenLine />
        ) : (
          <ListChecks />
        )}
        <strong>{demo.title}</strong>
        <span>
          <CheckCircle2 /> {demo.status}
        </span>
      </header>
      {step.number === "01" ? (
        <DiscoveryDemo />
      ) : step.number === "02" ? (
        <EvidenceDemo />
      ) : step.number === "03" ? (
        <WritingDemo />
      ) : (
        <SubmissionDemo />
      )}
    </div>
  );
}

function DemoCheck({ muted = false }: { muted?: boolean }) {
  return (
    <span className={muted ? "demo-check muted" : "demo-check"}>
      {muted ? null : <Check aria-hidden="true" />}
    </span>
  );
}

function PercentageGauge({ value, label }: { value: number; label: string }) {
  const safeValue = Math.min(100, Math.max(0, value));
  const angle = Math.PI * (1 - safeValue / 100);
  const needleX = 60 + 36 * Math.cos(angle);
  const needleY = 66 - 36 * Math.sin(angle);

  return (
    <div className="percentage-gauge">
      <svg viewBox="0 0 120 82" aria-hidden="true">
        <path
          className="gauge-track"
          d="M 10 62 A 50 50 0 0 1 110 62"
          pathLength="100"
        />
        <path
          className="gauge-value"
          d="M 10 62 A 50 50 0 0 1 110 62"
          pathLength="100"
          strokeDasharray={`${safeValue} ${100 - safeValue}`}
        />
        <line
          className="gauge-needle"
          x1="60"
          y1="66"
          x2={needleX}
          y2={needleY}
        />
        <circle className="gauge-hub" cx="60" cy="66" r="4" />
      </svg>
      <span className="gauge-copy">
        <strong>{safeValue}%</strong>
        <small>{label}</small>
      </span>
      <span className="gauge-range" aria-hidden="true">
        <small>0</small>
        <small>100</small>
      </span>
    </div>
  );
}

function DiscoveryDemo() {
  const matches = [
    ["Rhodes Scholarship", "Oxford", "94"],
    ["Clarendon Fund", "Oxford", "88"],
    ["Excellence Scholarship", "ETH Zürich", "82"],
  ] as const;

  return (
    <div className="demo-canvas discovery-demo">
      <aside className="discovery-filters">
        <div className="demo-heading">
          <Filter /> Your priorities
        </div>
        <div className="filter-search">
          <Search /> Social policy research
        </div>
        <dl>
          <div>
            <dt>Funding</dt>
            <dd>Full award</dd>
          </div>
          <div>
            <dt>Region</dt>
            <dd>UK + Europe</dd>
          </div>
          <div>
            <dt>Start year</dt>
            <dd>2027</dd>
          </div>
        </dl>
        <span className="filter-count">4 filters applied</span>
      </aside>
      <section className="discovery-results">
        <div className="demo-heading results-heading">
          <span>Best-fit programmes</span>
          <small>Fit score</small>
        </div>
        <div className="match-list">
          {matches.map(([name, university, score], index) => (
            <article className={index === 0 ? "selected" : ""} key={name}>
              <div className="match-monogram">
                <GraduationCap />
              </div>
              <div>
                <strong>{name}</strong>
                <span>
                  <MapPin /> {university}
                </span>
                <small>Funding confirmed · Research aligned</small>
              </div>
              <b>{score}%</b>
            </article>
          ))}
        </div>
      </section>
      <aside className="match-summary">
        <PercentageGauge value={94} label="strong fit" />
        <h3>Why this leads</h3>
        <ul>
          <li>
            <DemoCheck /> Research direction
          </li>
          <li>
            <DemoCheck /> Full funding
          </li>
          <li>
            <DemoCheck /> Evidence coverage
          </li>
        </ul>
        <span className="demo-action">
          Compare shortlist <ArrowRight />
        </span>
      </aside>
    </div>
  );
}

function EvidenceDemo() {
  return (
    <div className="demo-canvas evidence-demo">
      <aside className="evidence-map">
        <div className="demo-heading">
          <BookOpen /> Evidence map
        </div>
        {[
          ["Academic work", "4", "complete"],
          ["Research", "3", "selected"],
          ["Leadership", "2", "complete"],
          ["Community impact", "3", "complete"],
        ].map(([label, count, state]) => (
          <div className={`evidence-category ${state}`} key={label}>
            <DemoCheck muted={state === "selected"} />
            <span>{label}</span>
            <b>{count}</b>
          </div>
        ))}
        <div className="coverage-meter">
          <span>Application coverage</span>
          <strong>86%</strong>
          <i>
            <b />
          </i>
        </div>
      </aside>
      <section className="evidence-detail">
        <div className="evidence-detail-top">
          <span className="evidence-kind">Research</span>
          <span className="verified-state">
            <CheckCircle2 /> Verified
          </span>
        </div>
        <h3>Community research partnership</h3>
        <p>
          Led a six-month project translating local health data into an
          accessible community briefing.
        </p>
        <blockquote>
          “The final briefing informed two new outreach sessions and reached 180
          residents.”
        </blockquote>
        <div className="evidence-facts">
          <div>
            <span>Role</span>
            <strong>Project lead</strong>
          </div>
          <div>
            <span>Outcome</span>
            <strong>180 reached</strong>
          </div>
          <div>
            <span>Evidence</span>
            <strong>2 files linked</strong>
          </div>
        </div>
        <div className="evidence-links">
          <span>
            <Link2 /> Supervisor note
          </span>
          <span>
            <FileText /> Outcome report
          </span>
        </div>
      </section>
    </div>
  );
}

function WritingDemo() {
  const requirements = [
    ["Purpose", true],
    ["Academic background", true],
    ["Research experience", false],
    ["Why this programme", false],
  ] as const;

  return (
    <div className="demo-canvas writing-demo">
      <aside className="writing-outline">
        <div className="demo-heading">
          <ClipboardCheck /> Requirements
        </div>
        {requirements.map(([label, complete]) => (
          <div key={label}>
            <DemoCheck muted={!complete} />
            <span>
              {label}
              <small>{complete ? "Covered" : "Needs evidence"}</small>
            </span>
          </div>
        ))}
      </aside>
      <section className="writing-editor">
        <div className="editor-toolbar">
          <span>H2</span>
          <b>B</b>
          <em>I</em>
          <span>☷</span>
          <span>☰</span>
        </div>
        <article>
          <h3>Advancing equitable access through research and community.</h3>
          <p>
            My path has been shaped by a commitment to bridging opportunity gaps
            through rigorous research and meaningful collaboration.
          </p>
          <span className="editor-line long" />
          <span className="editor-line" />
          <span className="editor-line short" />
          <div className="editor-comment">
            <PenLine /> Add one outcome from your community research here.
          </div>
        </article>
      </section>
      <aside className="writing-feedback">
        <div className="demo-heading">
          <Users /> Feedback
        </div>
        <div className="feedback-person">
          <span>MP</span>
          <div>
            <strong>Dr. Maya Patel</strong>
            <small>Commented just now</small>
          </div>
        </div>
        <p>“Strong opening. Connect this claim to the evidence you saved.”</p>
        <div className="feedback-link">
          <Link2 /> Community research partnership
        </div>
        <span className="demo-action">
          Resolve feedback <ArrowRight />
        </span>
      </aside>
    </div>
  );
}

function SubmissionDemo() {
  return (
    <div className="demo-canvas submission-demo">
      <section className="submission-checklist">
        <div className="demo-heading">
          <ListChecks /> Final checks
        </div>
        {[
          ["Personal statement", "1,438 / 1,500 words", true],
          ["Academic transcripts", "2 files attached", true],
          ["References", "3 confirmed", true],
          ["Declaration", "Review required", false],
        ].map(([label, detail, complete]) => (
          <div
            className={complete ? "complete" : "attention"}
            key={label as string}
          >
            <DemoCheck muted={!complete} />
            <span>
              <strong>{label}</strong>
              <small>{detail}</small>
            </span>
            <b>{complete ? "Ready" : "Review"}</b>
          </div>
        ))}
      </section>
      <aside className="submission-summary">
        <PercentageGauge value={92} label="ready" />
        <h3>One final review</h3>
        <p>Your documents and references are complete.</p>
        <div className="deadline-note">
          <CalendarDays />
          <span>
            Deadline
            <strong>18 September · 17:00</strong>
          </span>
        </div>
        <span className="demo-action primary">
          <Send /> Open final review
        </span>
      </aside>
    </div>
  );
}
