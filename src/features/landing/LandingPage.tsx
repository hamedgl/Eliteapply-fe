import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Folder,
  LockKeyhole,
  Menu,
  PenLine,
  Search,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const guideSteps = [
  ["01", "Find your focus"],
  ["02", "Build your evidence"],
  ["03", "Shape your application"],
  ["04", "Submit with clarity"],
] as const;

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="marketing">
      <header className="marketing-header">
        <Link className="marketing-brand" to="/" aria-label="EliteApply home">
          <span className="brand-mark" aria-hidden="true">E</span>
          EliteApply
        </Link>
        <nav className={menuOpen ? "marketing-nav open" : "marketing-nav"} aria-label="Main navigation">
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#workspace" onClick={() => setMenuOpen(false)}>Workspace</a>
          <a href="#for-students" onClick={() => setMenuOpen(false)}>For students</a>
          <Link className="nav-signin" to="/login">Sign in</Link>
          <Link className="landing-button small" to="/register">Start your workspace</Link>
        </nav>
        <button className="nav-toggle" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Toggle navigation">
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <section className="hero" id="for-students">
        <div className="hero-copy">
          <h1>Your applications,<br />finally in one<br />calm place.</h1>
          <p>Plan every deadline, shape every document, and move forward with a clear next step.</p>
          <a className="guide-link" href="#how-it-works">See how it guides you <ArrowRight /></a>
        </div>
        <ProductPreview />
        <div className="hero-guide" aria-hidden="true"><span>1</span></div>
      </section>

      <section className="guided" id="how-it-works">
        <div className="guide-intro">
          <h2>A guide that<br />moves with you.</h2>
          <p>EliteApply turns a complex application into a sequence of clear, responsible steps.</p>
          <ol className="guide-steps">
            {guideSteps.map(([number, label], index) => (
              <li className={index === 2 ? "active" : ""} key={number}>
                <span>{number}</span><strong>{label}</strong>
                {index === 2 ? <p>Bring requirements, drafts, feedback, and deadlines together without losing the thread.</p> : null}
              </li>
            ))}
          </ol>
        </div>
        <WorkflowPreview />
      </section>

      <section className="principles" id="workspace">
        <h2>Built for the <em>whole application,</em><br />not just the deadline.</h2>
        <div className="principle-grid">
          <article><Folder /><div><h3>One source of truth</h3><p>Keep programmes, requirements, drafts, and decisions connected.</p></div></article>
          <article><LockKeyhole /><div><h3>Your work stays yours</h3><p>Stay in control of sensitive documents and evidence.</p></div></article>
          <article><ClipboardCheck /><div><h3>A clear next action</h3><p>Know what matters now, and what can wait.</p></div></article>
        </div>
      </section>

      <section className="closing">
        <div>
          <h2>Make space for<br />your best application.</h2>
          <p>Start with one programme.<br />Build a system you can trust.</p>
          <div className="closing-actions">
            <Link className="landing-button" to="/register">Start your workspace <ArrowRight /></Link>
            <Link to="/login">Sign in</Link>
          </div>
        </div>
        <div className="closing-path" aria-hidden="true"><i /><span>✦</span><b /></div>
      </section>

      <footer className="marketing-footer">
        <Link className="marketing-brand" to="/">EliteApply</Link>
        <nav aria-label="Legal"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><a href="#accessibility">Accessibility</a></nav>
      </footer>
    </main>
  );
}

function ProductPreview() {
  return (
    <div className="product-window" aria-label="EliteApply workspace preview">
      <div className="window-bar"><span /><span /><span /></div>
      <div className="product-top"><strong>EliteApply</strong><div><Search /><Bell /><b>AV</b></div></div>
      <div className="product-body">
        <aside><strong>E</strong>{[Folder, FileText, PenLine, Users, CalendarDays].map((Icon, i) => <Icon className={i === 0 ? "selected" : ""} key={i} />)}</aside>
        <section className="timeline-card">
          <h3>Applications timeline</h3>
          {[["MAY", "15", "Oxford", "Rhodes Scholarship"], ["JUN", "01", "Stanford", "Knight-Hennessy"], ["JUN", "15", "ETH Zürich", "Excellence Scholarship"]].map((item, i) => (
            <div className="timeline-row" key={item[2]}><time>{item[0]}<b>{item[1]}</b></time><i className={i === 1 ? "coral" : ""} /><p><strong>{item[2]}</strong><span>{item[3]}</span></p></div>
          ))}
        </section>
        <section className="next-card"><h3>Your next action</h3><div className="next-content"><FileText /><p><strong>Stanford University</strong><span>Statement of Purpose</span></p></div><p>Draft a clear, reflective statement that connects your experience to your goals.</p><small><CalendarDays /> Due in <b>12 days</b></small><button>Continue writing</button></section>
        <section className="progress-card"><h3>Document progress</h3>{[["CV / Resume", 90], ["Statement of Purpose", 62], ["Transcripts", 100]].map(([label, value]) => <div className="progress-row" key={label}><span>{label}</span><i><b style={{ width: `${value}%` }} /></i><em>{value}%</em></div>)}</section>
        <section className="path-card"><h3>Your application path</h3><div>{["Plan", "Prepare", "Submit", "Follow up"].map((label, i) => <span key={label} className={i < 3 ? "done" : ""}><i>{i < 3 ? <Check /> : "4"}</i>{label}</span>)}</div></section>
      </div>
      <div className="preview-guide" aria-hidden="true"><span>2</span><i /><b>3</b></div>
    </div>
  );
}

function WorkflowPreview() {
  return (
    <div className="workflow-window">
      <header><FileText /><strong>Personal Statement Draft</strong><span><CheckCircle2 /> Saved just now</span></header>
      <div className="workflow-body">
        <section><h3><ClipboardCheck /> Requirements</h3>{["Statement of Purpose", "Academic Background", "Research Experience", "Why This Program"].map((x, i) => <p key={x}><i className={i !== 2 ? "complete" : ""}>{i !== 2 ? <Check /> : null}</i><span>{x}<small>{i === 2 ? "In progress" : i === 3 ? "Pending" : "Complete"}</small></span></p>)}</section>
        <section className="draft"><h3><PenLine /> Writing</h3><div className="editor-tools">H2　 B　 <em>I</em>　☷　☰</div><article><h4>Advancing equitable access through research and community.</h4><p>My path has been shaped by a commitment to bridging opportunity gaps through rigorous research and meaningful collaboration.</p><i /><i /><i /><i /></article></section>
        <section className="references"><h3><Users /> References</h3>{[["Dr. Maya Patel", "Confirmed"], ["Prof. James Lee", "Confirmed"], ["Dr. Aisha Rahman", "Pending"]].map(([name, status]) => <p key={name}><span><strong>{name}</strong><small>Academic advisor</small></span><CheckCircle2 className={status === "Pending" ? "pending" : ""} /></p>)}<Link className="landing-button small" to="/register">Explore the workspace <ArrowRight /></Link></section>
      </div>
    </div>
  );
}
