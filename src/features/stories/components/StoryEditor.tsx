import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { writingApi } from "../../../lib/api/phase3";
import { categories, label, readEvidence, sensitivityMeta, sensitivities, type Story } from "../model";

const parseTags = (value: string) =>
  value.split(",").map((tag) => tag.trim()).filter(Boolean);

export function StoryEditor({
  story,
  onClose,
}: {
  story: Story | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [category, setCategory] = useState<Story["category"]>(story?.category ?? categories[0]);
  const [title, setTitle] = useState(story?.title ?? "");
  const [situation, setSituation] = useState(story?.situation ?? "");
  const [action, setAction] = useState(story?.action ?? "");
  const [outcome, setOutcome] = useState(story?.outcome ?? "");
  const [reflection, setReflection] = useState(story?.reflection ?? "");
  const [sensitivity, setSensitivity] = useState<Story["sensitivity"]>(story?.sensitivity ?? "private");
  const [skillsText, setSkillsText] = useState(story?.skills_values?.join(", ") ?? "");
  const [promptText, setPromptText] = useState(story?.prompt_types?.join(", ") ?? "");
  const [evidence, setEvidence] = useState(() => readEvidence(story?.evidence));
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      const values = {
        category,
        title,
        situation,
        action,
        outcome,
        reflection: reflection || null,
        sensitivity,
        skills_values: parseTags(skillsText),
        prompt_types: parseTags(promptText),
        evidence: evidence.filter((item) => item.label.trim()),
      };
      if (story) return writingApi.updateStory(story.id, { expected_version: story.version, ...values });
      return writingApi.createStory(values);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["stories"] });
      onClose();
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Story could not be saved."),
  });

  return (
    <div className="apps-dialog-backdrop" role="presentation">
      <section className="apps-dialog story-editor" role="dialog" aria-modal="true" aria-labelledby="story-editor-title">
        <header>
          <div>
            <h2 id="story-editor-title">{story ? "Edit story" : "Add story"}</h2>
            <p>
              {story
                ? `Saving against version ${story.version}. Conflicts will not overwrite newer work.`
                : "Capture the parts you may reuse in essays, interviews and applications."}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value as Story["category"])}>
              {categories.map((item) => (
                <option value={item} key={item}>
                  {label(item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={2} autoFocus />
          </label>

          <label className="wide">
            Situation
            <textarea value={situation} onChange={(event) => setSituation(event.target.value)} required minLength={2} rows={2} />
          </label>
          <label className="wide">
            Action
            <textarea value={action} onChange={(event) => setAction(event.target.value)} required minLength={2} rows={2} />
          </label>
          <label className="wide">
            Outcome
            <textarea value={outcome} onChange={(event) => setOutcome(event.target.value)} required minLength={2} rows={2} />
          </label>
          <label className="wide">
            Reflection <span className="story-field-optional">(optional)</span>
            <textarea value={reflection} onChange={(event) => setReflection(event.target.value)} rows={2} />
          </label>

          <label>
            Privacy
            <select value={sensitivity} onChange={(event) => setSensitivity(event.target.value as Story["sensitivity"])}>
              {sensitivities.map((item) => (
                <option value={item} key={item}>
                  {sensitivityMeta[item].label}
                </option>
              ))}
            </select>
            <small>{sensitivityMeta[sensitivity].description}</small>
          </label>
          <label>
            Skills or values demonstrated
            <input
              value={skillsText}
              onChange={(event) => setSkillsText(event.target.value)}
              placeholder="Leadership, resilience"
            />
          </label>
          <label className="wide">
            Suited for <span className="story-field-optional">(optional)</span>
            <input
              value={promptText}
              onChange={(event) => setPromptText(event.target.value)}
              placeholder="Motivation letter, interview"
            />
          </label>

          <div className="wide story-evidence-editor">
            <span className="story-evidence-editor-label">Evidence</span>
            {evidence.map((item, index) => (
              <div className="story-evidence-row" key={index}>
                <input
                  aria-label="Evidence label"
                  value={item.label}
                  onChange={(event) =>
                    setEvidence((current) =>
                      current.map((entry, i) => (i === index ? { ...entry, label: event.target.value } : entry)),
                    )
                  }
                  placeholder="e.g. Research paper"
                />
                <input
                  aria-label="Evidence URL"
                  value={item.url ?? ""}
                  onChange={(event) =>
                    setEvidence((current) =>
                      current.map((entry, i) => (i === index ? { ...entry, url: event.target.value } : entry)),
                    )
                  }
                  placeholder="Link (optional)"
                />
                <button
                  type="button"
                  aria-label="Remove evidence"
                  onClick={() => setEvidence((current) => current.filter((_, i) => i !== index))}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="apps-inline-link"
              onClick={() => setEvidence((current) => [...current, { label: "", url: "" }])}
            >
              <Plus aria-hidden="true" /> Add evidence
            </button>
          </div>

          {error ? (
            <p className="form-error wide" role="alert">
              {error}
            </p>
          ) : null}
          <div className="dialog-actions wide">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" disabled={save.isPending}>
              {save.isPending ? "Saving…" : story ? "Save changes" : "Save story"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
