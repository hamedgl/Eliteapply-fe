import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  Filter,
  Folder,
  GraduationCap,
  Link2,
  ListChecks,
  LayoutDashboard,
  LockKeyhole,
  MapPin,
  Menu,
  Pause,
  PenLine,
  Play,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const guideSteps = [
  {
    number: "01",
    label: "Find your focus",
    description:
      "Compare academic fit, funding, location, and deadlines before you commit your energy.",
    demo: {
      title: "Programme Shortlist",
      status: "3 strong matches",
    },
  },
  {
    number: "02",
    label: "Build your evidence",
    description:
      "Collect credible examples once, then connect them to every application that needs them.",
    demo: {
      title: "Evidence Library",
      status: "12 items organised",
    },
  },
  {
    number: "03",
    label: "Shape your application",
    description:
      "Bring requirements, drafts, feedback, and deadlines together without losing the thread.",
    demo: {
      title: "Personal Statement Draft",
      status: "Saved just now",
    },
  },
  {
    number: "04",
    label: "Submit with clarity",
    description:
      "Review every requirement, resolve the final gaps, and submit from a calm, complete checklist.",
    demo: {
      title: "Submission Review",
      status: "Ready for final review",
    },
  },
] as const;
type GuideStep = (typeof guideSteps)[number];

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

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeGuide, setActiveGuide] = useState(2);
  const [tourPaused, setTourPaused] = useState(false);
  const [tourVisible, setTourVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const guidedRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLElement>("a")?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      requestAnimationFrame(() => menuButtonRef.current?.focus());
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

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
    <main className="marketing">
      <a className="skip-link" href="#for-students">
        Skip to main content
      </a>
      <header className="marketing-header">
        <Link className="marketing-brand" to="/" aria-label="EliteApply home">
          <span className="brand-mark" aria-hidden="true">
            E
          </span>
          EliteApply
        </Link>
        <nav
          id="marketing-navigation"
          ref={menuRef}
          className={menuOpen ? "marketing-nav open" : "marketing-nav"}
          aria-label="Main navigation"
        >
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <a href="#workspace" onClick={() => setMenuOpen(false)}>
            Workspace
          </a>
          <a href="#for-students" onClick={() => setMenuOpen(false)}>
            For students
          </a>
          <Link className="nav-signin" to="/login" reloadDocument>
            Sign in
          </Link>
          <Link className="landing-button small" to="/register" reloadDocument>
            Start your workspace
          </Link>
        </nav>
        <button
          ref={menuButtonRef}
          className="nav-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-controls="marketing-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <section className="hero" id="for-students" tabIndex={-1}>
        <div className="hero-copy">
          <h1>
            Build stronger scholarship applications in one calm workspace.
          </h1>
          <p>
            Track deadlines, connect evidence, shape documents, and coordinate
            references—while staying in control of every decision.
          </p>
          <div className="hero-actions">
            <Link className="landing-button" to="/register" reloadDocument>
              Start your workspace <ArrowRight />
            </Link>
            <a className="guide-link" href="#hero-demo">
              Explore the sample workspace <ArrowRight />
            </a>
          </div>
          <p className="hero-assurance">
            Built for responsible planning—not application guarantees.
          </p>
        </div>
        <ProductPreview />
      </section>

      <section ref={guidedRef} className="guided" id="how-it-works">
        <div className="guide-intro">
          <h2>A guide that moves with you.</h2>
          <p>
            EliteApply turns a complex application into a sequence of clear,
            responsible steps.
          </p>
          <div className="tour-meta">
            <span aria-live="polite">
              Step {activeGuide + 1} of {guideSteps.length}
            </span>
            {reduceMotion ? (
              <span>Manual tour</span>
            ) : (
              <button
                type="button"
                className="tour-toggle"
                onClick={() => setTourPaused((paused) => !paused)}
                aria-label={
                  tourPaused ? "Play product tour" : "Pause product tour"
                }
              >
                {tourPaused ? <Play /> : <Pause />}
                {tourPaused ? "Play" : "Pause"}
              </button>
            )}
          </div>
          <span
            className={`tour-progress ${!tourPaused && tourVisible && !reduceMotion ? "running" : ""}`}
            aria-hidden="true"
            key={`${activeGuide}-${tourPaused}-${tourVisible}`}
          >
            <i />
          </span>
          <ol className="guide-steps" aria-label="EliteApply guided workflow">
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
                  onClick={() => selectGuide(index)}
                >
                  <span className="guide-step-number">{step.number}</span>
                  <strong>{step.label}</strong>
                  {index === activeGuide ? <p>{step.description}</p> : null}
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
      </section>

      <section className="principles" id="workspace">
        <h2>
          Built for the <em>whole application,</em> not just the deadline.
        </h2>
        <div className="principle-grid">
          <article>
            <Folder />
            <div>
              <h3>One source of truth</h3>
              <p>
                Keep programmes, requirements, drafts, and decisions connected.
              </p>
            </div>
          </article>
          <article>
            <LockKeyhole />
            <div>
              <h3>Your work stays yours</h3>
              <p>Stay in control of sensitive documents and evidence.</p>
            </div>
          </article>
          <article>
            <ClipboardCheck />
            <div>
              <h3>A clear next action</h3>
              <p>Know what matters now, and what can wait.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="closing">
        <div>
          <h2>Make space for your best application.</h2>
          <p>Start with one programme. Build a system you can trust.</p>
          <div className="closing-actions">
            <Link className="landing-button" to="/register" reloadDocument>
              Start your workspace <ArrowRight />
            </Link>
            <Link to="/login" reloadDocument>
              Sign in
            </Link>
          </div>
        </div>
        <div className="closing-path" aria-hidden="true">
          <i />
          <span>✦</span>
          <b />
        </div>
      </section>

      <footer className="marketing-footer">
        <Link className="marketing-brand" to="/">
          EliteApply
        </Link>
        <nav aria-label="Legal">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/accessibility">Accessibility</Link>
        </nav>
      </footer>
    </main>
  );
}

function ProductPreview() {
  const [activeView, setActiveView] = useState<HeroView>("overview");
  const [selectedApplicationId, setSelectedApplicationId] =
    useState("stanford");
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
