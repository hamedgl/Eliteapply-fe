import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Clock3,
  FileText,
  Folder,
  GraduationCap,
  Link2,
  ListChecks,
  Map,
  PenLine,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
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

const applications = [
  ["Rhodes Scholarship", "Preparing", "15 Sep", "6 of 9", "Finish statement"],
  ["Commonwealth Scholarship", "Planning", "1 Nov", "2 of 7", "Confirm eligibility"],
  ["Gates Cambridge", "Preparing", "3 Dec", "4 of 8", "Upload transcript"],
] as const;

function ProofFrame({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="mkt2-proof"><header><span>{icon}</span><strong>{title}</strong><small>Example workspace</small></header>{children}</div>;
}

function TrackerProof() {
  return <ProofFrame title="My applications" icon={<GraduationCap aria-hidden="true" />}><div className="mkt2-tracker-head"><span>Application</span><span>Status</span><span>Deadline</span><span>Progress</span><span>Next action</span></div>{applications.map((row) => <div className="mkt2-tracker-row" key={row[0]}>{row.map((cell, index) => <span key={cell} data-label={["Application", "Status", "Deadline", "Progress", "Next action"][index]}>{cell}</span>)}</div>)}</ProofFrame>;
}

function WritingProof() {
  return <ProofFrame title="Personal statement" icon={<PenLine aria-hidden="true" />}><div className="mkt2-writing-proof"><section><small>Prompt</small><h3>Describe a time you created positive change.</h3><p>Focus: initiative, evidence, reflection and learning.</p><div className="mkt2-draft"><strong>Your draft</strong><p>I noticed a gap in access to academic guidance and worked with students and staff to build a weekly peer-led support session…</p><span>146 / 500 words</span></div></section><aside><strong>Evidence</strong><p><Link2 aria-hidden="true" /> Peer-support programme outline</p><p><FileText aria-hidden="true" /> Attendance summary</p><strong>Review question</strong><p>What changed because of your action?</p></aside></div></ProofFrame>;
}

function DocumentProof() {
  const rows = [["Academic transcript", "Academic", "2 applications", "Ready"], ["Degree certificate", "Academic", "1 application", "Ready"], ["Research summary", "Evidence", "Rhodes", "Review"], ["Language test", "Certificate", "2 applications", "Ready"]];
  return <ProofFrame title="Documents and evidence" icon={<Folder aria-hidden="true" />}><div className="mkt2-document-filter">All documents <span>4 items</span></div>{rows.map((row) => <div className="mkt2-document-row" key={row[0]}><FileText aria-hidden="true" />{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}</ProofFrame>;
}

function ReferenceProof() {
  const rows = [["Dr Aisha Khan", "Academic reference", "Confirmed", "28 May"], ["Prof Daniel Okoro", "Research reference", "Request sent", "2 Jun"], ["Ms Priya Nair", "Professional reference", "Follow-up due", "5 Jun"]];
  return <ProofFrame title="Reference tracking" icon={<Users aria-hidden="true" />}><div className="mkt2-reference-grid heading"><span>Referee</span><span>Requirement</span><span>Status</span><span>Due</span></div>{rows.map((row) => <div className="mkt2-reference-grid" key={row[0]}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}<aside>Confidential final content remains outside the student view when the reference workflow requires it.</aside></ProofFrame>;
}

function ReadinessProof() {
  const rows = [["Requirements", "7 of 9", "2 missing"], ["Evidence", "4 of 6", "2 to connect"], ["Writing", "Draft review", "1 prompt"], ["References", "1 of 2", "Follow up"], ["Declarations", "Not started", "Review later"]];
  return <ProofFrame title="Application readiness" icon={<ClipboardCheck aria-hidden="true" />}><div className="mkt2-readiness-summary"><strong>Work still needs attention</strong><span>18 days to deadline</span></div>{rows.map((row) => <div className="mkt2-readiness-row" key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><Link to="/register">{row[2]}</Link></div>)}<p className="mkt2-proof-note">Readiness describes recorded work. It does not predict the provider's decision.</p></ProofFrame>;
}

function OrganiserProof() {
  return <ProofFrame title="One connected application" icon={<Map aria-hidden="true" />}><div className="mkt2-organiser"><aside><strong>Applications</strong><span className="selected">Global Excellence</span><span>Rhodes Scholarship</span><span>Chevening</span></aside><section><strong>Requirements plan</strong>{["Eligibility", "Essays", "Evidence", "Documents", "References", "Final review"].map((item, index) => <p key={item}>{index < 2 ? <CheckCircle2 aria-hidden="true" /> : <Circle aria-hidden="true" />}{item}<small>{index < 2 ? "Complete" : "In progress"}</small></p>)}</section><aside><strong>Next actions</strong><p>Finish statement draft</p><p>Upload transcript</p><p>Request reference</p></aside></div></ProofFrame>;
}

function DeadlineProof() {
  return <ProofFrame title="Deadline plan" icon={<CalendarDays aria-hidden="true" />}><div className="mkt2-deadline"><header><strong>Rhodes Scholarship</strong><span>Official deadline · 15 September</span></header>{[["Request reference", "20 Aug"], ["Complete evidence map", "27 Aug"], ["Review personal statement", "5 Sep"], ["Personal submission target", "12 Sep"]].map(([task, date], index) => <div key={task}><span>{index + 1}</span><p><strong>{task}</strong><small>{date}</small></p></div>)}</div></ProofFrame>;
}

function FeaturesOverviewPage() {
  return <><section className="mkt2-page-hero centered"><Breadcrumbs current="Features" /><h1>One workspace for the complete application process.</h1><p>Move between opportunity tracking, writing, evidence, documents, references and final review without losing the context that connects them.</p><MarketingActions /></section><section className="mkt2-feature-index">{featurePages.map((page, index) => <article key={page.path}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{page.name}</h2><p>{page.description}</p><Link to={page.path}>Explore {page.name.toLowerCase()} <ArrowRight aria-hidden="true" /></Link></div><ProductProofPanel type={page.proof} /></article>)}</section><RelatedLinks title="Build the plan around your current challenge" paths={intentPages.map((page) => page.path)} /><ClosingCta title="Start with one application and make its next step clear." /></>;
}

function HowItWorksPage() {
  const steps = [["Add the opportunity", "Capture the official link, deadline and core details."], ["Break down requirements", "Turn eligibility, essays, evidence and references into a practical plan."], ["Prepare the application", "Draft, organise documents and connect evidence without losing context."], ["Review and submit", "Resolve missing items, complete final checks and record the outcome."]];
  return <><section className="mkt2-page-hero"><div><Breadcrumbs current="How it works" /><h1>From opportunity to final check, keep the whole application connected.</h1><p>EliteApply gives every application one calm, recoverable workflow while the provider remains the authority for requirements and submission.</p><MarketingActions secondaryTo="/features" secondaryLabel="Explore features" /></div><ProductProofPanel type="organiser" /></section><section className="mkt2-process-page">{steps.map(([title, copy], index) => <article key={title}><span>{index + 1}</span><div><h2>{title}</h2><p>{copy}</p><strong>Visible output</strong><p>{["An opportunity record with a verified source and deadline.", "A requirement plan with owners, states and dependencies.", "Connected drafts, documents, evidence and reference activity.", "A review of missing work and recorded submission state."][index]}</p></div></article>)}</section><RelatedLinks title="Use the workflow for your next application" paths={["/features", "/for-students", "/resources/organise-multiple-scholarship-applications", "/pricing"]} /><ClosingCta title="Give the next application a clearer path." /></>;
}

function ForStudentsPage() {
  const cases = [["Undergraduate scholarships", "Build a reliable first application system and keep unfamiliar requirements visible."], ["Master's scholarships", "Coordinate programme requirements, funding essays and supporting documents."], ["PhD funding", "Connect research context, proposals, evidence, supervisors and academic references."], ["International scholarships", "Track deadlines, document formats, translations and time-zone context across countries."], ["Fellowships and competitive programmes", "Manage multi-stage requirements without splitting the application story across tools."]];
  return <><section className="mkt2-page-hero centered"><Breadcrumbs current="For students" /><h1>Built for serious applications at every stage.</h1><p>One flexible structure for different application types—without pretending that every provider, programme or student journey is identical.</p><MarketingActions secondaryTo="/resources" secondaryLabel="Read applicant guides" /></section><section className="mkt2-student-cases">{cases.map(([title, copy], index) => <article key={title}><span>{index + 1}</span><div><h2>{title}</h2><p>{copy}</p></div><Link to="/features">See the connected workflow <ChevronRight aria-hidden="true" /></Link></article>)}</section><section className="mkt2-student-principle"><h2>The workspace adapts. The provider's instructions stay authoritative.</h2><p>EliteApply helps structure the work you record. It does not standardise different scholarship rules, promise an outcome or decide what a provider will accept.</p></section><RelatedLinks title="Start with practical preparation" paths={["/resources/scholarship-application-checklist", "/resources/scholarship-deadline-planning", "/security", "/pricing"]} /><ClosingCta title="Keep every serious application easier to resume." /></>;
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
  return <><section className="mkt2-page-hero centered"><Breadcrumbs current="About" /><h1>Scholarship applications deserve a calmer working system.</h1><p>EliteApply is built around a simple principle: make the next responsible application step clear without taking ownership away from the student.</p><MarketingActions secondaryTo="/how-it-works" secondaryLabel="See the product approach" /></section><section className="mkt2-about-story"><div><h2>Why this product exists</h2><p>Application work rarely lives in one place. Deadlines sit in calendars, requirements in browser tabs, drafts in documents, evidence in folders and reference follow-up in email. EliteApply connects those parts so a student can resume the work with context.</p></div><blockquote>Evidence over spectacle. Student control over automated certainty. A clear next action over manufactured urgency.</blockquote></section><section className="mkt2-about-principles">{[["Responsible clarity", "Prioritise one meaningful next action and explain the state behind it."], ["Evidence over spectacle", "Earn trust with useful examples, transparent state and honest limitations."], ["Student control", "Keep assistance editable, recoverable and subject to the student's review."], ["Academic warmth", "Use calm, readable structure without becoming cold or institutional."]].map(([title, copy]) => <article key={title}><h2>{title}</h2><p>{copy}</p></article>)}</section><RelatedLinks title="Explore the system" paths={["/features", "/for-students", "/security", "/resources"]} /><ClosingCta title="Build a calmer home for the next application." /></>;
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
