import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { QualityAnalysisDialog } from "./QualityAnalysisDialog";

afterEach(cleanup);

/** `scores`/`findings`/`claim_warnings` are untyped on the wire, so odd shapes must still read. */
const analysis = {
  id: "00000000-0000-4000-8000-000000000201",
  document_id: "00000000-0000-4000-8000-000000000202",
  created_at: "2026-07-20T10:30:00Z",
  scores: {
    overall: 0.82,
    clarity: { value: 7.5, max: 10 },
    tone: "Consistent",
  },
  findings: [
    {
      title: "Opening is generic",
      severity: "high",
      detail: "The first paragraph could describe any applicant.",
      suggestion: "Name the specific research group you want to join.",
      excerpt: "I am writing to express my strong interest",
      paragraph: 1,
    },
    "Sentence length varies little.",
  ],
  claim_warnings: [],
} as unknown as Parameters<typeof QualityAnalysisDialog>[0]["analysis"];

describe("QualityAnalysisDialog", () => {
  it("renders scores, findings and empty sections in readable form", () => {
    render(<QualityAnalysisDialog analysis={analysis} onClose={() => {}} />);

    // 0.82 on a 0–1 scale and 7.5/10 both normalise to a percentage.
    expect(screen.getByLabelText("Overall score")).toHaveValue(82);
    expect(screen.getByLabelText("Clarity score")).toHaveValue(75);
    expect(screen.getByText("7.5 / 10")).toBeInTheDocument();
    expect(screen.getByText("Consistent")).toBeInTheDocument();

    expect(screen.getByText("Opening is generic")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(
      screen.getByText("Name the specific research group you want to join."),
    ).toBeInTheDocument();
    // Unrecognised keys are still shown rather than dropped.
    expect(screen.getByText("Paragraph")).toBeInTheDocument();
    // A plain string finding renders as its own item.
    expect(screen.getByText("Sentence length varies little.")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Findings (2)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No claims needed evidence review."),
    ).toBeInTheDocument();
  });
});
