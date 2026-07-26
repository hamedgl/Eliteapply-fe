import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RefereePage, VerifyReference } from "./ReferencePages";

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
        referee_name: "Professor Example",
        referee_email: "professor@example.edu",
        referee_role: "professor",
        institution: "Example University",
        department: "Computer Science",
        reference_type: "academic",
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
    expect(screen.getByLabelText("Full name")).toHaveValue("Professor Example");
    expect(screen.getByLabelText("Institution")).toHaveValue("Example University");
    expect(screen.getByLabelText("Relationship to the applicant")).toHaveValue(
      "You supervised my dissertation.",
    );

    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Professor Example" } });
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
      referee_role: "professor",
      institution: "Example University",
      department: "Computer Science",
      relationship_to_applicant: "You supervised my dissertation.",
    });
  });

  it("keeps AI polish as a reviewable suggestion before submission", async () => {
    const original = "I supervised this applicant during a demanding research project. ".repeat(2);
    const polished = "I supervised the applicant throughout a demanding research project. ".repeat(2);
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/polish")) return Response.json({ polished_content: polished });
      return Response.json({
        id: "request-id",
        mode: "referee_direct",
        confidential: false,
        referee_name: "Dr Example",
        referee_email: "dr@example.edu",
        referee_role: "supervisor",
        institution: "Example University",
        department: "Research",
        reference_type: "academic",
        application_title: "Research Fellowship",
        destinations: [],
        student_context: {},
        relationship_context: { summary: "Research supervisor" },
        student_draft: null,
        existing_document: null,
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
    const editor = await screen.findByLabelText("Final reference");
    fireEvent.change(editor, { target: { value: original } });
    fireEvent.click(screen.getByRole("button", { name: "Polish with AI" }));

    expect(await screen.findByLabelText("Polished reference suggestion")).toHaveValue(polished);
    expect(editor).toHaveValue(original);
    fireEvent.click(screen.getByRole("button", { name: "Use suggestion" }));
    expect(editor).toHaveValue(polished);
  });
});

describe("VerifyReference", () => {
  it("shows the envelope ID and downloads the PDF tied to the public record", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/download")) {
        return new Response(new Blob(["verified PDF"], { type: "application/pdf" }), {
          headers: { "content-type": "application/pdf" },
        });
      }
      return Response.json({
        public_id: "public-id",
        status: "approved",
        referee_role: "professor",
        institution: "Example University",
        approved_at: "2026-07-26T12:00:00Z",
        envelope_id: "A".repeat(64),
        download_available: true,
        disclaimer: "Verification confirms the reference workflow.",
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:verified-reference");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={["/verify/academic-reference/public-id"]}>
          <Routes>
            <Route
              path="/verify/academic-reference/:publicId"
              element={<VerifyReference />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("A".repeat(64))).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Download verified reference PDF" }),
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/verify/academic-reference/public-id/download"),
        expect.any(Object),
      ),
    );
  });
});
