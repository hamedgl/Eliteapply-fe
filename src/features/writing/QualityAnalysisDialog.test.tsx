import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { QualityAnalysisDialog } from "./QualityAnalysisDialog";

afterEach(cleanup);

const analysis = {
  id: "00000000-0000-4000-8000-000000000201",
  document_id: "00000000-0000-4000-8000-000000000202",
  created_at: "2026-07-20T10:30:00Z",
  scores: [
    { key: "overall", label: "Overall", value: 82, max: 100 },
    { key: "clarity", label: "Clarity", value: 6, max: 10 },
  ],
  findings: [
    {
      id: "00000000-0000-4000-8000-000000000203",
      severity: "high",
      category: "opening_paragraph",
      title: "Opening is generic",
      detail: "The first paragraph could describe any applicant.",
      suggestion: "Name the specific research group you want to join.",
      excerpt: "I am writing to express my strong interest",
      location: { paragraph: 1, start: 0, end: 42 },
    },
  ],
  claim_warnings: [
    {
      id: "00000000-0000-4000-8000-000000000204",
      claim: "I led a team of 15 researchers",
      severity: "medium",
      reason: "No supporting evidence is linked in your profile.",
      suggested_evidence_type: "research_experience",
    },
  ],
} as unknown as Parameters<typeof QualityAnalysisDialog>[0]["analysis"];

describe("QualityAnalysisDialog", () => {
  it("renders scores, findings and claim warnings from the typed payload", () => {
    render(<QualityAnalysisDialog analysis={analysis} onClose={() => {}} />);

    expect(screen.getByLabelText("Overall score")).toHaveValue(82);
    // A non-100 max is normalised for the bar and printed as sent.
    expect(screen.getByLabelText("Clarity score")).toHaveValue(60);
    expect(screen.getByText("6 / 10")).toBeInTheDocument();

    expect(screen.getByText("Opening is generic")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Opening Paragraph · Paragraph 1")).toBeInTheDocument();
    expect(
      screen.getByText("Name the specific research group you want to join."),
    ).toBeInTheDocument();

    expect(screen.getByText("I led a team of 15 researchers")).toBeInTheDocument();
    expect(
      screen.getByText("Back this up with Research Experience."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Claim warnings (1)" }),
    ).toBeInTheDocument();
  });

  it("shows empty-state copy instead of blank sections", () => {
    render(
      <QualityAnalysisDialog
        analysis={
          { ...analysis, findings: [], claim_warnings: [] } as typeof analysis
        }
        onClose={() => {}}
      />,
    );

    expect(
      screen.getByText("No issues were flagged in this pass."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No claims needed evidence review."),
    ).toBeInTheDocument();
  });
});
