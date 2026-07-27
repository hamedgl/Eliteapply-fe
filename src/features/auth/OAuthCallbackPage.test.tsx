import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OAuthCallbackPage } from "./OAuthCallbackPage";
import { useSession } from "../../lib/auth/session";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  useSession.getState().clearSession();
  document.cookie = "eliteapply_csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route path="/app/dashboard" element={<div>Dashboard landed</div>} />
        <Route path="/app/documents" element={<div>Documents landed</div>} />
        <Route path="/login" element={<div>Back on login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("OAuthCallbackPage", () => {
  it("refreshes the session and lands on the dashboard on success", async () => {
    document.cookie = "eliteapply_csrf_token=csrf-token; path=/";
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith("/auth/refresh")) {
        return Response.json({
          access_token: "access-1",
          id_token: "id-1",
          expires_in: 900,
        });
      }
      throw new Error(`unexpected fetch: ${input}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderAt("/auth/callback?login=success");

    await waitFor(() => expect(screen.getByText("Dashboard landed")).toBeInTheDocument());
    expect(useSession.getState().status).toBe("authenticated");
    expect(useSession.getState().accessToken).toBe("access-1");
  });

  it("honours a validated return_to path", async () => {
    document.cookie = "eliteapply_csrf_token=csrf-token; path=/";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ access_token: "access-2", id_token: "id-2", expires_in: 900 }),
      ),
    );

    renderAt("/auth/callback?login=success&return_to=%2Fapp%2Fdocuments");

    await waitFor(() => expect(screen.getByText("Documents landed")).toBeInTheDocument());
  });

  it("redirects to login with the error code when the provider denied access", async () => {
    renderAt("/auth/callback?error=oauth_provider_denied");
    await waitFor(() => expect(screen.getByText("Back on login")).toBeInTheDocument());
  });

  it("redirects to login when the callback has no login=success flag", async () => {
    renderAt("/auth/callback");
    await waitFor(() => expect(screen.getByText("Back on login")).toBeInTheDocument());
  });

  it("shows an inline error if the refresh call itself fails", async () => {
    document.cookie = "eliteapply_csrf_token=csrf-token; path=/";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ detail: "nope" }), { status: 401 })),
    );

    renderAt("/auth/callback?login=success");

    await waitFor(() =>
      expect(screen.getByText(/couldn.t complete sign-in/i)).toBeInTheDocument(),
    );
  });
});
