import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WritingEditor } from "./WritingPages";
import { writingApi } from "../../lib/api/phase3";

vi.mock("../../lib/api/phase3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/api/phase3")>();
  return {
    ...actual,
    writingApi: {
      ...actual.writingApi,
      get: vi.fn().mockResolvedValue({
        id: "doc-1",
        application_id: null,
        application_title: null,
        application_stage: null,
        document_type: "personal_statement",
        cv_mode: null,
        title: "My statement",
        prompt_text: null,
        target_requirements: {},
        content: {},
        evidence_map: {},
        word_limit: null,
        character_limit: null,
        template_id: null,
        theme: {},
        status: "draft",
        version: 1,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      }),
      revisions: vi.fn().mockResolvedValue([]),
      analyses: vi.fn().mockResolvedValue({ items: [] }),
      generationRuns: vi.fn().mockResolvedValue([]),
      generate: vi.fn().mockRejectedValue(new Error("network down")),
      generationRun: vi.fn(),
    },
  };
});

vi.mock("../../lib/api/billing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/api/billing")>();
  return {
    ...actual,
    billingApi: {
      ...actual.billingApi,
      entitlements: vi.fn().mockResolvedValue({
        ai_tokens_limit: 100,
        ai_tokens_used: 0,
        purchased_tokens_remaining: 0,
      }),
    },
  };
});

function renderEditor() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/app/writing/doc-1"]}>
        <Routes>
          <Route path="/app/writing/:id" element={<WritingEditor />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("WritingEditor generation failures", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows an error instead of failing silently when starting a generation fails", async () => {
    renderEditor();

    const instruction = await screen.findByLabelText("Instruction");
    fireEvent.change(instruction, { target: { value: "Draft my opening paragraph" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate suggestion" }));

    expect(
      await screen.findByText("The generation could not be started. Try again."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate suggestion" })).not.toBeDisabled();
  });

  it("reuses the same mutation_id when retrying the same generation payload after a failure", async () => {
    const run = {
      id: "run-1",
      document_id: "doc-1",
      retry_of_id: null,
      mutation_id: null,
      generation_id: null,
      operation: "draft_section",
      status: "completed",
      prompt_version: null,
      model_version: null,
      input_hash: null,
      ai_provider: null,
      usage_reservation_id: null,
      failure_reason: null,
      created_at: "2026-01-01T00:00:00Z",
      completed_at: "2026-01-01T00:00:05Z",
    };
    const generateMock = vi.mocked(writingApi.generate);
    generateMock.mockReset();
    generateMock
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(run as never);
    vi.mocked(writingApi.generationRun).mockResolvedValue(run as never);

    renderEditor();
    const instruction = await screen.findByLabelText("Instruction");
    fireEvent.change(instruction, { target: { value: "Draft my opening paragraph" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate suggestion" }));
    await screen.findByText("The generation could not be started. Try again.");

    fireEvent.click(screen.getByRole("button", { name: "Generate suggestion" }));
    await waitFor(() => expect(generateMock).toHaveBeenCalledTimes(2));

    const [firstCall, secondCall] = generateMock.mock.calls;
    const firstBody = firstCall[1] as { mutation_id: string };
    const secondBody = secondCall[1] as { mutation_id: string };
    expect(secondBody.mutation_id).toBe(firstBody.mutation_id);
  });
});
