import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileText,
  Filter,
  Folder,
  GraduationCap,
  Link2,
  ListChecks,
  Map,
  PenLine,
  Plus,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Square,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { components } from "../../generated/api/schema";
import { billingApi } from "../../lib/api/billing";
import { usePageSeo } from "../../seo/usePageSeo";
import { LegalPage } from "./LegalPage";
import { MarketingShell } from "./MarketingShell";
import {
  featurePages,
  findPageName,
  intentPages,
  pricingFaqs,
  resourceGuides,
  type FeaturePageConfig,
  type IntentPageConfig,
  type ProductProof,
  type ResourceGuide,
} from "./marketingData";

export function MarketingRoute() {
  const location = useLocation();
  const pathname =
    location.pathname === "/"
      ? "/"
      : location.pathname.replace(/\/$/, "");
  const feature = featurePages.find((page) => page.path === pathname);
  const intent = intentPages.find((page) => page.path === pathname);
  const guide = resourceGuides.find((item) => item.path === pathname);
  usePageSeo(pathname);

  let page: React.ReactNode;
  if (feature) page = <FeatureDetailPage page={feature} />;
  else if (intent) page = <IntentLandingPage page={intent} />;
  else if (guide) page = <ResourceGuidePage guide={guide} />;
  else {
    page =
      ({
        "/features": <FeaturesOverviewPage />,
        "/how-it-works": <HowItWorksPage />,
        "/for-students": <ForStudentsPage />,
        "/pricing": <PricingPage />,
        "/security": <LegalPage kind="security" />,
        "/about": <AboutPage />,
        "/contact": <LegalPage kind="contact" />,
        "/resources": <ResourcesHubPage />,
        "/privacy": <LegalPage kind="privacy" />,
        "/terms": <LegalPage kind="terms" />,
        "/accessibility": <LegalPage kind="accessibility" />,
      } as Record<string, React.ReactNode>)[pathname] ?? <MarketingNotFound />;
  }

  return <MarketingShell>{page}</MarketingShell>;
}

function Breadcrumbs({ current }: { current: string }) {
  return (
    <nav className="mkt2-breadcrumbs" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      <ChevronRight aria-hidden="true" />
      <span aria-current="page">{current}</span>
    </nav>
  );
}

function MarketingActions({ secondaryTo = "/how-it-works", secondaryLabel = "See how it works" }: { secondaryTo?: string; secondaryLabel?: string }) {
  return (
    <div className="mkt2-actions">
      <Link className="landing-button" to="/register" reloadDocument>
        Start free <ArrowRight aria-hidden="true" />
      </Link>
      <Link className="landing-button secondary" to={secondaryTo}>
        {secondaryLabel}
      </Link>
    </div>
  );
}

function FeatureDetailPage({ page }: { page: FeaturePageConfig }) {
  return (
    <>
      <section className="mkt2-detail-hero">
        <div>
          <Breadcrumbs current={page.name} />
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          <MarketingActions />
          <ul className="mkt2-hero-points" aria-label="Key capabilities">
            {page.capabilities.slice(0, 4).map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}
          </ul>
        </div>
        <ProductProofPanel type={page.proof} />
      </section>

      <section className="mkt2-narrative-band">
        <div>
          <h2>A clear view should lead to clear action.</h2>
          <p>{page.intent} without separating the deadline, requirement and supporting work that give each status meaning.</p>
        </div>
        <ol>
          {page.workflow.map(([title, copy], index) => (
            <li key={title}><span>{index + 1}</span><div><h3>{title}</h3><p>{copy}</p></div></li>
          ))}
        </ol>
      </section>

      <section className="mkt2-boundaries" aria-labelledby="boundaries-title">
        <header><h2 id="boundaries-title">What this workspace does—and where your judgement remains essential.</h2></header>
        <div><h3>Designed to help</h3><ul>{page.does.map((item) => <li key={item}><CheckCircle2 aria-hidden="true" />{item}</li>)}</ul></div>
        <div><h3>Does not claim to</h3><ul>{page.doesNot.map((item) => <li key={item}><Circle aria-hidden="true" />{item}</li>)}</ul></div>
      </section>

      <RelatedLinks title="Continue with practical guidance" paths={[...page.guidePaths, "/pricing", "/security"]} />
      <ClosingCta title="Give this application a clearer next step." />
    </>
  );
}

function IntentLandingPage({ page }: { page: IntentPageConfig }) {
  return (
    <>
      <section className="mkt2-intent-hero">
        <div>
          <Breadcrumbs current={page.name} />
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          <MarketingActions secondaryTo="#compare-intents" secondaryLabel="Compare ways to organise" />
        </div>
        <ProductProofPanel type={page.proof} />
      </section>

      <section className="mkt2-definition">
        <div><h2>What this tool is for</h2><p>{page.definition}</p></div>
        <aside><strong>Choose by the problem you need to solve.</strong><p>{page.differentiator}</p></aside>
      </section>

      <section className="mkt2-system-parts">
        <header><h2>What belongs in the system</h2><p>Keep the structure practical enough to maintain while an application is active.</p></header>
        <div>{page.systemParts.map(([title, copy]) => <article key={title}><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>

      <IntentComparison activePath={page.path} />

      <section className="mkt2-setup-steps">
        <header><h2>A practical setup sequence</h2><p>Start from the provider's current instructions and keep every status connected to real work.</p></header>
        <ol>{page.steps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol>
      </section>

      <RelatedLinks title="Choose the next useful route" paths={[...page.relatedPaths, "/security"]} />
      <ClosingCta title="Bring the application into one calm system." />
    </>
  );
}

function IntentComparison({ activePath }: { activePath: string }) {
  return (
    <section className="mkt2-intent-comparison" id="compare-intents">
      <header><h2>Tracker, organiser, deadline tracker or checklist?</h2><p>These pages target different applicant questions. Choose the view that matches the work in front of you.</p></header>
      <div className="mkt2-comparison-table" role="table" aria-label="Scholarship planning tool comparison">
        <div role="row" className="heading"><span role="columnheader">Route</span><span role="columnheader">Primary question</span><span role="columnheader">Best used for</span></div>
        {intentPages.map((page) => (
          <div role="row" key={page.path} className={page.path === activePath ? "active" : undefined}>
            <span role="cell"><Link to={page.path}>{page.name}</Link>{page.path === activePath ? <small>Current page</small> : null}</span>
            <span role="cell">{page.definition.split(":").at(-1)}</span>
            <span role="cell">{page.systemParts[0][1]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductProofPanel({ type }: { type: ProductProof }) {
  if (type === "writing") return <WritingProof />;
  if (type === "documents") return <DocumentProof />;
  if (type === "references") return <ReferenceProof />;
  if (type === "readiness" || type === "checklist") return <ReadinessProof />;
  if (type === "organiser") return <OrganiserProof />;
  if (type === "deadlines") return <DeadlineProof />;
  return <TrackerProof />;
}

function ProofFrame({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="mkt2-proof"><header><span>{icon}</span><strong>{title}</strong><small>Example workspace</small></header>{children}</div>;
}

type MktTrackerApp = {
  id: string;
  name: string;
  grantor: string;
  status: "Preparing" | "Planning";
  deadline: string;
  nextAction: string;
  requirements: { id: string; label: string; done: boolean }[];
};

const INITIAL_MKT_TRACKER_APPS: MktTrackerApp[] = [
  {
    id: "rhodes",
    name: "Rhodes Scholarship",
    grantor: "University of Oxford",
    status: "Preparing",
    deadline: "15 Sep",
    nextAction: "Finish statement",
    requirements: [
      { id: "stmt", label: "Personal statement (1,000 words)", done: true },
      { id: "trans", label: "Certified university transcript", done: true },
      { id: "ref1", label: "Academic reference 1 (Dr Khan)", done: true },
      { id: "ref2", label: "Academic reference 2 (Prof Okoro)", done: true },
      { id: "lead", label: "Leadership statement draft", done: true },
      { id: "cv", label: "Academic CV (2 pages)", done: true },
      { id: "port", label: "Community impact evidence portfolio", done: false },
      { id: "lang", label: "English language proficiency proof", done: false },
      { id: "dean", label: "Institutional endorsement letter", done: false },
    ],
  },
  {
    id: "commonwealth",
    name: "Commonwealth Scholarship",
    grantor: "Commonwealth Scholarship Commission",
    status: "Planning",
    deadline: "1 Nov",
    nextAction: "Confirm eligibility",
    requirements: [
      { id: "elig", label: "Eligibility criteria self-assessment", done: true },
      { id: "trans", label: "Degree transcript scan", done: true },
      { id: "prop", label: "Development impact proposal", done: false },
      { id: "ref", label: "2 Referee details & emails", done: false },
      { id: "budg", label: "Estimated study & travel budget", done: false },
      { id: "host", label: "UK university offer letter", done: false },
      { id: "decl", label: "Nominated country residency declaration", done: false },
    ],
  },
  {
    id: "gates",
    name: "Gates Cambridge",
    grantor: "Gates Cambridge Trust",
    status: "Preparing",
    deadline: "3 Dec",
    nextAction: "Upload transcript",
    requirements: [
      { id: "essay", label: "Gates Cambridge statement (500w)", done: true },
      { id: "ref1", label: "Academic reference letter A", done: true },
      { id: "ref2", label: "Academic reference letter B", done: true },
      { id: "prop", label: "PhD / Master's research proposal", done: true },
      { id: "trans", label: "Official university transcript", done: false },
      { id: "coll", label: "College preference list", done: false },
      { id: "fin", label: "Financial aid application form", done: false },
      { id: "samp", label: "Academic writing sample (3,000w)", done: false },
    ],
  },
];

function TrackerProof() {
  const [apps, setApps] = useState<MktTrackerApp[]>(INITIAL_MKT_TRACKER_APPS);
  const [selectedId, setSelectedId] = useState<string>("rhodes");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.grantor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.nextAction.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || app.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const selectedApp = apps.find((a) => a.id === selectedId) || apps[0];

  function toggleRequirement(appId: string, reqId: string) {
    setApps((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;
        const updatedReqs = app.requirements.map((r) =>
          r.id === reqId ? { ...r, done: !r.done } : r,
        );
        const doneCount = updatedReqs.filter((r) => r.done).length;
        setToastMessage(`Updated ${app.name} progress: ${doneCount} of ${updatedReqs.length} completed.`);
        return {
          ...app,
          requirements: updatedReqs,
        };
      }),
    );
  }

  function handleNextActionClick(app: MktTrackerApp, e: React.MouseEvent) {
    e.stopPropagation();
    const nextIncomplete = app.requirements.find((r) => !r.done);
    if (nextIncomplete) {
      toggleRequirement(app.id, nextIncomplete.id);
    } else {
      setToastMessage(`All requirements for ${app.name} are already complete! 🎉`);
    }
  }

  return (
    <ProofFrame title="My applications" icon={<GraduationCap aria-hidden="true" />}>
      {/* Search & Filter Toolbar */}
      <div className="mkt2-toolbar">
        <div className="mkt2-search-box">
          <Search aria-hidden="true" />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search applications"
          />
          {searchTerm && (
            <button
              type="button"
              className="mkt2-clear-btn"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              <X aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="mkt2-filter-chips" role="radiogroup" aria-label="Filter by status">
          {["all", "Preparing", "Planning"].map((st) => (
            <button
              key={st}
              type="button"
              className={`mkt2-chip ${statusFilter === st ? "active" : ""}`}
              onClick={() => setStatusFilter(st)}
              role="radio"
              aria-checked={statusFilter === st}
            >
              {st === "all" ? "All" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table Head */}
      <div className="mkt2-tracker-head">
        <span>Application</span>
        <span>Status</span>
        <span>Deadline</span>
        <span>Progress</span>
        <span>Next action</span>
      </div>

      {/* Table Rows */}
      {filteredApps.length === 0 ? (
        <div className="mkt2-empty-state">
          <p>No applications match "{searchTerm}".</p>
          <button type="button" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}>
            Reset filters
          </button>
        </div>
      ) : (
        filteredApps.map((app) => {
          const doneCount = app.requirements.filter((r) => r.done).length;
          const isSelected = app.id === selectedApp?.id;
          return (
            <div
              key={app.id}
              className={`mkt2-tracker-row ${isSelected ? "selected" : ""}`}
              onClick={() => setSelectedId(app.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId(app.id);
                }
              }}
              aria-selected={isSelected}
            >
              <span data-label="Application">
                <strong>{app.name}</strong>
              </span>
              <span data-label="Status">
                <span className={`mkt2-status-pill ${app.status.toLowerCase()}`}>
                  {app.status}
                </span>
              </span>
              <span data-label="Deadline">{app.deadline}</span>
              <span data-label="Progress">
                <strong>{doneCount} of {app.requirements.length}</strong>
              </span>
              <span data-label="Next action">
                <button
                  type="button"
                  className="mkt2-action-link"
                  onClick={(e) => handleNextActionClick(app, e)}
                  title={`Complete next requirement for ${app.name}`}
                >
                  {app.nextAction} <ChevronRight aria-hidden="true" />
                </button>
              </span>
            </div>
          );
        })
      )}

      {/* Selected Workspace Inspector */}
      {selectedApp && (
        <div className="mkt2-inspector">
          <div className="mkt2-inspector-head">
            <div>
              <span className="mkt2-inspector-tag">Workspace Inspector</span>
              <h4>{selectedApp.name}</h4>
              <small>{selectedApp.grantor} · Deadline: {selectedApp.deadline}</small>
            </div>
            <div className="mkt2-inspector-progress">
              <span>Progress:</span>
              <strong>
                {selectedApp.requirements.filter((r) => r.done).length} / {selectedApp.requirements.length} requirements
              </strong>
            </div>
          </div>
          <div className="mkt2-req-grid">
            {selectedApp.requirements.map((req) => (
              <label key={req.id} className={`mkt2-req-checkbox ${req.done ? "done" : ""}`}>
                <input
                  type="checkbox"
                  checked={req.done}
                  onChange={() => toggleRequirement(selectedApp.id, req.id)}
                />
                <span>{req.done ? <CheckSquare aria-hidden="true" /> : <Square aria-hidden="true" />}</span>
                <span>{req.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Live Feedback Toast */}
      {toastMessage && (
        <div className="mkt2-toast-bar" role="status" aria-live="polite">
          <CheckCircle2 aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </ProofFrame>
  );
}

type MktWritingScenario = {
  id: string;
  tabLabel: string;
  promptTitle: string;
  focus: string;
  draft: string;
  polished: string;
  evidence: { id: string; label: string; type: "link" | "file"; connected: boolean }[];
  reviewQuestion: string;
};

const WRITING_SCENARIOS: MktWritingScenario[] = [
  {
    id: "change",
    tabLabel: "Positive change",
    promptTitle: "Describe a time you created positive change.",
    focus: "Focus: initiative, evidence, reflection and learning.",
    draft:
      "I noticed a gap in access to academic guidance and worked with students and staff to build a weekly peer-led support session. Over six months, participation grew to 120 students.",
    polished:
      "Recognising a structural disparity in academic mentorship across underrepresented student cohorts, I initiated and spearheaded a peer-led academic support framework in partnership with department faculty. Within six months, the programme scaled to serve over 120 students weekly, achieving a 18% quantitative improvement in course retention metrics.",
    evidence: [
      { id: "ev1", label: "Peer-support programme outline", type: "link", connected: true },
      { id: "ev2", label: "Attendance & impact summary", type: "file", connected: true },
      { id: "ev3", label: "Faculty endorsement letter", type: "file", connected: false },
    ],
    reviewQuestion: "What tangible outcome changed because of your direct leadership?",
  },
  {
    id: "research",
    tabLabel: "Research vision",
    promptTitle: "Outline your proposed postgraduate research vision.",
    focus: "Focus: academic rigour, methodology, societal relevance.",
    draft:
      "My proposed study investigates climate adaptation strategies for coastal communities using machine learning models to forecast localized flood risks.",
    polished:
      "My proposed research integrates high-resolution spatial remote sensing with deep learning algorithms to formulate predictive flood-risk dynamics for vulnerable coastal regions. By validating model outputs against regional historical hydrology datasets, the project delivers actionable risk mapping for local municipal policy frameworks.",
    evidence: [
      { id: "ev4", label: "Undergraduate thesis abstract", type: "file", connected: true },
      { id: "ev5", label: "GIS methodology code repo", type: "link", connected: true },
      { id: "ev6", label: "Conference presentation slides", type: "file", connected: false },
    ],
    reviewQuestion: "How does your proposed methodology build on existing literature?",
  },
  {
    id: "leadership",
    tabLabel: "Public service",
    promptTitle: "How will your studies contribute to public service?",
    focus: "Focus: long-term vision, policy impact, leadership potential.",
    draft:
      "I aim to leverage my degree in public policy to reform healthcare distribution networks in underserved rural regions across my home country.",
    polished:
      "Equipped with advanced training in health economics and public policy, I intend to lead systemic reforms in primary healthcare delivery across underserved rural communities. My objective is to design data-informed policy interventions that optimize resource allocation and expand essential health services to over 2 million citizens.",
    evidence: [
      { id: "ev7", label: "Rural health clinic survey report", type: "file", connected: true },
      { id: "ev8", label: "Youth policy forum keynote speech", type: "link", connected: false },
    ],
    reviewQuestion: "What specific policy mechanism will guarantee long-term sustainability?",
  },
];

function WritingProof() {
  const [scenarios, setScenarios] = useState<MktWritingScenario[]>(WRITING_SCENARIOS);
  const [activeId, setActiveId] = useState<string>("change");
  const [customDrafts, setCustomDrafts] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<Record<string, string>>({});
  const [isPolishing, setIsPolishing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const scenario = scenarios.find((s) => s.id === activeId) || scenarios[0];
  const currentDraft = customDrafts[scenario.id] ?? scenario.draft;
  const wordCount = currentDraft.trim() ? currentDraft.trim().split(/\s+/).length : 0;
  const canUndo = history[scenario.id] !== undefined;

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  function handleDraftChange(text: string) {
    setCustomDrafts((prev) => ({ ...prev, [scenario.id]: text }));
  }

  function toggleEvidence(evidenceId: string) {
    setScenarios((prev) =>
      prev.map((sc) => {
        if (sc.id !== scenario.id) return sc;
        const updatedEv = sc.evidence.map((ev) => {
          if (ev.id !== evidenceId) return ev;
          const nextState = !ev.connected;
          setToastMessage(
            nextState
              ? `Connected "${ev.label}" to draft context!`
              : `Disconnected "${ev.label}" from draft context.`,
          );
          return { ...ev, connected: nextState };
        });
        return { ...sc, evidence: updatedEv };
      }),
    );
  }

  function handlePolish() {
    if (isPolishing) return;
    setIsPolishing(true);
    setTimeout(() => {
      setHistory((prev) => ({ ...prev, [scenario.id]: currentDraft }));
      setCustomDrafts((prev) => ({ ...prev, [scenario.id]: scenario.polished }));
      setIsPolishing(false);
      setToastMessage("AI Polish applied! Transformed draft with enhanced academic impact.");
    }, 850);
  }

  function handleUndo() {
    if (!canUndo) return;
    const prevText = history[scenario.id];
    setCustomDrafts((prev) => ({ ...prev, [scenario.id]: prevText }));
    setHistory((prev) => {
      const next = { ...prev };
      delete next[scenario.id];
      return next;
    });
    setToastMessage("Restored previous draft version.");
  }

  return (
    <ProofFrame title="Personal statement" icon={<PenLine aria-hidden="true" />}>
      <div className="mkt2-writing-tabs" role="tablist" aria-label="Statement prompts">
        {scenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === activeId}
            className={`mkt2-tab-btn ${s.id === activeId ? "active" : ""}`}
            onClick={() => setActiveId(s.id)}
          >
            {s.tabLabel}
          </button>
        ))}
      </div>

      <div className="mkt2-writing-proof">
        <section>
          <small>Prompt</small>
          <h3>{scenario.promptTitle}</h3>
          <p>{scenario.focus}</p>

          <div className="mkt2-draft">
            <div className="mkt2-draft-header">
              <strong>Your draft</strong>
              <div className="mkt2-draft-actions">
                {canUndo && (
                  <button type="button" className="mkt2-sec-btn" onClick={handleUndo} title="Undo AI polish">
                    <RotateCcw aria-hidden="true" /> Undo
                  </button>
                )}
                <button
                  type="button"
                  className="mkt2-polish-btn"
                  onClick={handlePolish}
                  disabled={isPolishing}
                >
                  <Sparkles aria-hidden="true" />
                  {isPolishing ? "Polishing..." : "Polish statement"}
                </button>
              </div>
            </div>

            <textarea
              className="mkt2-textarea"
              value={currentDraft}
              onChange={(e) => handleDraftChange(e.target.value)}
              rows={5}
              aria-label="Personal statement draft"
            />

            <div className="mkt2-draft-footer">
              <span>{wordCount} / 500 words</span>
              <small>Click evidence items to link context</small>
            </div>
          </div>
        </section>

        <aside>
          <strong>Connected Evidence ({scenario.evidence.filter((e) => e.connected).length})</strong>
          <div className="mkt2-evidence-list">
            {scenario.evidence.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`mkt2-ev-chip ${item.connected ? "connected" : ""}`}
                onClick={() => toggleEvidence(item.id)}
                title={item.connected ? "Click to disconnect" : "Click to connect"}
              >
                {item.type === "link" ? <Link2 aria-hidden="true" /> : <FileText aria-hidden="true" />}
                <span>{item.label}</span>
                <small>{item.connected ? "Connected ✓" : "+ Connect"}</small>
              </button>
            ))}
          </div>

          <div className="mkt2-review-box">
            <strong>Review question</strong>
            <p>{scenario.reviewQuestion}</p>
          </div>
        </aside>
      </div>

      {toastMessage && (
        <div className="mkt2-toast-bar" role="status" aria-live="polite">
          <CheckCircle2 aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </ProofFrame>
  );
}

type MktDocRow = {
  id: string;
  name: string;
  type: string;
  apps: string;
  status: "Ready" | "Review";
  version: string;
  size: string;
};

const INITIAL_MKT_DOCS: MktDocRow[] = [
  { id: "1", name: "Academic transcript", type: "Academic", apps: "2 applications", status: "Ready", version: "v2.1", size: "1.4 MB" },
  { id: "2", name: "Degree certificate", type: "Academic", apps: "1 application", status: "Ready", version: "v1.0", size: "850 KB" },
  { id: "3", name: "Research summary", type: "Evidence", apps: "Rhodes", status: "Review", version: "v1.2", size: "2.1 MB" },
  { id: "4", name: "Language test", type: "Certificate", apps: "2 applications", status: "Ready", version: "v1.0", size: "620 KB" },
];

function DocumentProof() {
  const [docs, setDocs] = useState<MktDocRow[]>(INITIAL_MKT_DOCS);
  const [selectedId, setSelectedId] = useState<string>("3");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const filteredDocs = docs.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.apps.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || doc.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const selectedDoc = docs.find((d) => d.id === selectedId) || docs[0];

  function toggleStatus(docId: string) {
    setDocs((prev) =>
      prev.map((doc) => {
        if (doc.id !== docId) return doc;
        const nextStatus = doc.status === "Ready" ? "Review" : "Ready";
        setToastMessage(`Updated ${doc.name} status to "${nextStatus}".`);
        return { ...doc, status: nextStatus };
      }),
    );
  }

  function handleUploadNewVersion(docId: string) {
    setDocs((prev) =>
      prev.map((doc) => {
        if (doc.id !== docId) return doc;
        const major = parseInt(doc.version.replace("v", "").split(".")[0], 10) + 1;
        const newVersion = `v${major}.0`;
        setToastMessage(`Uploaded newer version (${newVersion}) of ${doc.name}. Status set to Ready!`);
        return { ...doc, version: newVersion, status: "Ready" };
      }),
    );
  }

  return (
    <ProofFrame title="Documents and evidence" icon={<Folder aria-hidden="true" />}>
      <div className="mkt2-toolbar">
        <div className="mkt2-search-box">
          <Search aria-hidden="true" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="mkt2-filter-chips">
          {["all", "Ready", "Review"].map((st) => (
            <button
              key={st}
              type="button"
              className={`mkt2-chip ${filterStatus === st ? "active" : ""}`}
              onClick={() => setFilterStatus(st)}
            >
              {st === "all" ? `All (${docs.length})` : st}
            </button>
          ))}
        </div>
      </div>

      <div className="mkt2-document-filter">
        <span>Mapped workspace documents</span>
        <span>{filteredDocs.length} items</span>
      </div>

      {filteredDocs.map((row) => {
        const isSelected = row.id === selectedDoc?.id;
        return (
          <div
            key={row.id}
            className={`mkt2-document-row ${isSelected ? "selected" : ""}`}
            onClick={() => setSelectedId(row.id)}
            role="button"
            tabIndex={0}
            aria-selected={isSelected}
          >
            <FileText aria-hidden="true" />
            <span>
              <strong>{row.name}</strong>
              <small>{row.version} · {row.size}</small>
            </span>
            <span>{row.type}</span>
            <span>{row.apps}</span>
            <span>
              <button
                type="button"
                className={`mkt2-doc-status-btn ${row.status.toLowerCase()}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStatus(row.id);
                }}
              >
                {row.status}
              </button>
            </span>
          </div>
        );
      })}

      {selectedDoc && (
        <div className="mkt2-doc-inspector">
          <div>
            <strong>Selected: {selectedDoc.name}</strong>
            <p>Version: {selectedDoc.version} | Size: {selectedDoc.size} | Mapped to: {selectedDoc.apps}</p>
          </div>
          <div className="mkt2-doc-actions">
            <button
              type="button"
              className="mkt2-sec-btn"
              onClick={() => toggleStatus(selectedDoc.id)}
            >
              Set {selectedDoc.status === "Ready" ? "Review needed" : "Ready"}
            </button>
            <button
              type="button"
              className="mkt2-primary-btn"
              onClick={() => handleUploadNewVersion(selectedDoc.id)}
            >
              <Upload aria-hidden="true" /> Upload new version
            </button>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="mkt2-toast-bar" role="status" aria-live="polite">
          <CheckCircle2 aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </ProofFrame>
  );
}

type MktRefRow = {
  id: string;
  name: string;
  req: string;
  status: "Confirmed" | "Request sent" | "Follow-up due";
  due: string;
};

const INITIAL_MKT_REFS: MktRefRow[] = [
  { id: "1", name: "Dr Aisha Khan", req: "Academic reference", status: "Confirmed", due: "28 May" },
  { id: "2", name: "Prof Daniel Okoro", req: "Research reference", status: "Request sent", due: "2 Jun" },
  { id: "3", name: "Ms Priya Nair", req: "Professional reference", status: "Follow-up due", due: "5 Jun" },
];

function ReferenceProof() {
  const [refs, setRefs] = useState<MktRefRow[]>(INITIAL_MKT_REFS);
  const [selectedId, setSelectedId] = useState<string>("3");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const selectedRef = refs.find((r) => r.id === selectedId) || refs[0];

  function handleAction(refId: string, actionType: "reminder" | "confirm") {
    setRefs((prev) =>
      prev.map((r) => {
        if (r.id !== refId) return r;
        if (actionType === "reminder") {
          setToastMessage(`Sent reference reminder email to ${r.name}.`);
          return { ...r, status: "Request sent" };
        } else {
          setToastMessage(`Marked reference from ${r.name} as Confirmed!`);
          return { ...r, status: "Confirmed" };
        }
      }),
    );
  }

  return (
    <ProofFrame title="Reference tracking" icon={<Users aria-hidden="true" />}>
      <div className="mkt2-reference-grid heading">
        <span>Referee</span>
        <span>Requirement</span>
        <span>Status</span>
        <span>Due</span>
      </div>

      {refs.map((row) => {
        const isSelected = row.id === selectedRef?.id;
        return (
          <div
            key={row.id}
            className={`mkt2-reference-grid ${isSelected ? "selected" : ""}`}
            onClick={() => setSelectedId(row.id)}
            role="button"
            tabIndex={0}
            aria-selected={isSelected}
          >
            <span>
              <strong>{row.name}</strong>
            </span>
            <span>{row.req}</span>
            <span>
              <span className={`mkt2-ref-pill ${row.status.toLowerCase().replace(/\s+/g, "-")}`}>
                {row.status}
              </span>
            </span>
            <span>{row.due}</span>
          </div>
        );
      })}

      {selectedRef && (
        <div className="mkt2-ref-inspector">
          <div>
            <strong>Selected Referee: {selectedRef.name}</strong>
            <small>{selectedRef.req} · Target due date: {selectedRef.due}</small>
          </div>
          <div className="mkt2-ref-actions">
            {selectedRef.status !== "Confirmed" && (
              <button
                type="button"
                className="mkt2-sec-btn"
                onClick={() => handleAction(selectedRef.id, "reminder")}
              >
                <Send aria-hidden="true" /> Send reminder
              </button>
            )}
            {selectedRef.status !== "Confirmed" ? (
              <button
                type="button"
                className="mkt2-primary-btn"
                onClick={() => handleAction(selectedRef.id, "confirm")}
              >
                <CheckCircle2 aria-hidden="true" /> Mark confirmed
              </button>
            ) : (
              <span className="mkt2-confirmed-tag">✓ Receipt confirmed</span>
            )}
          </div>
        </div>
      )}

      <aside>
        Confidential final content remains outside the student view when the reference workflow requires it.
      </aside>

      {toastMessage && (
        <div className="mkt2-toast-bar" role="status" aria-live="polite">
          <CheckCircle2 aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </ProofFrame>
  );
}

type MktReadinessRow = {
  id: string;
  title: string;
  progress: string;
  actionText: string;
  resolved: boolean;
};

const INITIAL_READINESS_ROWS: MktReadinessRow[] = [
  { id: "req", title: "Requirements", progress: "7 of 9", actionText: "2 missing", resolved: false },
  { id: "evid", title: "Evidence", progress: "4 of 6", actionText: "2 to connect", resolved: false },
  { id: "writ", title: "Writing", progress: "Draft review", actionText: "1 prompt", resolved: false },
  { id: "ref", title: "References", progress: "1 of 2", actionText: "Follow up", resolved: false },
  { id: "decl", title: "Declarations", progress: "Not started", actionText: "Review later", resolved: false },
];

function ReadinessProof() {
  const [items, setItems] = useState<MktReadinessRow[]>(INITIAL_READINESS_ROWS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const resolvedCount = items.filter((i) => i.resolved).length;
  const scorePercent = Math.min(100, Math.round(72 + (resolvedCount / items.length) * 28));

  function toggleItem(id: string) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextState = !item.resolved;
        setToastMessage(
          nextState
            ? `Resolved ${item.title} items! Readiness updated to ${Math.min(100, Math.round(72 + ((resolvedCount + 1) / prev.length) * 28))}%`
            : `Re-opened ${item.title} review items.`,
        );
        return {
          ...item,
          resolved: nextState,
          progress: nextState ? "Complete ✓" : INITIAL_READINESS_ROWS.find((r) => r.id === id)!.progress,
          actionText: nextState ? "Resolved" : INITIAL_READINESS_ROWS.find((r) => r.id === id)!.actionText,
        };
      }),
    );
  }

  return (
    <ProofFrame title="Application readiness" icon={<ClipboardCheck aria-hidden="true" />}>
      <div className={`mkt2-readiness-summary ${scorePercent === 100 ? "complete" : ""}`}>
        <div>
          <strong>
            {scorePercent === 100
              ? "100% Ready for final submission! 🎉"
              : "Work still needs attention"}
          </strong>
          <div className="mkt2-progress-track">
            <div className="mkt2-progress-fill" style={{ width: `${scorePercent}%` }} />
          </div>
        </div>
        <span>{scorePercent}% ready · 18 days left</span>
      </div>

      {items.map((row) => (
        <div key={row.id} className={`mkt2-readiness-row ${row.resolved ? "resolved" : ""}`}>
          <strong>{row.title}</strong>
          <span>{row.progress}</span>
          <button
            type="button"
            className="mkt2-readiness-action"
            onClick={() => toggleItem(row.id)}
          >
            {row.actionText} {row.resolved ? "✓" : "→"}
          </button>
        </div>
      ))}

      <p className="mkt2-proof-note">
        Readiness describes recorded work. It does not predict the provider's decision.
      </p>

      {toastMessage && (
        <div className="mkt2-toast-bar" role="status" aria-live="polite">
          <CheckCircle2 aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </ProofFrame>
  );
}

type MktOrganiserApp = {
  id: string;
  name: string;
  steps: { label: string; done: boolean }[];
  actions: string[];
};

const ORGANISER_APPS: MktOrganiserApp[] = [
  {
    id: "global",
    name: "Global Excellence",
    steps: [
      { label: "Eligibility", done: true },
      { label: "Essays", done: true },
      { label: "Evidence", done: false },
      { label: "Documents", done: false },
      { label: "References", done: false },
      { label: "Final review", done: false },
    ],
    actions: ["Finish statement draft", "Upload transcript", "Request reference"],
  },
  {
    id: "rhodes",
    name: "Rhodes Scholarship",
    steps: [
      { label: "Eligibility", done: true },
      { label: "Essays", done: true },
      { label: "Evidence", done: true },
      { label: "Documents", done: true },
      { label: "References", done: false },
      { label: "Final review", done: false },
    ],
    actions: ["Send reference reminder to Prof Okoro", "Review community portfolio"],
  },
  {
    id: "chevening",
    name: "Chevening",
    steps: [
      { label: "Eligibility", done: true },
      { label: "Essays", done: false },
      { label: "Evidence", done: false },
      { label: "Documents", done: true },
      { label: "References", done: false },
      { label: "Final review", done: false },
    ],
    actions: ["Complete leadership essay draft", "Select 3 UK university choices"],
  },
];

function OrganiserProof() {
  const [apps, setApps] = useState<MktOrganiserApp[]>(ORGANISER_APPS);
  const [selectedId, setSelectedId] = useState<string>("global");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const activeApp = apps.find((a) => a.id === selectedId) || apps[0];

  function toggleStep(appId: string, index: number) {
    setApps((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;
        const newSteps = app.steps.map((st, i) => (i === index ? { ...st, done: !st.done } : st));
        setToastMessage(`Updated ${app.name} plan step "${app.steps[index].label}".`);
        return { ...app, steps: newSteps };
      }),
    );
  }

  function handleActionClick(actionText: string) {
    setToastMessage(`Action recorded: "${actionText}"`);
  }

  return (
    <ProofFrame title="One connected application" icon={<Map aria-hidden="true" />}>
      <div className="mkt2-organiser">
        <aside>
          <strong>Applications</strong>
          {apps.map((app) => (
            <button
              key={app.id}
              type="button"
              className={`mkt2-org-tab ${app.id === selectedId ? "selected" : ""}`}
              onClick={() => setSelectedId(app.id)}
            >
              {app.name}
            </button>
          ))}
        </aside>

        <section>
          <strong>Requirements plan</strong>
          {activeApp.steps.map((item, index) => (
            <div
              key={item.label}
              className={`mkt2-step-item ${item.done ? "done" : ""}`}
              onClick={() => toggleStep(activeApp.id, index)}
              role="button"
              tabIndex={0}
            >
              {item.done ? (
                <CheckCircle2 aria-hidden="true" />
              ) : (
                <Circle aria-hidden="true" />
              )}
              <span>{item.label}</span>
              <small>{item.done ? "Complete" : "In progress"}</small>
            </div>
          ))}
        </section>

        <aside>
          <strong>Next actions</strong>
          {activeApp.actions.map((act) => (
            <button
              key={act}
              type="button"
              className="mkt2-act-btn"
              onClick={() => handleActionClick(act)}
            >
              {act} <ArrowRight aria-hidden="true" />
            </button>
          ))}
        </aside>
      </div>

      {toastMessage && (
        <div className="mkt2-toast-bar" role="status" aria-live="polite">
          <CheckCircle2 aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </ProofFrame>
  );
}

type MktDeadlineTask = {
  id: string;
  title: string;
  date: string;
  done: boolean;
};

const INITIAL_DEADLINE_TASKS: MktDeadlineTask[] = [
  { id: "1", title: "Request reference", date: "20 Aug", done: true },
  { id: "2", title: "Complete evidence map", date: "27 Aug", done: true },
  { id: "3", title: "Review personal statement", date: "5 Sep", done: false },
  { id: "4", title: "Personal submission target", date: "12 Sep", done: false },
];

function DeadlineProof() {
  const [tasks, setTasks] = useState<MktDeadlineTask[]>(INITIAL_DEADLINE_TASKS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextState = !t.done;
        setToastMessage(nextState ? `Completed milestone "${t.title}"!` : `Re-opened milestone "${t.title}".`);
        return { ...t, done: nextState };
      }),
    );
  }

  const completedCount = tasks.filter((t) => t.done).length;

  return (
    <ProofFrame title="Deadline plan" icon={<CalendarDays aria-hidden="true" />}>
      <div className="mkt2-deadline">
        <header>
          <div>
            <strong>Rhodes Scholarship</strong>
            <small>{completedCount} of {tasks.length} milestones complete</small>
          </div>
          <span className="mkt2-deadline-badge">Official deadline · 15 September</span>
        </header>

        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={`mkt2-deadline-item ${task.done ? "done" : ""}`}
            onClick={() => toggleTask(task.id)}
            role="button"
            tabIndex={0}
          >
            <span className="mkt2-step-num">{task.done ? "✓" : index + 1}</span>
            <p>
              <strong>{task.title}</strong>
              <small>{task.date}</small>
            </p>
            <span className="mkt2-check-icon">
              {task.done ? <CheckCircle2 aria-hidden="true" /> : <Circle aria-hidden="true" />}
            </span>
          </div>
        ))}
      </div>

      {toastMessage && (
        <div className="mkt2-toast-bar" role="status" aria-live="polite">
          <CheckCircle2 aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </ProofFrame>
  );
}

function FeaturesOverviewPage() {
  return <><section className="mkt2-page-hero centered"><Breadcrumbs current="Features" /><h1>One workspace for the complete application process.</h1><p>Move between opportunity tracking, writing, evidence, documents, references and final review without losing the context that connects them.</p><MarketingActions /></section><section className="mkt2-feature-index">{featurePages.map((page, index) => <article key={page.path}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{page.name}</h2><p>{page.description}</p><Link to={page.path}>Explore {page.name.toLowerCase()} <ArrowRight aria-hidden="true" /></Link></div><ProductProofPanel type={page.proof} /></article>)}</section><RelatedLinks title="Build the plan around your current challenge" paths={intentPages.map((page) => page.path)} /><ClosingCta title="Start with one application and make its next step clear." /></>;
}

function HowItWorksPage() {
  const steps = [["Add the opportunity", "Capture the official link, deadline and core details."], ["Break down requirements", "Turn eligibility, essays, evidence and references into a practical plan."], ["Prepare the application", "Draft, organise documents and connect evidence without losing context."], ["Review and submit", "Resolve missing items, complete final checks and record the outcome."]];
  return <><section className="mkt2-page-hero"><div><Breadcrumbs current="How it works" /><h1>From opportunity to final check, keep the whole application connected.</h1><p>EliteApply gives every application one calm, recoverable workflow while the provider remains the authority for requirements and submission.</p><MarketingActions secondaryTo="/features" secondaryLabel="Explore features" /></div><ProductProofPanel type="organiser" /></section><section className="mkt2-process-page">{steps.map(([title, copy], index) => <article key={title}><span>{index + 1}</span><div><h2>{title}</h2><p>{copy}</p><strong>Visible output</strong><p>{["An opportunity record with a verified source and deadline.", "A requirement plan with owners, states and dependencies.", "Connected drafts, documents, evidence and reference activity.", "A review of missing work and recorded submission state."][index]}</p></div></article>)}</section><RelatedLinks title="Use the workflow for your next application" paths={["/features", "/for-students", "/resources/organise-multiple-scholarship-applications", "/pricing"]} /><ClosingCta title="Give the next application a clearer path." /></>;
}

interface StudentCaseData {
  id: string;
  number: string;
  title: string;
  shortCopy: string;
  badge: string;
  detailedCopy: string;
  capabilities: { title: string; desc: string }[];
  workspace: {
    programName: string;
    stageType: string;
    activeTabLabel: string;
    progressText: string;
    progressPercent: number;
    checklistItems: { id: string; label: string; status: "verified" | "in_progress" | "pending" }[];
    highlightBox: { label: string; value: string; detail: string };
    connectedFeatures: { name: string; path: string }[];
  };
}

const STUDENT_CASES: StudentCaseData[] = [
  {
    id: "undergraduate",
    number: "01",
    title: "Undergraduate scholarships",
    shortCopy: "Build a reliable first application system and keep unfamiliar requirements visible.",
    badge: "First-Time Applicants & Entry Grants",
    detailedCopy: "EliteApply structures entry rules, secondary school transcript validation, prerequisite checklists, and extracurricular evidence into one clear dashboard so first-time applicants never miss a mandatory document or form field.",
    capabilities: [
      {
        title: "Requirement Breakdown Checklist",
        desc: "Turns complex eligibility rules, prerequisite subject grades, and entrance test cutoffs into actionable checklist tasks.",
      },
      {
        title: "Reusable Extracurricular Evidence Vault",
        desc: "Centralises high school leadership roles, Olympiad certificates, and community volunteer hours for easy re-use across multiple university portals.",
      },
      {
        title: "Step-by-Step Readiness Verification",
        desc: "Runs pre-submission validation on transcript attachments, guardian declarations, and fee waiver records.",
      },
    ],
    workspace: {
      programName: "Trust Scholar Award 2026 — BSc Computer Science",
      stageType: "Undergraduate Entry & Merit Grant",
      activeTabLabel: "Entry & Prerequisite Checklist",
      progressText: "4 of 5 requirements verified",
      progressPercent: 80,
      checklistItems: [
        { id: "u1", label: "High School Official Transcript & Marksheets", status: "verified" },
        { id: "u2", label: "Mathematics & Physics Prerequisite Validation", status: "verified" },
        { id: "u3", label: "Community Leadership & Volunteer Record", status: "verified" },
        { id: "u4", label: "Personal Motivation Statement (500 words)", status: "in_progress" },
        { id: "u5", label: "Headteacher Recommendation Letter", status: "pending" },
      ],
      highlightBox: {
        label: "Evidence Vault Record",
        value: "3 Verified Items",
        detail: "STEM Olympiad Medal, Debate Society Captain, 120 Hrs Volunteering",
      },
      connectedFeatures: [
        { name: "Requirements", path: "/features/requirements" },
        { name: "Evidence Vault", path: "/features/evidence" },
        { name: "Readiness Check", path: "/features/readiness" },
      ],
    },
  },
  {
    id: "masters",
    number: "02",
    title: "Master's scholarships",
    shortCopy: "Coordinate programme requirements, funding essays and supporting documents.",
    badge: "Postgraduate & Full-Funding Grants",
    detailedCopy: "Manage multi-essay requirements for competitive awards like Chevening, Commonwealth, and Gates Cambridge. Connect statement drafts to academic transcripts, degree certificates, and language scores without losing version history.",
    capabilities: [
      {
        title: "Statement & Essay Workspace",
        desc: "Draft motivation letters, career impact essays, and study plans with real-time word count monitoring and AI assistance that preserves student authorship.",
      },
      {
        title: "Document Organiser with Version Control",
        desc: "Upload and organize university transcripts, degree certificates, CVs, and certified IELTS/TOEFL scorecards.",
      },
      {
        title: "Multi-Application Side-by-Side Tracker",
        desc: "Keep separate application records for different master's programmes while sharing common evidence items.",
      },
    ],
    workspace: {
      programName: "Chevening Master's Scholarship 2026",
      stageType: "Postgraduate Full-Funding Award",
      activeTabLabel: "Personal Statement & Document Vault",
      progressText: "5 of 6 areas underway",
      progressPercent: 83,
      checklistItems: [
        { id: "m1", label: "Leadership & Influence Essay (500 w)", status: "verified" },
        { id: "m2", label: "Networking & Relationship Building (500 w)", status: "verified" },
        { id: "m3", label: "Study in the UK Course Plan (500 w)", status: "in_progress" },
        { id: "m4", label: "Career Plan Essay (480 / 500 w)", status: "in_progress" },
        { id: "m5", label: "Bachelor Degree Certificate & Transcript", status: "verified" },
      ],
      highlightBox: {
        label: "Essay Word Count Monitor",
        value: "480 / 500 words",
        detail: "Draft 3 active · AI Polish verified · Authorship intact",
      },
      connectedFeatures: [
        { name: "Statement Workspace", path: "/features/writing" },
        { name: "Document Organiser", path: "/features/documents" },
        { name: "Tracker", path: "/features/tracker" },
      ],
    },
  },
  {
    id: "phd",
    number: "03",
    title: "PhD funding",
    shortCopy: "Connect research context, proposals, evidence, supervisors and academic references.",
    badge: "Doctoral Research & Fellowships",
    detailedCopy: "Doctoral applications demand rigor. EliteApply links research proposal drafts, thesis abstracts, publication histories, supervisor correspondence, and referee tracking into a unified research workspace.",
    capabilities: [
      {
        title: "Research Proposal & Abstract Workspace",
        desc: "Structure methodology drafts, literature reviews, and research impact statements in a clean, versioned essay editor.",
      },
      {
        title: "Referee Tracking & Outreach Manager",
        desc: "Monitor academic recommendation letter requests, set reminder alerts for professors, and verify submission status.",
      },
      {
        title: "Supervisor & Department Sponsorship Link",
        desc: "Record potential advisor communications, laboratory funding allocations, and departmental grant nominations.",
      },
    ],
    workspace: {
      programName: "Gates Cambridge PhD Fellowship in Engineering",
      stageType: "Doctoral Research Funding",
      activeTabLabel: "Research Proposal & Referee Pipeline",
      progressText: "Proposal linked · 2 of 2 referees confirmed",
      progressPercent: 90,
      checklistItems: [
        { id: "p1", label: "Research Proposal (2,500 words)", status: "verified" },
        { id: "p2", label: "Publication List & Abstract Portfolio", status: "verified" },
        { id: "p3", label: "Prof. H. Vance (Academic Reference)", status: "verified" },
        { id: "p4", label: "Dr. A. Chen (Department Chair Reference)", status: "verified" },
        { id: "p5", label: "Supervisor Endorsement & Lab Funding Letter", status: "in_progress" },
      ],
      highlightBox: {
        label: "Academic References",
        value: "2 / 2 Confirmed",
        detail: "Prof. H. Vance (Submitted) · Dr. A. Chen (Submitted)",
      },
      connectedFeatures: [
        { name: "Writing Workspace", path: "/features/writing" },
        { name: "Reference Tracker", path: "/features/references" },
        { name: "Organiser", path: "/features/organiser" },
      ],
    },
  },
  {
    id: "international",
    number: "04",
    title: "International scholarships",
    shortCopy: "Track deadlines, document formats, translations and time-zone context across countries.",
    badge: "Global & Cross-Border Awards",
    detailedCopy: "Navigate global cutoffs with automatic local timezone conversion. Track certified translations, apostille verifications, language requirements, and host institution acceptance letters without timezone confusion.",
    capabilities: [
      {
        title: "Global Timezone Deadline Tracker",
        desc: "Displays provider-matched deadlines converted automatically to your local time zone (e.g. 23:59 CET -> 17:59 EST) with countdown alerts.",
      },
      {
        title: "Translation & Apostille Status Organiser",
        desc: "Categorise official translations, notary seals, and degree equivalence certificates alongside original documents.",
      },
      {
        title: "Visa & Institutional Host Linkage",
        desc: "Store host university offer letters, visa declaration forms, and financial guarantee statements in one place.",
      },
    ],
    workspace: {
      programName: "DAAD EPOS International Postgraduate Scholarship",
      stageType: "Global Cross-Border Study Grant",
      activeTabLabel: "Timezone Cutoffs & Translation Vault",
      progressText: "Deadline in 14 days (Local: 23:59 UTC+1)",
      progressPercent: 75,
      checklistItems: [
        { id: "i1", label: "DAAD Application Form & Signature", status: "verified" },
        { id: "i2", label: "Certified German Translation of Degree", status: "verified" },
        { id: "i3", label: "IELTS Academic Certificate (Band 8.0)", status: "verified" },
        { id: "i4", label: "Employer Recommendation & Proof of 2 Yrs Exp", status: "in_progress" },
        { id: "i5", label: "Host University Acceptance Letter", status: "pending" },
      ],
      highlightBox: {
        label: "Strict Deadline Clock",
        value: "14 Days Remaining",
        detail: "Provider: Oct 15 23:59 CEST · Local: Oct 15 22:59 UTC+1",
      },
      connectedFeatures: [
        { name: "Deadlines & Timezone", path: "/features/deadlines" },
        { name: "Document Organiser", path: "/features/documents" },
        { name: "Readiness Review", path: "/features/readiness" },
      ],
    },
  },
  {
    id: "fellowships",
    number: "05",
    title: "Fellowships and competitive programmes",
    shortCopy: "Manage multi-stage requirements without splitting the application story across tools.",
    badge: "High-Stakes Multi-Stage Selection",
    detailedCopy: "For prestigious awards like Rhodes, Schwarzman, or Fulbright that involve written rounds, video submissions, leadership essays, and panel interviews. Track your overall readiness score across all 5 core dimensions.",
    capabilities: [
      {
        title: "Multi-Stage Selection Pipeline",
        desc: "Track progress from initial dossier submission to video introduction, panel interview prep, and final committee review.",
      },
      {
        title: "Leadership & Impact Essay Builder",
        desc: "Anchor high-stakes leadership essays directly to verified evidence records from your central vault.",
      },
      {
        title: "Unified 5-Dimension Readiness Score",
        desc: "Evaluate submission readiness across Requirements, Evidence, Writing, References, and Declarations before final submission.",
      },
    ],
    workspace: {
      programName: "Rhodes Scholarship — Global Fellowship",
      stageType: "High-Stakes Multi-Stage Fellowship",
      activeTabLabel: "Multi-Stage Pipeline & Readiness Assessment",
      progressText: "Readiness Score: 94% · Final Review Pending",
      progressPercent: 94,
      checklistItems: [
        { id: "f1", label: "Personal Statement of Purpose (1,000 words)", status: "verified" },
        { id: "f2", label: "Detailed CV / Resume of Achievements", status: "verified" },
        { id: "f3", label: "4 Character & Academic Referee Letters", status: "verified" },
        { id: "f4", label: "Institutional Nomination Certificate", status: "verified" },
        { id: "f5", label: "Video Introduction & Panel Interview Prep", status: "in_progress" },
      ],
      highlightBox: {
        label: "Overall Application Readiness",
        value: "94% Ready",
        detail: "5 of 5 dimensions clear · Final readiness check complete",
      },
      connectedFeatures: [
        { name: "Readiness Review", path: "/features/readiness" },
        { name: "Evidence Vault", path: "/features/evidence" },
        { name: "Requirements", path: "/features/requirements" },
      ],
    },
  },
];

function ForStudentsPage() {
  const [expandedId, setExpandedId] = useState<string>("undergraduate");
  const [activeCaseId, setActiveCaseId] = useState<string>("undergraduate");
  const [itemStatuses, setItemStatuses] = useState<Record<string, "verified" | "in_progress" | "pending">>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeCase = STUDENT_CASES.find((c) => c.id === activeCaseId) || STUDENT_CASES[0];

  const getItemStatus = (item: { id: string; status: "verified" | "in_progress" | "pending" }) => {
    return itemStatuses[item.id] ?? item.status;
  };

  const toggleItemStatus = (item: { id: string; label: string; status: "verified" | "in_progress" | "pending" }) => {
    const current = getItemStatus(item);
    const next = current === "verified" ? "in_progress" : current === "in_progress" ? "pending" : "verified";
    setItemStatuses((prev) => ({ ...prev, [item.id]: next }));
    const text = next === "verified" ? "Verified" : next === "in_progress" ? "In Progress" : "Pending";
    setToastMessage(`Updated "${item.label.slice(0, 32)}…" to ${text}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectCase = (caseId: string) => {
    if (expandedId === caseId) {
      setExpandedId("");
    } else {
      setExpandedId(caseId);
    }
    setActiveCaseId(caseId);
  };

  const currentItems = activeCase.workspace.checklistItems;
  const verifiedCount = currentItems.filter((it) => getItemStatus(it) === "verified").length;
  const computedPercent = Math.round((verifiedCount / currentItems.length) * 100);

  return (
    <>
      <section className="mkt2-page-hero centered">
        <Breadcrumbs current="For students" />
        <h1>Built for serious applications at every stage.</h1>
        <p>
          One flexible structure for different application types—without pretending that every provider, programme or student journey is identical.
        </p>
        <MarketingActions secondaryTo="/resources" secondaryLabel="Read applicant guides" />
      </section>

      <section className="mkt2-student-showcase-section">
        <header className="mkt2-student-showcase-header">
          <h2>Application Workspace at Every Stage</h2>
          <p>
            Click any stage to expand detailed system capabilities and interact with its connected workspace preview.
          </p>
        </header>

        <div className="mkt2-student-layout">
          {/* Left Column: Expandable Accordion */}
          <div className="mkt2-student-accordion-list">
            {STUDENT_CASES.map((caseItem) => {
              const isExpanded = expandedId === caseItem.id;
              const isActive = activeCaseId === caseItem.id;

              return (
                <article
                  key={caseItem.id}
                  className={`mkt2-case-accordion ${isExpanded ? "expanded" : ""} ${isActive ? "active" : ""}`}
                >
                  <header
                    className="mkt2-case-header"
                    onClick={() => handleSelectCase(caseItem.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-controls={`case-body-${caseItem.id}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectCase(caseItem.id);
                      }
                    }}
                  >
                    <span className="mkt2-case-num">{caseItem.number}</span>
                    <div className="mkt2-case-heading-group">
                      <div className="mkt2-case-title-row">
                        <h3>{caseItem.title}</h3>
                        <span className="mkt2-case-badge">{caseItem.badge}</span>
                      </div>
                      <p className="mkt2-case-short">{caseItem.shortCopy}</p>
                    </div>
                    <button
                      type="button"
                      className="mkt2-case-toggle-btn"
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${caseItem.title}`}
                    >
                      <ChevronDown
                        className={`mkt2-chevron ${isExpanded ? "rotated" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                  </header>

                  {isExpanded && (
                    <div id={`case-body-${caseItem.id}`} className="mkt2-case-body" role="region">
                      <p className="mkt2-case-detailed">{caseItem.detailedCopy}</p>

                      <div className="mkt2-case-capabilities">
                        <h4>System capabilities in place:</h4>
                        <ul>
                          {caseItem.capabilities.map((cap) => (
                            <li key={cap.title}>
                              <CheckCircle2 className="mkt2-cap-icon" aria-hidden="true" />
                              <div>
                                <strong>{cap.title}</strong>
                                <p>{cap.desc}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mkt2-case-footer">
                        <Link to="/features" className="mkt2-case-link">
                          Explore connected features <ChevronRight aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Right Column: Connected Interactive Application Workspace Preview */}
          <div className="mkt2-student-workspace-preview">
            <div className="mkt2-ws-card">
              <header className="mkt2-ws-header">
                <div className="mkt2-ws-badge-row">
                  <span className="mkt2-ws-live-pill">
                    <span className="mkt2-dot-pulse" aria-hidden="true" />
                    Connected Application Workspace
                  </span>
                  <span className="mkt2-ws-stage-badge">{activeCase.workspace.stageType}</span>
                </div>
                <h3>{activeCase.workspace.programName}</h3>
                <span className="mkt2-ws-active-tab">{activeCase.workspace.activeTabLabel}</span>
              </header>

              <div className="mkt2-ws-progress-block">
                <div className="mkt2-ws-progress-info">
                  <span>{activeCase.workspace.progressText}</span>
                  <strong>{computedPercent}%</strong>
                </div>
                <div className="mkt2-ws-progress-bar">
                  <div
                    className="mkt2-ws-progress-fill"
                    style={{ width: `${computedPercent}%` }}
                  />
                </div>
              </div>

              <div className="mkt2-ws-checklist-box">
                <div className="mkt2-ws-checklist-title">
                  <ListChecks aria-hidden="true" />
                  <span>Requirements & Area Checklists (Click to toggle)</span>
                </div>
                <ul className="mkt2-ws-items-list">
                  {activeCase.workspace.checklistItems.map((item) => {
                    const st = getItemStatus(item);
                    return (
                      <li
                        key={item.id}
                        className={`mkt2-ws-item status-${st}`}
                        onClick={() => toggleItemStatus(item)}
                        role="button"
                        tabIndex={0}
                        title="Click to toggle item status"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleItemStatus(item);
                          }
                        }}
                      >
                        <span className="mkt2-ws-item-icon">
                          {st === "verified" ? (
                            <CheckCircle2 className="icon-verified" aria-hidden="true" />
                          ) : st === "in_progress" ? (
                            <Clock3 className="icon-progress" aria-hidden="true" />
                          ) : (
                            <Circle className="icon-pending" aria-hidden="true" />
                          )}
                        </span>
                        <span className="mkt2-ws-item-label">{item.label}</span>
                        <span className={`mkt2-ws-status-tag tag-${st}`}>
                          {st === "verified"
                            ? "Verified"
                            : st === "in_progress"
                            ? "In Progress"
                            : "Pending"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mkt2-ws-highlight-box">
                <div className="mkt2-ws-hl-label">{activeCase.workspace.highlightBox.label}</div>
                <div className="mkt2-ws-hl-val">{activeCase.workspace.highlightBox.value}</div>
                <div className="mkt2-ws-hl-detail">{activeCase.workspace.highlightBox.detail}</div>
              </div>

              <div className="mkt2-ws-connected-footer">
                <span className="mkt2-ws-conn-label">System Modules:</span>
                <div className="mkt2-ws-chips-row">
                  {activeCase.workspace.connectedFeatures.map((feat) => (
                    <Link key={feat.name} to={feat.path} className="mkt2-ws-feature-chip">
                      {feat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {toastMessage && (
                <div className="mkt2-toast-bar" role="status" aria-live="polite">
                  <CheckCircle2 aria-hidden="true" />
                  <span>{toastMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mkt2-student-principle">
        <h2>The workspace adapts. The provider's instructions stay authoritative.</h2>
        <p>
          EliteApply helps structure the work you record. It does not standardise different scholarship rules, promise an outcome or decide what a provider will accept.
        </p>
      </section>

      <RelatedLinks
        title="Start with practical preparation"
        paths={[
          "/resources/scholarship-application-checklist",
          "/resources/scholarship-deadline-planning",
          "/security",
          "/pricing",
        ]}
      />
      <ClosingCta title="Keep every serious application easier to resume." />
    </>
  );
}

function PricingPage() {
  const [plans, setPlans] = useState<components["schemas"]["PlanOption"][] | null>(null);
  const [plansUnavailable, setPlansUnavailable] = useState(false);
  useEffect(() => {
    let active = true;
    void billingApi.plans().then((items) => {
      if (active) setPlans(items);
    }).catch(() => {
      if (active) setPlansUnavailable(true);
    });
    return () => { active = false; };
  }, []);
  const included = ["Multiple application workspaces", "Requirements and deadline tracking", "Personal statement workspace", "Document and evidence organisation", "Reference tracking", "Submission readiness review", "Data export and account deletion controls"];
  return <><section className="mkt2-pricing-hero"><Breadcrumbs current="Pricing" /><h1>Start organising your applications for free.</h1><p>Free access remains available. When paid plans are enabled, availability comes directly from EliteApply's server-owned catalogue and checkout shows the current price before payment.</p><MarketingActions secondaryTo="/features" secondaryLabel="See what is included" /></section><section className="mkt2-pricing-body"><article><header><span>Current access</span><h2>Everything currently available in EliteApply.</h2><p>Start without entering payment details.</p></header><ul>{included.map((item) => <li key={item}><CheckCircle2 aria-hidden="true" />{item}</li>)}</ul><Link className="landing-button" to="/register" reloadDocument>Start free <ArrowRight aria-hidden="true" /></Link></article><aside><h2>Paid plan availability</h2>{plansUnavailable?<p role="alert">The plan catalogue is temporarily unavailable. Free access is unaffected.</p>:plans===null?<p role="status">Checking available plans…</p>:plans.length?<><p>{plans.length} paid {plans.length===1?"option is":"options are"} currently available. Sign in to review secure checkout.</p><dl>{plans.map((plan)=><div key={plan.key}><dt>{plan.plan === "pro" ? "Pro" : "Teams"} · {plan.interval}</dt><dd>{new Intl.NumberFormat().format(plan.token_limit)} AI tokens per period</dd></div>)}</dl><Link to="/login">Sign in to billing & usage</Link></>:<p>No paid plan is currently enabled in this environment. Free access remains available.</p>}<p>Plan prices are intentionally not shown here because the current catalogue does not provide price or currency metadata.</p><Link to="/security">Review current account and data controls</Link></aside></section><FaqBlock items={pricingFaqs} /><ClosingCta title="Start with one application—no credit card required." /></>;
}

function AboutPage() {
  return <><section className="mkt2-page-hero centered"><Breadcrumbs current="About" /><h1>Scholarship applications deserve a calmer working system.</h1><p>EliteApply is built around a simple principle: make the next responsible application step clear without taking ownership away from the student.</p><MarketingActions secondaryTo="/how-it-works" secondaryLabel="See the product approach" /></section><section className="mkt2-about-story"><div><h2>Why this product exists</h2><p>Application work rarely lives in one place. Deadlines sit in calendars, requirements in browser tabs, drafts in documents, evidence in folders and reference follow-up in email. EliteApply connects those parts so a student can resume the work with context.</p><p>EliteApply is built by <strong>Executive Precision Era</strong>, the team behind <a href="https://eliteresume.net" target="_blank" rel="noopener">EliteResume</a> — a companion product that applies the same calm, evidence-led approach to CVs and résumés.</p></div><blockquote>Evidence over spectacle. Student control over automated certainty. A clear next action over manufactured urgency.</blockquote></section><section className="mkt2-about-principles">{[["Responsible clarity", "Prioritise one meaningful next action and explain the state behind it."], ["Evidence over spectacle", "Earn trust with useful examples, transparent state and honest limitations."], ["Student control", "Keep assistance editable, recoverable and subject to the student's review."], ["Academic warmth", "Use calm, readable structure without becoming cold or institutional."]].map(([title, copy]) => <article key={title}><h2>{title}</h2><p>{copy}</p></article>)}</section><RelatedLinks title="Explore the system" paths={["/features", "/for-students", "/security", "/resources"]} /><ClosingCta title="Build a calmer home for the next application." /></>;
}

function ResourcesHubPage() {
  const clusters = ["Organisation", "Writing", "Evidence and references", "International applicants"] as const;
  const featured = resourceGuides[0];
  return <><section className="mkt2-resource-hero"><div><Breadcrumbs current="Resources" /><h1>Practical guidance for stronger, better-organised applications.</h1><p>These guides are written for students and always defer to the scholarship provider's current instructions.</p></div><article><span>Featured guide</span><h2>{featured.title}</h2><p>{featured.description}</p><Link className="landing-button" to={featured.path}>Open guide <ArrowRight aria-hidden="true" /></Link></article><ProductProofPanel type="tracker" /></section><nav className="mkt2-challenge-nav" aria-label="Start with your current challenge"><strong>Start with your current challenge</strong>{clusters.map((cluster) => <a key={cluster} href={`#${cluster.toLowerCase().replaceAll(" ", "-")}`}>{cluster}<ChevronRight aria-hidden="true" /></a>)}</nav><section className="mkt2-resource-clusters">{clusters.map((cluster) => <section key={cluster} id={cluster.toLowerCase().replaceAll(" ", "-")}><header><h2>{cluster}</h2><span>{resourceGuides.filter((guide) => guide.cluster === cluster).length} practical guides</span></header><div>{resourceGuides.filter((guide) => guide.cluster === cluster).map((guide) => <article key={guide.path}><BookOpen aria-hidden="true" /><div><h3><Link to={guide.path}>{guide.title}</Link></h3><p>{guide.description}</p><Link to={guide.relatedFeature}>Related product capability <ArrowRight aria-hidden="true" /></Link></div></article>)}</div></section>)}</section><section className="mkt2-ai-note"><PenLine aria-hidden="true" /><div><h2>Use AI assistance without giving away authorship.</h2><p>Check provider rules, protect personal information, verify every claim and keep the final language under your control.</p></div><Link to="/resources/authentic-voice-ai-assistance">Read the responsible-use guide <ArrowRight aria-hidden="true" /></Link></section><ClosingCta title="Turn useful guidance into a working application plan." /></>;
}

function ResourceGuidePage({ guide }: { guide: ResourceGuide }) {
  return <><article className="mkt2-guide"><header><Breadcrumbs current={guide.title} /><Link className="mkt2-cluster-link" to={`/resources#${guide.cluster.toLowerCase().replaceAll(" ", "-")}`}>{guide.cluster}</Link><h1>{guide.title}</h1><p>{guide.description}</p></header><div className="mkt2-guide-layout"><aside><strong>Before you use this guide</strong><p>Follow the scholarship provider's current instructions when they differ from general preparation guidance.</p><Link to={guide.relatedFeature}>Open the related EliteApply capability</Link></aside><div className="mkt2-guide-body"><p className="lead">{guide.introduction}</p>{guide.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2><p>{section.body}</p><ul>{section.bullets.map((bullet) => <li key={bullet}><Check aria-hidden="true" />{bullet}</li>)}</ul></section>)}</div></div></article><RelatedLinks title="Continue reading" paths={[...guide.relatedGuides, guide.relatedFeature, "/pricing"]} /><ClosingCta title="Put the guidance beside the application itself." /></>;
}

function RelatedLinks({ title, paths }: { title: string; paths: readonly string[] }) {
  const unique = [...new Set(paths)];
  return <section className="mkt2-related"><header><h2>{title}</h2></header><nav aria-label={title}>{unique.map((path) => <Link key={path} to={path}><span>{findPageName(path)}</span><ArrowRight aria-hidden="true" /></Link>)}</nav></section>;
}

function FaqBlock({ items }: { items: readonly (readonly [string, string])[] }) {
  return <section className="mkt2-faq"><header><h2>Direct answers before you start.</h2></header><div>{items.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<ChevronRight aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>;
}

function ClosingCta({ title }: { title: string }) {
  return <section className="mkt2-closing"><div><h2>{title}</h2><p>Start free, organise the real requirements and keep the next responsible action visible.</p></div><MarketingActions secondaryTo="/features" secondaryLabel="Explore features" /><small>No credit card required</small></section>;
}

function MarketingNotFound() {
  return <section className="mkt2-page-hero centered"><Breadcrumbs current="Page not found" /><h1>This page is not part of the application plan.</h1><p>The route may have changed. Return to the public feature overview or resource hub.</p><div className="mkt2-actions"><Link className="landing-button" to="/features">Explore features</Link><Link className="landing-button secondary" to="/resources">Open resources</Link></div></section>;
}

export function MarketingNotFoundPage() {
  usePageSeo("/404");
  return <MarketingShell><MarketingNotFound /></MarketingShell>;
}
