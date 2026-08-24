import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { productConfig } from "../../lib/config/product";
import { OAuthButtons } from "./OAuthButtons";

afterEach(cleanup);

describe("OAuthButtons", () => {
  it("records consent when Google sign-in creates a new account", () => {
    render(
      <MemoryRouter>
        <OAuthButtons mode="login" returnTo="/app/applications" />
      </MemoryRouter>,
    );

    const href = screen.getByRole("link", { name: "Sign in with Google" }).getAttribute("href");
    const url = new URL(href!, "https://eliteapply.net");

    expect(url.searchParams.get("accepted_terms_version")).toBe(
      productConfig.legal.currentTermsVersion,
    );
    expect(url.searchParams.get("age_confirmed")).toBe("true");
    expect(url.searchParams.get("return_to")).toBe("/app/applications");
    expect(screen.getByText(/you confirm you meet the minimum age/i)).toBeTruthy();
  });
});
