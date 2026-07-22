import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { PromptDialogProvider } from "../../components/PromptDialog";
import { AcademicProfilePage } from "../profile/AcademicProfilePage";
import { WritingEditor } from "./WritingPages";

const documentId = "00000000-0000-4000-8000-000000000101";
const runId = "00000000-0000-4000-8000-000000000102";
const backendDetail =
  "Complete the missing Academic Profile fields, then come back to generate this document.";

const documentResponse = {
  id: documentId,
  application_id: null,
  document_type: "study_plan",
  cv_mode: null,
  title: "Oxford study plan",
  prompt_text: null,
  target_requirements: {},
  content: { text: "Opening draft" },
  evidence_map: {},
  word_limit: 500,
  character_limit: null,
  template_id: null,
  theme: {},
  status: "draft",
  version: 1,
  created_at: "2026-07-22T09:00:00Z",
  updated_at: "2026-07-22T09:00:00Z",
};

const failedRun = {
  id: runId,
  document_id: documentId,
  retry_of_id: null,
  mutation_id: "mutation-1",
  generation_id: "00000000-0000-4000-8000-000000000103",
  operation: "generate_outline",
  status: "failed",
  prompt_version: "v1",
  model_version: null,
  input_hash: "hash",
  usage_reservation_id: "00000000-0000-4000-8000-000000000104",
  failure_reason: "Generation failed.",
  created_at: "2026-07-22T09:00:00Z",
  completed_at: "2026-07-22T09:01:00Z",
};

const profileResponse = {
  id: "00000000-0000-4000-8000-000000000105",
  version: 1,
  created_at: "2026-07-22T09:00:00Z",
  updated_at: "2026-07-22T09:00:00Z",
  applicant_type: null,
  intended_study_level: null,
  target_countries: [],
  sections: {
    goals: {
      fields_of_study: [],
      preferred_intake: "",
      study_mode: "",
      funding_requirement: "",
    },
    education: { entries: [] },
  },
  completion: {},
  provenance: {},
};

beforeAll(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.setAttribute("open", "");
      },
    },
    close: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.removeAttribute("open");
      },
    },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function academicProfileError() {
  return Response.json(
    {
      error: "Academic Profile is incomplete",
      detail: backendDetail,
      code: "academic_profile_incomplete",
      details: {
        required_action: "complete_academic_profile",
        profile_section: "education",
        missing_fields: ["institution", "field_of_study"],
      },
    },
    { status: 422 },
  );
}

function successfulJson(value: unknown) {
  return Promise.resolve(Response.json(value));
}

function commonGet(pathname: string) {
  if (pathname.endsWith(`/writing-studio/documents/${documentId}/revisions`))
    return successfulJson([]);
  if (pathname.endsWith(`/writing-studio/documents/${documentId}/analyses`))
    return successfulJson({ items: [], has_more: false, total: 0 });
  if (
    pathname.endsWith(`/writing-studio/documents/${documentId}/generation-runs`)
  )
    return successfulJson([]);
  if (pathname.endsWith(`/writing-studio/documents/${documentId}`))
    return successfulJson(documentResponse);
  if (pathname.endsWith(`/writing-studio/generation-runs/${runId}`))
    return successfulJson(failedRun);
  if (pathname.endsWith("/billing/entitlements"))
    return successfulJson({
      plan_key: "pro",
      plan_name: "pro",
      plan_label: "Pro",
      subscription_status: "active",
      is_active: true,
      cancel_at_period_end: false,
      current_period_end: null,
      trial_end: null,
      ai_tokens_used: 0,
      ai_tokens_limit: 100,
      ai_tokens_reset_at: "2026-08-01T00:00:00Z",
      purchased_tokens_remaining: 0,
    });
  return null;
}

function TestProviders({
  children,
  initialEntries,
}: {
  children: ReactNode;
  initialEntries: Parameters<typeof MemoryRouter>[0]["initialEntries"];
}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>
        <PromptDialogProvider>{children}</PromptDialogProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {JSON.stringify({
        pathname: location.pathname,
        search: location.search,
        state: location.state,
      })}
    </output>
  );
}

describe("Writing Studio Academic Profile precondition", () => {
  it("stops generation, explains missing fields, and preserves the draft when navigating", async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const pathname = new URL(String(input)).pathname;
        const common = commonGet(pathname);
        if (common && (!init?.method || init.method === "GET")) return common;
        if (
          init?.method === "POST" &&
          pathname.endsWith(`/writing-studio/documents/${documentId}/generate`)
        )
          return academicProfileError();
        throw new Error(
          `Unexpected request: ${init?.method ?? "GET"} ${pathname}`,
        );
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestProviders
        initialEntries={[`/app/writing/${documentId}?panel=generation`]}
      >
        <Routes>
          <Route path="/app/writing/:id" element={<WritingEditor />} />
          <Route path="/app/academic-profile" element={<LocationProbe />} />
        </Routes>
      </TestProviders>,
    );

    expect(
      await screen.findByText("Oxford study plan", {}, { timeout: 4_000 }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Instruction"), {
      target: { value: "Draft a focused opening" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Generate suggestion" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Complete your Academic Profile",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(backendDetail)).toBeInTheDocument();
    expect(screen.getByText("Institution")).toBeInTheDocument();
    expect(screen.getByText("Field of study")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generate suggestion" }),
    ).toBeEnabled();
    expect(
      fetchMock.mock.calls.some(([input, init]) => {
        const pathname = new URL(String(input)).pathname;
        return (
          (!init?.method || init.method === "GET") &&
          /\/writing-studio\/generation-runs\/[^/]+$/.test(pathname)
        );
      }),
    ).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(
      screen.queryByRole("heading", {
        name: "Complete your Academic Profile",
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Instruction")).toHaveValue(
      "Draft a focused opening",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Generate suggestion" }),
    );
    await screen.findByRole("heading", {
      name: "Complete your Academic Profile",
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Complete Academic Profile" }),
    );

    const destination = JSON.parse(
      await screen.findByTestId("location").then((node) => node.textContent!),
    );
    expect(destination).toEqual({
      pathname: "/app/academic-profile",
      search: "?section=education",
      state: {
        returnTo: `/app/writing/${documentId}?panel=generation`,
        missingFields: ["institution", "field_of_study"],
        writingGenerationDraft: {
          documentId,
          operation: "generate_outline",
          instruction: "Draft a focused opening",
        },
      },
    });
  });

  it("applies the same precondition dialog to retry", async () => {
    let generateCalled = false;
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const pathname = new URL(String(input)).pathname;
        const common = commonGet(pathname);
        if (common && (!init?.method || init.method === "GET")) return common;
        if (
          init?.method === "POST" &&
          pathname.endsWith(`/writing-studio/documents/${documentId}/generate`)
        ) {
          generateCalled = true;
          return Response.json(failedRun);
        }
        if (
          init?.method === "POST" &&
          pathname.endsWith(`/writing-studio/generation-runs/${runId}/retry`)
        )
          return academicProfileError();
        throw new Error(
          `Unexpected request: ${init?.method ?? "GET"} ${pathname}`,
        );
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestProviders initialEntries={[`/app/writing/${documentId}`]}>
        <Routes>
          <Route path="/app/writing/:id" element={<WritingEditor />} />
        </Routes>
      </TestProviders>,
    );

    await screen.findByText("Oxford study plan");
    fireEvent.change(screen.getByLabelText("Instruction"), {
      target: { value: "Try this generation" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Generate suggestion" }),
    );
    await waitFor(() => expect(generateCalled).toBe(true));
    fireEvent.click(
      await screen.findByRole("button", { name: "Retry as a new run" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Complete your Academic Profile",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Retry as a new run" }),
    ).toBeEnabled();
    expect(
      fetchMock.mock.calls.some(([input, init]) =>
        Boolean(
          init?.method === "POST" &&
          new URL(String(input)).pathname.endsWith(
            `/writing-studio/generation-runs/${runId}/retry`,
          ),
        ),
      ),
    ).toBe(true);
  });

  it("returns after the profile is complete with the generation form intact and does not submit", async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const pathname = new URL(String(input)).pathname;
        const common = commonGet(pathname);
        if (common && (!init?.method || init.method === "GET")) return common;
        if (
          pathname.endsWith("/academic-profile") &&
          (!init?.method || init.method === "GET")
        )
          return Response.json(profileResponse);
        if (pathname.endsWith("/academic-profile") && init?.method === "PUT") {
          const body = JSON.parse(String(init.body));
          return Response.json({
            ...profileResponse,
            ...body,
            version: 2,
            updated_at: "2026-07-22T10:00:00Z",
          });
        }
        throw new Error(
          `Unexpected request: ${init?.method ?? "GET"} ${pathname}`,
        );
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestProviders
        initialEntries={[
          {
            pathname: "/app/academic-profile",
            search: "?section=education",
            state: {
              returnTo: `/app/writing/${documentId}?panel=generation`,
              missingFields: ["institution", "field_of_study"],
              writingGenerationDraft: {
                documentId,
                operation: "draft_section",
                instruction: "Keep this unsaved instruction",
              },
            },
          },
        ]}
      >
        <Routes>
          <Route
            path="/app/academic-profile"
            element={<AcademicProfilePage />}
          />
          <Route
            path="/app/writing/:id"
            element={
              <>
                <WritingEditor />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </TestProviders>,
    );

    expect(
      await screen.findByRole("heading", { name: "Education" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add education" }));
    fireEvent.change(screen.getByLabelText("Institution"), {
      target: { value: "University of Oxford" },
    });
    fireEvent.change(screen.getByLabelText("Field of study"), {
      target: { value: "Computer Science" },
    });

    expect(
      await screen.findByText("Oxford study plan", {}, { timeout: 4_000 }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Instruction")).toHaveValue(
      "Keep this unsaved instruction",
    );
    expect(screen.getByTestId("location")).toHaveTextContent(
      `/app/writing/${documentId}`,
    );
    expect(screen.getByTestId("location")).toHaveTextContent(
      "?panel=generation",
    );
    expect(
      fetchMock.mock.calls.some(([input, init]) =>
        Boolean(
          init?.method === "POST" &&
          new URL(String(input)).pathname.endsWith("/generate"),
        ),
      ),
    ).toBe(false);
  }, 10_000);
});
