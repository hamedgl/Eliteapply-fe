import {
  AlertCircle,
  Check,
  Circle,
  Clock3,
  FileText,
  Link2,
  Minus,
  PenLine,
  Send,
  Users,
} from "lucide-react";

/**
 * Editorial interface fragments for the About page.
 * These are illustrative compositions built from real markup — never screenshots —
 * so the narrative stays indexable. Decorative innards are hidden from assistive
 * technology and summarised by the figcaption on each figure.
 */

function Figure({ caption, className, children }: { caption: string; className: string; children: React.ReactNode }) {
  return (
    <figure className={className}>
      <figcaption className="sr-only">{caption}</figcaption>
      <div className="abt-figure-body" aria-hidden="true">{children}</div>
    </figure>
  );
}

export function HeroComposition() {
  return (
    <Figure
      className="abt-hero-visual"
      caption="An illustrative EliteApply workspace showing one scholarship application with its deadline, requirement progress, connected evidence, reference status and a clearly highlighted next responsible action."
    >
      <div className="abt-canvas-grid" />

      <article className="abt-frag abt-frag-main">
        <header>
          <span className="abt-eyebrow-xs">Opportunity</span>
          <strong>Chevening Master&rsquo;s Scholarship</strong>
          <span className="abt-frag-meta">Foreign, Commonwealth &amp; Development Office</span>
        </header>
        <div className="abt-frag-metrics">
          <div>
            <small>Deadline</small>
            <strong>15 October</strong>
            <span>24 days remaining</span>
          </div>
          <div>
            <small>Requirements</small>
            <strong>6 of 9</strong>
            <span>3 still open</span>
          </div>
        </div>
        <div className="abt-meter"><span style={{ width: "67%" }} /></div>
        <ul className="abt-frag-list">
          <li className="is-done"><Check />Leadership essay (500 words)</li>
          <li className="is-active"><Clock3 />Career plan essay — draft 3</li>
          <li className="is-open"><Circle />Certified degree transcript</li>
        </ul>
      </article>

      <article className="abt-frag abt-frag-evidence">
        <span className="abt-annotation">Connected evidence</span>
        <div className="abt-frag-row"><Link2 />Research assistantship — 2 outcomes</div>
        <div className="abt-frag-row"><Link2 />Community programme — 120 hours</div>
      </article>

      <article className="abt-frag abt-frag-reference">
        <span className="abt-eyebrow-xs">Reference</span>
        <div className="abt-frag-row"><Users />Dr Amara Khan<em className="abt-state is-waiting">Requested · 12 Sep</em></div>
      </article>

      <article className="abt-frag abt-frag-next">
        <span className="abt-eyebrow-xs accent">Next responsible action</span>
        <strong>Add the missing transcript before the reference deadline.</strong>
        <span className="abt-frag-meta">Based on requirements you have recorded — not a prediction of the outcome.</span>
      </article>
    </Figure>
  );
}

export function RequirementsFragment() {
  return (
    <Figure
      className="abt-frag-panel"
      caption="A requirements checklist showing captured, in-progress and missing items for one application."
    >
      <header className="abt-panel-head">
        <FileText />
        <strong>Requirements</strong>
        <small>6 of 9 captured</small>
      </header>
      <ul className="abt-frag-list">
        <li className="is-done"><Check />Eligibility self-assessment</li>
        <li className="is-done"><Check />Academic transcript</li>
        <li className="is-active"><Clock3 />Career plan essay — in progress</li>
        <li className="is-open"><Circle />English language evidence</li>
        <li className="is-open"><Circle />Institutional endorsement</li>
      </ul>
      <p className="abt-panel-note">States reflect the work you have recorded, not an assessment of your chances.</p>
    </Figure>
  );
}

export function EvidenceFragment() {
  return (
    <Figure
      className="abt-frag-panel"
      caption="A personal statement prompt connected to two pieces of supporting evidence before drafting begins."
    >
      <header className="abt-panel-head">
        <PenLine />
        <strong>Personal statement</strong>
        <small>Prompt 2 of 4</small>
      </header>
      <blockquote className="abt-prompt">Describe a time you influenced others to achieve a shared outcome.</blockquote>
      <div className="abt-evidence-links">
        <span className="abt-eyebrow-xs">Evidence connected</span>
        <div className="abt-frag-row"><Link2 />Student research group — led 6 contributors</div>
        <div className="abt-frag-row"><Link2 />Regional literacy programme — 3 schools</div>
      </div>
      <p className="abt-panel-note">Drafting starts from your own material. Every suggestion stays editable.</p>
    </Figure>
  );
}

export function ReadinessFragment() {
  return (
    <Figure
      className="abt-frag-panel"
      caption="A readiness panel showing requirement coverage, missing materials and outstanding follow-ups, with a disclaimer that it is not a prediction."
    >
      <header className="abt-panel-head">
        <Check />
        <strong>Readiness review</strong>
        <small>Before submission</small>
      </header>
      <div className="abt-readiness-grid">
        <div><small>Requirements covered</small><strong>7 of 9</strong></div>
        <div><small>Documents attached</small><strong>5</strong></div>
        <div><small>Follow-ups open</small><strong>2</strong></div>
      </div>
      <ul className="abt-frag-list">
        <li className="is-open"><Circle />Language certificate not yet attached</li>
        <li className="is-open"><Circle />Second reference not yet submitted</li>
      </ul>
      <p className="abt-panel-note warning"><AlertCircle />This review shows coverage only. It cannot predict a selection decision.</p>
    </Figure>
  );
}

export function ReferenceFragment() {
  return (
    <Figure
      className="abt-frag-panel"
      caption="A reference status timeline showing a request sent, a reminder due and a submission confirmed, without exposing confidential reference content."
    >
      <header className="abt-panel-head">
        <Users />
        <strong>References</strong>
        <small>2 referees</small>
      </header>
      <ol className="abt-timeline">
        <li className="is-done"><Send /><div><strong>Request sent to Dr Amara Khan</strong><span>12 September</span></div></li>
        <li className="is-active"><Clock3 /><div><strong>Reminder due</strong><span>28 September · 4 days before deadline</span></div></li>
        <li className="is-open"><Minus /><div><strong>Prof. Daniel Okoro — submitted</strong><span>Confirmed by the provider</span></div></li>
      </ol>
      <p className="abt-panel-note">You can see status and timing. Reference content stays between the referee and the provider.</p>
    </Figure>
  );
}

export function CtaPreview() {
  return (
    <Figure
      className="abt-cta-visual"
      caption="A compact preview of an application workspace showing a deadline, requirement progress and the next action."
    >
      <div className="abt-frag abt-frag-cta">
        <span className="abt-eyebrow-xs accent">Application</span>
        <strong>Commonwealth Scholarship</strong>
        <div className="abt-meter"><span style={{ width: "45%" }} /></div>
        <div className="abt-frag-metrics compact">
          <div><small>Deadline</small><strong>1 November</strong></div>
          <div><small>Requirements</small><strong>4 of 9</strong></div>
        </div>
        <div className="abt-frag-row accent"><Clock3 />Next: confirm eligibility criteria</div>
      </div>
    </Figure>
  );
}
