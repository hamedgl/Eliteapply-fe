import {
  CheckCircle2,
  FileText,
  Loader2,
  PenLine,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PreviewFrame } from "../landingShared";


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


export function WritingCapabilityPreview() {
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


