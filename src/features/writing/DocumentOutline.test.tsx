import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DocumentOutline } from "./DocumentOutline";

afterEach(cleanup);

const revision = {
  id: "00000000-0000-4000-8000-000000000301",
  revision_number: 3,
  name: null,
  reason: "before_restore",
  content: {},
  evidence_map: {},
  ai_insertions: [],
  created_at: "2026-07-20T10:30:00Z",
} as unknown as Parameters<typeof DocumentOutline>[0]["revisions"][number];

describe("DocumentOutline", () => {
  it("lists document headings as jump links", () => {
    render(
      <DocumentOutline
        html="<h1>Why this programme</h1><div>Body</div><h1></h1>"
        revisions={[revision]}
        onRestore={async () => {}}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Why this programme" }),
    ).toBeInTheDocument();
    // An empty heading still needs a clickable label.
    expect(
      screen.getByRole("button", { name: "Untitled section 2" }),
    ).toBeInTheDocument();
    // A revision without a name falls back to its humanised reason.
    expect(screen.getByText("Before restore")).toBeInTheDocument();
  });

  it("explains the outline instead of showing an empty list", () => {
    render(
      <DocumentOutline html="<div>No headings</div>" revisions={[]} onRestore={async () => {}} />,
    );

    expect(screen.getByText(/Add headings/)).toBeInTheDocument();
    expect(screen.getByText(/versioned here/)).toBeInTheDocument();
  });

  it("labels versions the model wrote and leaves hand-written ones unmarked", () => {
    render(
      <DocumentOutline
        html="<h1>Draft</h1>"
        revisions={[
          revision,
          { ...revision, id: `${revision.id}x`, revision_number: 4, ai_insertions: [{}] },
        ]}
        onRestore={async () => {}}
      />,
    );

    expect(screen.getByText(/AI-assisted · 1 insertion/)).toBeInTheDocument();
    expect(screen.getAllByText(/AI-assisted/)).toHaveLength(1);
  });
});
