import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConsentGate } from "./ConsentGate";
import { useSession } from "../../lib/auth/session";
import { productConfig } from "../../lib/config/product";
import type { AuthenticatedUser } from "../../lib/auth/auth-types";

function userWith(consentVersion: string | null): AuthenticatedUser {
  return {
    id: "user-1",
    email: "someone@example.com",
    full_name: "Someone",
    consent_version: consentVersion,
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
  it("stays out of the way once the stored consent matches the current terms", () => {
    useSession.getState().setUser(userWith(productConfig.legal.currentTermsVersion));

    render(
      <MemoryRouter>
        <ConsentGate />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("heading", { name: "One last step" })).toBeNull();
  });

  it("asks an OAuth signup for consent, then stops asking once it is recorded", async () => {
    useSession.getState().setUser(userWith(null));
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json({
        ...userWith(productConfig.legal.currentTermsVersion),
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
    });

    await waitFor(() => expect(screen.queryByRole("heading", { name: "One last step" })).toBeNull());
  });
});
