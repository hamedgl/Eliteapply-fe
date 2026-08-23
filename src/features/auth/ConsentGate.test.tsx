import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConsentGate } from "./ConsentGate";
import { useSession } from "../../lib/auth/session";
import { productConfig } from "../../lib/config/product";
import type { AuthenticatedUser } from "../../lib/auth/auth-types";

function userWith(
  consentVersion: string | null,
  ageConfirmedAt: string | null = null,
  marketingOptIn = false,
): AuthenticatedUser {
  return {
    id: "user-1",
    email: "someone@example.com",
    full_name: "Someone",
    consent_version: consentVersion,
    age_confirmed_at: ageConfirmedAt,
    marketing_opt_in: marketingOptIn,
  } as AuthenticatedUser;
}

beforeEach(() => {
  // jsdom has no native <dialog> modal support.
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
});

afterEach(() => {
  cleanup();
  useSession.getState().setUser(null);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ConsentGate", () => {
  it("stays out of the way once the stored consent and age confirmation match", () => {
    useSession
      .getState()
      .setUser(userWith(productConfig.legal.currentTermsVersion, "2026-01-01T00:00:00Z"));

    render(
      <MemoryRouter>
        <ConsentGate />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("heading", { name: "One last step" })).toBeNull();
  });

  it("re-prompts a user with current terms consent but no recorded age confirmation", () => {
    // A pre-existing account (or an OAuth login-mode click, which no longer sends
    // age_confirmed at all) can have a matching consent_version but a null
    // age_confirmed_at — that must still trip the gate.
    useSession.getState().setUser(userWith(productConfig.legal.currentTermsVersion, null));

    render(
      <MemoryRouter>
        <ConsentGate />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "One last step" })).toBeTruthy();
  });

  it("preserves an already-opted-in user's marketing preference when only age is missing", async () => {
    useSession
      .getState()
      .setUser(userWith(productConfig.legal.currentTermsVersion, null, true));
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json(userWith(productConfig.legal.currentTermsVersion, "2026-01-01T00:00:00Z", true)),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <ConsentGate />
      </MemoryRouter>,
    );

    // Confirming age only, without touching the marketing checkbox at all.
    expect(screen.getByRole("checkbox")).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Accept and continue" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.marketing_opt_in).toBe(true);
  });

  it("asks an OAuth signup for consent, then stops asking once it is recorded", async () => {
    useSession.getState().setUser(userWith(null));
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json({
        ...userWith(productConfig.legal.currentTermsVersion, "2026-01-01T00:00:00Z"),
        marketing_opt_in: true,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <ConsentGate />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "One last step" })).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Accept and continue" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(String(fetchMock.mock.calls[0][0])).toContain("/users/me/consent");
    expect(body).toEqual({
      accepted_terms_version: productConfig.legal.currentTermsVersion,
      marketing_opt_in: true,
      age_confirmed: true,
    });

    await waitFor(() => expect(screen.queryByRole("heading", { name: "One last step" })).toBeNull());
  });
});
