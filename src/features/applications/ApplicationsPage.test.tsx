import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationsPage } from "./ApplicationsPage";

vi.mock("../../lib/api/phase2", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/api/phase2")>();
  return {
    ...actual,
    applicationsApi: {
      ...actual.applicationsApi,
      list: vi.fn().mockResolvedValue({ items: [], next_cursor: null, total: 0 }),
      board: vi.fn().mockResolvedValue({}),
    },
    catalogueApi: {
      ...actual.catalogueApi,
      programmes: vi.fn().mockResolvedValue([]),
      scholarships: vi.fn().mockResolvedValue([]),
    },
    discoveryApi: {
      ...actual.discoveryApi,
      recommendations: vi.fn().mockResolvedValue({
        disclaimer: "Matches are indicative, not a decision prediction.",
        items: [
          {
            type: "programme",
            id: "prog-1",
            name: "MSc Data Science",
            institution_id: "inst-1",
            institution_name: "Example University",
            reasons: ["Matches your target field of study"],
            score: 82,
          },
        ],
      }),
    },
  };
});

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/app/applications"]}>
        <ApplicationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ApplicationsPage onboarding recommendations", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("opens the prefilled create dialog when a recommendation is clicked from the same route", async () => {
    renderPage();

    expect(await screen.findByText("MSc Data Science")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: /create application/i }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Add application" })).toBeInTheDocument(),
    );
  });
});
