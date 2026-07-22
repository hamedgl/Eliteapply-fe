import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RefereePage } from "./ReferencePages";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("RefereePage", () => {
  it("shows the uploaded document and submits its confirmed id", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/submit")) return Response.json({ status: "approved" });
      return Response.json({
        id: "request-id",
        mode: "existing_upload",
        confidential: false,
        application_title: "MSc Artificial Intelligence",
        destinations: ["Example University"],
        student_context: { summary: "Please verify the attached official letter." },
        relationship_context: { summary: "You supervised my dissertation." },
        student_draft: null,
        existing_document: {
          id: "document-id",
          display_name: "Official reference.pdf",
          content_type: "application/pdf",
          size_bytes: 1024,
        },
        expires_at: "2026-08-05T00:00:00Z",
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter initialEntries={["/referee/academic-reference/token-value"]}>
        <Routes>
          <Route path="/referee/academic-reference/:token" element={<RefereePage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Reference code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue securely" }));

    expect(await screen.findByText("Official reference.pdf")).toBeInTheDocument();
    expect(screen.getByText("Please verify the attached official letter.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Final reference")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Professor Example" } });
    fireEvent.change(screen.getByLabelText("How long have you known the applicant?"), { target: { value: "Two years" } });
    fireEvent.change(screen.getByLabelText(/Potential conflict of interest/), { target: { value: "None" } });
    fireEvent.change(screen.getByLabelText("Signature name"), { target: { value: "Professor Example" } });
    fireEvent.click(screen.getByLabelText("I confirm the stated relationship."));
    fireEvent.click(screen.getByLabelText("I attest that this submission is authentic."));
    fireEvent.click(screen.getByLabelText("I am authorized to submit this reference."));
    fireEvent.click(screen.getByRole("button", { name: "Submit reference" }));

    await waitFor(() => expect(screen.getByText("Reference submitted")).toBeInTheDocument());
    const submitCall = fetchMock.mock.calls.find(([input]) => String(input).endsWith("/submit"));
    expect(JSON.parse(String(submitCall?.[1]?.body))).toMatchObject({
      decision: "approve",
      final_content: null,
      existing_document_id: "document-id",
    });
  });
});
