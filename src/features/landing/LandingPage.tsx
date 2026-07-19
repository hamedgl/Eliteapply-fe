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
  LockKeyhole,
  MapPin,
  Pause,
  PenLine,
  Play,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
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
    completion: 40,
    completedLabel: "2 / 5 completed",
    tasks: [
      [
        "Opportunity details",
        "Title, organisation, deadline and location",
        true,
        "Edit",
      ],
      [
        "Programme information",
        "Field of study, level, duration and mode",
        true,
        "Edit",
      ],
      [
        "Requirements capture",
        "Documents, eligibility and written materials",
        false,
        "Add requirements",
      ],
      [
        "Funding & benefits",
        "Stipend, tuition and other support",
        false,
        "Add details",
      ],
      [
        "Notes & links",
        "Official sources and personal notes",
        false,
        "Add notes",
      ],
    ],
  },
  {
    title: "Break down",
    summary: "Requirements & tasks breakdown",
    description:
      "Turn every requirement into a visible task with a clear owner and state.",
    completion: 60,
    completedLabel: "3 / 5 completed",
    tasks: [
      [
        "Eligibility criteria",
        "Academic, residency and experience rules",
        true,
        "Review",
      ],
      [
        "Required documents",
        "Transcripts, certificates and identification",
        true,
        "Review",
      ],
      [
        "Written responses",
        "Prompts, word limits and evidence needs",
        true,
        "Open plan",
      ],
      [
        "Reference requirements",
        "Referees, due dates and supporting context",
        false,
        "Add referees",
      ],
      [
        "Submission instructions",
        "Provider process and final deadline checks",
        false,
        "Add details",
      ],
    ],
  },
  {
    title: "Prepare",
    summary: "Documents, drafts & materials",
    description:
      "Prepare the writing, documents and evidence required for a complete application.",
    completion: 80,
    completedLabel: "4 / 5 completed",
    tasks: [
      [
        "Personal statement",
        "Draft connected to the application prompt",
        true,
        "Open draft",
      ],
      [
        "Academic CV",
        "Current education, research and experience",
        true,
        "Review",
      ],
      [
        "Transcripts & certificates",
        "Verified files connected to requirements",
        true,
        "View files",
      ],
      [
        "Evidence connections",
        "Examples supporting each written claim",
        true,
        "Review",
      ],
      [
        "Referee brief",
        "Relevant context for the outstanding request",
        false,
        "Prepare brief",
      ],
    ],
  },
  {
    title: "Review & submit",
    summary: "Final check & submission",
    description:
      "Resolve the remaining gaps, complete final checks and record the submission.",
    completion: 80,
    completedLabel: "4 / 5 completed",
    tasks: [
      [
        "Requirements covered",
        "Every requirement has a recorded state",
        true,
        "Review",
      ],
      [
        "Documents verified",
        "Current versions are linked and readable",
        true,
        "Review",
      ],
      [
        "References confirmed",
        "Requests and provider instructions checked",
        true,
        "Review",
      ],
      [
        "Final declarations",
        "Accuracy, consent and submission details",
        true,
        "Open checks",
      ],
      [
        "Submission record",
        "Record the provider confirmation and outcome",
        false,
        "Record submission",
      ],
    ],
  },
] as const;

const workflowProgress = [
  [100, 15, 0, 0],
  [100, 68, 12, 0],
  [100, 100, 72, 15],
  [100, 100, 100, 84],
] as const;

const workflowOverallProgress = [34, 47, 72, 96] as const;

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
    if (tourPaused || !tourVisible || reduceMotion) return;
    const timer = window.setTimeout(
      () => setActiveGuide((current) => (current + 1) % guideSteps.length),
      4800,
    );
    return () => window.clearTimeout(timer);
  }, [activeGuide, reduceMotion, tourPaused, tourVisible]);

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
          <p className="hero-category">Scholarship application workspace</p>
          <h1>Plan, write and submit stronger scholarship applications.</h1>
          <p>
            Track deadlines, organise requirements, shape personal statements,
            manage evidence and references, and always know the next step—from
            one private workspace.
          </p>
          <div className="phase-one-actions">
            <Link className="landing-button" to="/register" reloadDocument>
              Start free <ArrowRight aria-hidden="true" />
            </Link>
            <a className="landing-button secondary" href="#sample-workspace">
              Explore a sample workspace
            </a>
          </div>
          <p className="phase-one-assurance">
            <span>Free to start</span>
            <span>No credit card required</span>
            <span>Your work stays yours</span>
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
          isRunning={!tourPaused && tourVisible && !reduceMotion}
          manual={reduceMotion}
          paused={tourPaused}
          onSelect={selectGuide}
          onToggle={() => setTourPaused((paused) => !paused)}
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
  "Final checks performed under pressure",
] as const;
const withItems = [
  "Every application has a clear plan",
  "Requirements become actionable tasks",
  "Drafts stay connected to evidence",
  "References and documents remain visible",
  "Readiness is shown before submission",
  "The next responsible action is always clear",
] as const;

function ProblemOutcome() {
  return (
    <section className="problem-outcome" aria-labelledby="problem-title">
      <header className="problem-heading">
        <p className="section-context">From scattered to structured</p>
        <h2 id="problem-title">
          Turn scholarship application <span>chaos</span> into a{" "}
          <strong>clear</strong> submission plan.
        </h2>
        <p>
          EliteApply brings every detail together—so you always know what to do
          next.
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
              <h3>With EliteApply</h3>
              <p>Structured. Visible. Confident.</p>
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

function TrackerPreview() {
  const rows = [
    ["Rhodes Scholarship", "In progress", "15 Sep", "72%", "Connect evidence"],
    ["Global Futures", "Planning", "2 Oct", "38%", "Review requirements"],
    ["Research Fellowship", "Drafting", "18 Oct", "56%", "Continue statement"],
  ];
  return (
    <PreviewFrame title="Applications">
      <div className="preview-toolbar">
        <Search aria-hidden="true" />
        <span>Search applications</span>
        <Filter aria-hidden="true" />
      </div>
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
        {rows.map((row, index) => (
          <div
            className={`tracker-row ${index === 0 ? "selected" : ""}`}
            role="row"
            key={row[0]}
          >
            {row.map((cell, cellIndex) => (
              <span role="cell" key={cell}>
                {cellIndex === 3 ? (
                  <>
                    <i className="mini-progress">
                      <b style={{ width: cell }} />
                    </i>
                    {cell}
                  </>
                ) : (
                  cell
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </PreviewFrame>
  );
}

function WritingCapabilityPreview() {
  return (
    <PreviewFrame title="Personal statement">
      <div className="writing-preview-grid">
        <div className="writing-main">
          <small>Prompt</small>
          <strong>Describe a time you created positive change.</strong>
          <div className="draft-block">
            <span>Your draft</span>
            <small>432 / 750 words</small>
            <p>
              I noticed that students in my community needed clearer access to
              academic opportunities…
            </p>
          </div>
        </div>
        <aside>
          <strong>Connected evidence</strong>
          <span>
            <FileText aria-hidden="true" /> Community research project
          </span>
          <span>
            <FileText aria-hidden="true" /> Workshop outcomes
          </span>
          <div className="clarity-note">
            <PenLine aria-hidden="true" />
            <span>
              <strong>Clarity review</strong>Add one specific outcome to support
              this point.
            </span>
          </div>
        </aside>
      </div>
    </PreviewFrame>
  );
}

function DocumentsCapabilityPreview() {
  const rows = [
    ["Academic transcript", "Rhodes, Global Futures", "Ready"],
    ["Degree certificate", "Rhodes", "Ready"],
    ["Research proposal", "Research Fellowship", "Update needed"],
  ];
  return (
    <PreviewFrame title="Documents and evidence">
      <div className="document-preview-list">
        {rows.map(([name, mapped, status]) => (
          <div key={name}>
            <FileText aria-hidden="true" />
            <span>
              <strong>{name}</strong>
              <small>Mapped to {mapped}</small>
            </span>
            <em className={status === "Update needed" ? "attention" : ""}>
              {status}
            </em>
          </div>
        ))}
      </div>
      <div className="preview-summary">
        <Folder aria-hidden="true" />
        <span>
          <strong>Requirement coverage</strong>7 of 9 document requirements
          connected
        </span>
      </div>
    </PreviewFrame>
  );
}

function ReferencesCapabilityPreview() {
  const rows = [
    ["Dr A. Khan", "Academic reference", "Confirmed", "28 Aug"],
    ["Prof. D. Okoro", "Research potential", "Request sent", "2 Sep"],
    ["M. Priya Nair", "Leadership context", "Follow-up due", "5 Sep"],
  ];
  return (
    <PreviewFrame title="Reference tracking">
      <div className="reference-preview-list">
        {rows.map(([name, requirement, status, due]) => (
          <div key={name}>
            <span>
              <strong>{name}</strong>
              <small>{requirement}</small>
            </span>
            <em data-status={status}>{status}</em>
            <time>{due}</time>
          </div>
        ))}
      </div>
      <div className="preview-summary">
        <Users aria-hidden="true" />
        <span>
          <strong>Shared context stays visible</strong>Prompt, deadline and
          supporting notes remain connected.
        </span>
      </div>
    </PreviewFrame>
  );
}

function ReadinessCapabilityPreview() {
  const rows = [
    ["Requirements coverage", "2 missing", "Review"],
    ["Evidence coverage", "3 need attention", "Review"],
    ["Writing status", "Draft in review", "Open draft"],
    ["Reference status", "1 follow-up due", "Follow up"],
    ["Declaration status", "Not started", "Complete"],
  ];
  return (
    <PreviewFrame title="Application readiness">
      <div className="readiness-overview">
        <span>
          <strong>72%</strong> ready for final review
        </span>
        <small>18 days to deadline</small>
      </div>
      <div className="readiness-list">
        {rows.map(([area, state, action]) => (
          <div key={area}>
            <span>{area}</span>
            <em>{state}</em>
            <b>{action}</b>
          </div>
        ))}
      </div>
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
  ["Requirement structure", "Built for", "Partial", "Partial", "Partial"],
  ["Deadline tracking", "Built for", "Partial", "Built for", "Partial"],
  [
    "Draft and evidence connection",
    "Built for",
    "Partial",
    "Partial",
    "Partial",
  ],
  ["Reference tracking", "Built for", "Partial", "Partial", "Partial"],
  [
    "Readiness review",
    "Built for",
    "Not purpose-built",
    "Partial",
    "Not purpose-built",
  ],
  ["Reusable documents", "Built for", "Partial", "Partial", "Built for"],
  [
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
        <p className="section-context">Privacy and control</p>
        <h2>
          Your applications contain personal work. Treating them carefully is
          part of the product.
        </h2>
        <div className="trust-list">
          {trust.map(([Icon, title, copy]) => (
            <article key={title}>
              <Icon aria-hidden="true" />
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
        <header>
          <p className="section-context">Purpose-built structure</p>
          <h2>Why not use a spreadsheet or a general notes app?</h2>
          <p>
            General tools can help with parts of the process. EliteApply
            connects the parts around a scholarship application.
          </p>
        </header>
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
              {comparisonRows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, index) =>
                    index === 0 ? (
                      <th scope="row" key={cell}>
                        {cell}
                      </th>
                    ) : (
                      <td key={`${row[0]}-${cell}-${index}`}>
                        <span data-fit={cell}>{cell}</span>
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        <span>© 2026 EliteApply</span>
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
}: {
  activeGuide: number;
  animated: boolean;
  isRunning: boolean;
  manual: boolean;
  paused: boolean;
  onSelect: (index: number) => void;
  onToggle: () => void;
}) {
  const stage = workflowStageDetails[activeGuide];
  const progress = workflowProgress[activeGuide];

  return (
    <div className="guided-workflow">
      <div className="workflow-tour-meta">
        <span aria-live="polite">
          Stage {activeGuide + 1} of {guideSteps.length}
        </span>
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
      </div>
      <span
        className={`workflow-tour-progress${isRunning ? " running" : ""}`}
        aria-hidden="true"
        key={`${activeGuide}-${isRunning}`}
      >
        <i />
      </span>
      <div className="workflow-stage-rail-scroll">
        <ol className="workflow-stage-rail" aria-label="Application stages">
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
                aria-label={`Show stage ${index + 1}: ${item.title}`}
                aria-pressed={index === activeGuide}
                aria-controls="workflow-preview"
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
              <span
                style={{ transform: `scaleX(${stage.completion / 100})` }}
              />
              <small>{stage.completedLabel}</small>
            </div>
            <ul className="workflow-stage-checklist" key={stage.title}>
              {stage.tasks.map(([title, copy, done, action]) => (
                <li className={done ? "complete" : ""} key={title}>
                  <span className="workflow-task-state">
                    {done ? <Check aria-hidden="true" /> : null}
                  </span>
                  <span>
                    <strong>{title}</strong>
                    <small>{copy}</small>
                  </span>
                  <em>{action}</em>
                </li>
              ))}
            </ul>
          </section>

          <aside
            className="workflow-progress-panel"
            aria-label="Application progress"
          >
            <h3>Application progress</h3>
            <PercentageGauge
              value={workflowOverallProgress[activeGuide]}
              label="Overall progress"
            />
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
