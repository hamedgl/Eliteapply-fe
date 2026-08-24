import {
  ArrowRight,
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
  MapPin,
  Pause,
  PenLine,
  Play,
  Search,
  Send,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageSeo } from "../../seo/usePageSeo";
import { MarketingShell } from "../marketing/MarketingShell";
import { guideSteps, type GuideStep, PercentageGauge } from "./landingShared";


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
    "Track requests, due dates and follow-up from one workspace.",
  ],
] as const;


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
                    // Without this the accessible name is the number plus the
                    // whole description sentence — a paragraph-long button name.
                    aria-label={`Show stage ${index + 1}: ${step.label}`}
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

