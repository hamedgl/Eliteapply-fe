import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { LegalPage } from "./LegalPage";
import { productConfig } from "../../lib/config/product";

afterEach(cleanup);

/** The clauses below are the ones a consumer regulator looks for. Losing any of
    them silently is the failure mode this test exists to catch. */
describe("Terms of Service", () => {
  it("carries the EU and US consumer clauses the paid product requires", () => {
    render(
      <MemoryRouter>
        <LegalPage kind="terms" />
      </MemoryRouter>,
    );

    for (const heading of [
      "Paid plans, tokens and automatic renewal",
      "Right of withdrawal (EU, EEA and UK consumers)",
      "Your statutory consumer rights",
      "Information for customers in the United States",
      "Reporting illegal content or a rights infringement",
    ])
      expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument();

    expect(screen.getByText(/renew automatically/i)).toBeInTheDocument();
    expect(screen.getByText(/do not require arbitration/i)).toBeInTheDocument();
    expect(screen.getByText(/14 days from the day the contract is concluded/)).toBeInTheDocument();
  });

  it("keeps the recorded acceptance version aligned with the effective date", () => {
    render(
      <MemoryRouter>
        <LegalPage kind="terms" />
      </MemoryRouter>,
    );

    // Registration stores this version against the account, so a terms rewrite
    // that forgets to bump it records the wrong consent.
    const effective = screen.getByText("Effective").nextElementSibling?.textContent;
    expect(new Date(`${effective} UTC`).toISOString().slice(0, 10)).toBe(
      productConfig.legal.currentTermsVersion,
    );
  });
});
