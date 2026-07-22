import { useState } from "react";
import { Sparkles, X, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Select } from "../../../components/ui/select";
import { writingApi, storiesApi } from "../../../lib/api/phase3";
import type { Story } from "../model";
import type { StoryAIAssistResponse } from "../../../lib/api/phase3";

type AiAction = "improve_clarity" | "shorten" | "adapt_for_interview" | "expand";

function extractText(data: unknown, field: string): string {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record[field] === "string") return record[field] as string;
    if (typeof record.text === "string") return record.text;
    if (typeof record.content === "string") return record.content;
    return JSON.stringify(data, null, 2);
  }
  return "";
}

export function StoryAiAssistModal({
  story,
  onClose,
  onApplied,
}: {
  story: Story;
  onClose: () => void;
  onApplied: () => void;
}) {
  const qc = useQueryClient();
  const [action, setAction] = useState<AiAction>("improve_clarity");
  const [targetField, setTargetField] = useState("action");
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<StoryAIAssistResponse | null>(null);
  const [applied, setApplied] = useState(false);

  const assistMutation = useMutation({
    mutationFn: async () => {
      return storiesApi.aiAssist(story.id, {
        action,
        instruction: prompt || undefined,
      });
    },
    onSuccess: (data) => {
      setResult(data);
      setError("");
      setApplied(false);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to generate AI suggestion.");
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (suggestedText: string) => {
      const fieldMap: Record<string, keyof Story> = {
        situation: "situation",
        action: "action",
        outcome: "outcome",
        reflection: "reflection",
      };
      const key = fieldMap[targetField] ?? "action";
      return writingApi.updateStory(story.id, {
        expected_version: story.version,
        [key]: suggestedText,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["stories"] });
      setError("");
      setApplied(true);
      onApplied();
    },
    onError: (err) => {
      setApplied(false);
      setError(err instanceof Error ? err.message : "Failed to apply AI suggestion.");
    },
  });

  const origText = result ? extractText(result.original_text, targetField) : (story[targetField as keyof Story] as string) || "";
  const sugText = result ? extractText(result.suggested_text, targetField) : "";

  return (
    <div className="apps-dialog-backdrop" role="presentation" onClick={onClose}>
      <section
        className="apps-dialog story-ai-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-assist-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="apps-dialog-header">
          <div className="story-ai-header-title">
            <Sparkles className="icon-sparkles" aria-hidden="true" />
            <h2 id="ai-assist-title">AI Story Polish &amp; Assist</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="apps-dialog-body">
          {error ? <div className="apps-notice is-danger">{error}</div> : null}

          <div className="story-ai-grid">
            <label>
              Action
              <Select
                value={action}
                onChange={(val: any) => setAction((typeof val === "string" ? val : (val?.target?.value ?? "improve_clarity")) as AiAction)}
                options={[
                  { value: "improve_clarity", label: "Improve Clarity & Flow" },
                  { value: "expand", label: "Expand Details (SAOR)" },
                  { value: "shorten", label: "Make More Concise" },
                  { value: "adapt_for_interview", label: "Adapt for Interview" },
                ]}
              />
            </label>

            <label>
              Target Field
              <Select
                value={targetField}
                onChange={(val: any) => setTargetField(typeof val === "string" ? val : (val?.target?.value ?? "action"))}
                options={[
                  { value: "situation", label: "Situation" },
                  { value: "action", label: "Action" },
                  { value: "outcome", label: "Outcome" },
                  { value: "reflection", label: "Reflection" },
                ]}
              />
            </label>
          </div>

          <label className="story-ai-prompt">
            Custom instruction / prompt guidance (optional)
            <textarea
              rows={2}
              placeholder="e.g. Adapt this story for a prompt asking about leadership under pressure…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </label>

          {!result ? (
            <div className="story-ai-generate">
              <button
                type="button"
                className="primary"
                disabled={assistMutation.isPending}
                onClick={() => assistMutation.mutate()}
              >
                {assistMutation.isPending ? (
                  <>
                    <Sparkles className="spinning" aria-hidden="true" /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles aria-hidden="true" /> Generate Suggestion
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="ai-assist-result">
              <h4>AI Suggestion</h4>
              {result.explanation ? (
                <p className="apps-dialog-subtext story-ai-explanation">💡 {result.explanation}</p>
              ) : null}

              <div className="story-ai-compare">
                <div>
                  <strong className="story-ai-compare-original">Original ({targetField})</strong>
                  <p>{origText || "(empty)"}</p>
                </div>
                <div>
                  <strong className="story-ai-compare-suggested">Suggested</strong>
                  <p>{sugText || "(empty)"}</p>
                </div>
              </div>

              {applied ? (
                <div className="apps-notice is-success" role="status">
                  <Check aria-hidden="true" /> Suggestion applied to {targetField}.
                </div>
              ) : null}

              <div className="story-ai-actions">
                <button type="button" onClick={() => assistMutation.mutate()} disabled={assistMutation.isPending}>
                  Regenerate
                </button>
                <button
                  type="button"
                  className="primary"
                  disabled={applyMutation.isPending || !sugText}
                  onClick={() => sugText && applyMutation.mutate(sugText)}
                >
                  {applyMutation.isPending ? (
                    "Applying…"
                  ) : (
                    <>
                      <Check aria-hidden="true" /> Apply Suggestion
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
