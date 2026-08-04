import { ArrowRight, Check, ChevronRight, Circle, Download, Eye, ShieldCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  CtaPreview,
  EvidenceFragment,
  HeroComposition,
  ReadinessFragment,
  ReferenceFragment,
  RequirementsFragment,
} from "./AboutVisuals";

const PRINCIPLES = [
  ["01", "Show the state honestly", "Progress should reflect completed work, missing requirements and known follow-ups—not a prediction of selection success."],
  ["02", "Explain the next step", "Guidance should make the process easier to understand, not create pressure or artificial urgency."],
  ["03", "Keep the student in control", "Writing, edits, evidence and final decisions remain reviewable, reversible and owned by the student."],
] as const;

const IMPLEMENTATIONS = [
  {
    title: "Requirements become visible work",
    copy: "Application criteria are broken into understandable requirements and tasks, helping students see what has been captured and what remains unresolved.",
    visual: <RequirementsFragment />,
  },
  {
    title: "Writing begins with evidence",
    copy: "Students can connect experiences, outcomes and supporting material to a prompt before shaping a final response.",
    visual: <EvidenceFragment />,
  },
  {
    title: "Readiness is not a prediction",
    copy: "The readiness review shows coverage, missing materials and follow-ups. It must never imply that an award decision can be predicted.",
    visual: <ReadinessFragment />,
  },
  {
    title: "References stay organised and respectful",
    copy: "Students can track requests, deadlines and follow-up status without presenting confidential reference content as something they control.",
    visual: <ReferenceFragment />,
  },
] as const;

const STANDARDS = [
  ["01", "Responsible clarity", "Prioritise one meaningful next action and explain the state behind it.", "Every application view leads with the next unresolved requirement rather than a score."],
  ["02", "Evidence over spectacle", "Earn trust through useful examples, transparent states and honest limitations.", "Progress reflects recorded work, and limitations are written into the interface itself."],
  ["03", "Student control", "Keep assistance editable, reversible and subject to the student's review.", "Suggestions arrive as editable text with earlier drafts kept and recoverable."],
  ["04", "Academic warmth", "Use calm, readable structure without making the experience cold or institutional.", "Readable typography, no countdown pressure and no manufactured urgency."],
] as const;

const CONTEXTS = [
  ["Undergraduate scholarships", "Track entry criteria, school transcripts, prerequisite grades and unfamiliar form requirements while learning how the process works."],
  ["Master's funding", "Coordinate programme requirements, funding essays, academic documents and reference deadlines without separating them into different systems."],
  ["PhD funding", "Hold a research proposal, supervisor correspondence, funding criteria and departmental deadlines together as one evolving application."],
  ["International scholarships", "Keep country eligibility rules, certified translations, language evidence and additional documentation visible beside the main application."],
  ["Fellowships and competitive programmes", "Manage staged assessments, written tasks, interview preparation and referee availability across a longer selection timeline."],
] as const;

const AI_CAN = [
  "structuring ideas",
  "reviewing clarity",
  "identifying unsupported claims",
  "connecting relevant evidence",
  "preparing questions for revision",
] as const;

const AI_SHOULD_NOT = [
  "invent achievements",
  "impersonate the student",
  "guarantee selection outcomes",
  "create false certainty",
  "submit work without review",
] as const;

const COMMITMENTS = [
  ["Private workspace", "Application content remains inside an authenticated account workspace."],
  ["Practical controls", "Students can download or delete documents, export their data and request account deletion."],
  ["Transparent assistance", "Guidance should state its limits and never disguise a suggestion as a guaranteed answer."],
] as const;

const STATUS_LABELS = ["Early access", "Free to start", "No credit card required", "Feedback shapes the product"] as const;

const SYSTEM_MAP = [
  ["Opportunity", "Available"],
  ["Requirements", "Available"],
  ["Tasks", "Available"],
  ["Writing", "Available"],
  ["Evidence", "Available"],
  ["Documents", "Available"],
  ["References", "Available"],
  ["Interview preparation", "Available"],
  ["Final review", "Available"],
  ["Evidence carried between applications", "In development"],
  ["A longer application history across study stages", "Exploring"],
] as const;

/** Adds a restrained fade-and-lift on first view. Applied by script so the page
 *  renders complete when JavaScript, IntersectionObserver or motion is unavailable. */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    targets.forEach((element) => element.classList.add("abt-hidden"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove("abt-hidden");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );
    targets.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  return ref;
}

export function AboutPage() {
  const ref = useScrollReveal();

  return (
    <div className="abt" ref={ref}>
      <section className="abt-hero">
        <div className="abt-hero-copy">
          <nav className="mkt2-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <ChevronRight aria-hidden="true" />
            <span aria-current="page">About</span>
          </nav>
          <p className="abt-eyebrow">About EliteApply</p>
          <h1>A better application process should still feel like yours.</h1>
          <p className="abt-lead">
            EliteApply brings deadlines, requirements, writing, evidence, documents and references into one calm
            workspace—so students can move forward with clarity without giving up control of their work.
          </p>
          <div className="abt-actions">
            <Link className="landing-button" to="/features">
              Explore the product <ArrowRight aria-hidden="true" />
            </Link>
            <Link className="landing-button secondary" to="/register" reloadDocument>
              Start free
            </Link>
          </div>
          <p className="abt-trustline">Private workspace · Student-controlled writing · No outcome promises</p>
        </div>
        <HeroComposition />
      </section>

      <section className="abt-origin" aria-labelledby="abt-origin-title">
        <div className="abt-origin-lead" data-reveal>
          <h2 id="abt-origin-title">
            Scholarship applications rarely fail because students care too little.
            <em> They become difficult because important work is spread across too many places.</em>
          </h2>
        </div>
        <div className="abt-origin-body" data-reveal>
          <ul className="abt-scatter">
            <li>Deadlines live in calendars.</li>
            <li>Requirements stay open in browser tabs.</li>
            <li>Evidence is buried in folders.</li>
            <li>Drafts multiply without a clear version.</li>
            <li>Reference follow-ups live in email.</li>
            <li>The final review often happens under pressure.</li>
          </ul>
          <p>
            EliteApply was created to connect these parts into one understandable process—not to automate ownership
            away from the student.
          </p>
        </div>
        <aside className="abt-margin-note" data-reveal>
          The problem was not a lack of effort. It was a lack of structure.
        </aside>
      </section>

      <section className="abt-principle" aria-labelledby="abt-principle-title">
        <div className="abt-principle-copy">
          <p className="abt-eyebrow">Our product principle</p>
          <h2 id="abt-principle-title">Make the next responsible action clear.</h2>
          <p>
            EliteApply should help a student understand what is complete, what is missing and what deserves attention
            next. It should provide structure without pretending certainty and assistance without becoming the author.
          </p>
        </div>
        <ol className="abt-principle-list">
          {PRINCIPLES.map(([number, title, copy]) => (
            <li key={number} data-reveal>
              <span className="abt-number">{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="abt-implement" aria-labelledby="abt-implement-title">
        <header>
          <h2 id="abt-implement-title">Principles matter when they change the product.</h2>
          <p>
            EliteApply&rsquo;s values are reflected in the way the workspace behaves—not only in the language used to
            describe it.
          </p>
        </header>
        {IMPLEMENTATIONS.map((row) => (
          <article key={row.title} data-reveal>
            <div>
              <h3>{row.title}</h3>
              <p>{row.copy}</p>
            </div>
            {row.visual}
          </article>
        ))}
      </section>

      <section className="abt-standards" aria-labelledby="abt-standards-title">
        <header>
          <p className="abt-eyebrow">How we work</p>
          <h2 id="abt-standards-title">Four standards for every product decision.</h2>
        </header>
        <div className="abt-standards-grid">
          {STANDARDS.map(([number, title, copy, detail]) => (
            <article key={number} data-reveal>
              <span className="abt-ghost-number" aria-hidden="true">{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
              <div className="abt-standard-detail">
                <strong>What this means in the product</strong>
                <p>{detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="abt-contexts" aria-labelledby="abt-contexts-title">
        <header>
          <h2 id="abt-contexts-title">Built for serious applications at different stages.</h2>
        </header>
        <ol className="abt-track">
          {CONTEXTS.map(([title, copy], index) => (
            <li key={title} data-reveal>
              <span className="abt-track-step" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="abt-ai" aria-labelledby="abt-ai-title">
        <div className="abt-ai-copy">
          <p className="abt-eyebrow">Assistance with boundaries</p>
          <h2 id="abt-ai-title">AI should help students think more clearly—not speak in their place.</h2>
          <p>
            EliteApply may help organise ideas, review clarity, identify missing context and connect claims to evidence.
            Suggestions should remain editable and visible. Students remain responsible for the substance, accuracy and
            final voice of every application.
          </p>
        </div>
        <div className="abt-ai-columns">
          <div data-reveal>
            <h3>EliteApply can help with</h3>
            <ul>{AI_CAN.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul>
          </div>
          <div className="is-limit" data-reveal>
            <h3>EliteApply should not</h3>
            <ul>{AI_SHOULD_NOT.map((item) => <li key={item}><Circle aria-hidden="true" />{item}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="abt-privacy" aria-labelledby="abt-privacy-title">
        <div className="abt-privacy-head">
          <h2 id="abt-privacy-title">Applications contain deeply personal work.</h2>
          <p>Privacy, access and ownership should be treated as product requirements—not footer language.</p>
        </div>
        <div className="abt-privacy-grid">
          {COMMITMENTS.map(([title, copy]) => (
            <article key={title} data-reveal>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
        <nav className="abt-inline-links" aria-label="Privacy and security detail">
          <Link to="/security"><ShieldCheck aria-hidden="true" />Read our security approach</Link>
          <Link to="/privacy"><Download aria-hidden="true" />Read our privacy policy</Link>
        </nav>
      </section>

      <section className="abt-status" aria-labelledby="abt-status-title">
        <div data-reveal>
          <p className="abt-eyebrow">Where we are</p>
          <h2 id="abt-status-title">Built carefully, released honestly.</h2>
          <p>
            EliteApply is being developed around real scholarship application workflows. Features are introduced
            gradually, limitations are documented, and product decisions are evaluated against the same principles shown
            on this page.
          </p>
          <ul className="abt-chips">
            {STATUS_LABELS.map((label) => <li key={label}>{label}</li>)}
          </ul>
        </div>
        <div className="abt-listing" data-reveal>
          <h3>Independent listings</h3>
          <a href="https://saasbrowser.com/en/saas/1608604/eliteapply" target="_blank" rel="noopener">
            <img src="/saasbrowser-badge.svg" alt="EliteApply - SaaS discovery platform" width="200" height="102" />
          </a>
        </div>
      </section>

      <section className="abt-letter" aria-labelledby="abt-letter-title">
        <p className="abt-eyebrow">A note from the builder</p>
        <h2 id="abt-letter-title">Applications deserve tools designed around the work they actually require.</h2>
        <div className="abt-letter-body" data-reveal>
          <p>
            EliteApply began with a straightforward observation: students were doing serious, high-stakes work across
            tools that understood only isolated pieces of the process.
          </p>
          <p>
            The aim is not to remove effort from an application. It is to make that effort easier to organise, review
            and improve.
          </p>
          <p>Every application should remain recognisably the student&rsquo;s work.</p>
          <p>
            EliteApply is built by <strong>Executive Precision Era</strong>, the team behind{" "}
            <a href="https://eliteresume.net" target="_blank" rel="noopener">EliteResume</a> — a companion product that
            applies the same calm, evidence-led approach to CVs and r&eacute;sum&eacute;s.
          </p>
        </div>
        <p className="abt-signature">
          <span>Hamed</span>
          <small>Founder, EliteApply</small>
        </p>
      </section>

      <section className="abt-vision" aria-labelledby="abt-vision-title">
        <div className="abt-vision-copy">
          <h2 id="abt-vision-title">A more complete home for the application journey.</h2>
          <p>
            EliteApply is being built toward a connected system where students can organise opportunities, prepare
            materials, coordinate people, practise interviews and carry reusable evidence from one application to the
            next.
          </p>
          <ul className="abt-legend">
            <li><span className="abt-dot is-available" aria-hidden="true" />Available</li>
            <li><span className="abt-dot is-progress" aria-hidden="true" />In development</li>
            <li><span className="abt-dot is-exploring" aria-hidden="true" />Exploring</li>
          </ul>
        </div>
        <ol className="abt-map" data-reveal>
          {SYSTEM_MAP.map(([stage, state]) => (
            <li key={stage} className={state === "Available" ? "is-available" : state === "In development" ? "is-progress" : "is-exploring"}>
              <span className="abt-map-stage">{stage}</span>
              <span className="abt-map-state">{state}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="abt-cta">
        <div className="abt-cta-copy">
          <h2>Give your next application a calmer place to begin.</h2>
          <p>
            Start with one opportunity. Bring its requirements, evidence, writing and deadlines into one connected
            workspace.
          </p>
        </div>
        <div className="abt-cta-panel">
          <CtaPreview />
          <div className="abt-actions">
            <Link className="landing-button" to="/register" reloadDocument>
              Start free <ArrowRight aria-hidden="true" />
            </Link>
            <Link className="landing-button secondary" to="/product-preview">
              <Eye aria-hidden="true" />Explore a sample workspace
            </Link>
          </div>
          <p className="abt-trustline">No credit card required · Your work stays yours</p>
        </div>
      </section>
    </div>
  );
}
