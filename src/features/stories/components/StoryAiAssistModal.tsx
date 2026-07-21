import { useState } from "react";
import { Sparkles, X, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  const [targetField, setTargetField] = useState<string>("action");
  const [prompt, setPrompt] = useState<string>("");
  const [result, setResult] = useState<StoryAIAssistResponse | null>(null);
  const [error, setError] = useState<string>("");

  const assistMutation = useMutation({
    mutationFn: () =>
      storiesApi.aiAssist(story.id, {
        action,
        instruction: prompt.trim() || undefined,
      }),
    onSuccess: (data) => {
      setResult(data);
      setError("");
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to generate AI assist suggestion.");
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!result?.suggested_text || !targetField) return;
      const textToApply = extractText(result.suggested_text, targetField);
      await writingApi.updateStory(story.id, {
        expected_version: story.version,
        [targetField]: textToApply,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["stories"] });
      onApplied();
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to apply AI suggestion.");
    },
  });

  const origText = result ? extractText(result.original_text, targetField) : (story[targetField as keyof Story] as string) || "";
  const sugText = result ? extractText(result.suggested_text, targetField) : "";

  return (
    <div className="apps-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="apps-dialog story-ai-modal"
        role="dialog"
        aria-labelledby="ai-assist-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="apps-dialog-header">
          <div className="story-ai-title">
            <Sparkles className="icon-sparkles" aria-hidden="true" />
            <h2 id="ai-assist-title">AI Story Polish & Assist</h2>
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
              <select value={action} onChange={(e) => setAction(e.target.value as AiAction)}>
                <option value="improve_clarity">Improve Clarity & Flow</option>
                <option value="expand">Expand Details (SAOR)</option>
                <option value="shorten">Make More Concise</option>
                <option value="adapt_for_interview">Adapt for Interview</option>
              </select>
            </label>

            <label>
              Target Field
              <select value={targetField} onChange={(e) => setTargetField(e.target.value)}>
                <option value="situation">Situation</option>
                <option value="action">Action</option>
                <option value="outcome">Outcome</option>
                <option value="reflection">Reflection</option>
              </select>
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

              <div className="story-ai-actions">
                <button type="button" onClick={() => assistMutation.mutate()} disabled={assistMutation.isPending}>
                  Regenerate
                </button>
                <button
                  type="button"
                  className="primary"
                  disabled={applyMutation.isPending || !sugText}
                  onClick={() => applyMutation.mutate()}
                >
                  <Check aria-hidden="true" /> Apply Suggestion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
