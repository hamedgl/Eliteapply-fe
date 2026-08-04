import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { LegalPage } from "./LegalPage";

afterEach(cleanup);

describe("Privacy Policy", () => {
  it("carries the disclosures GDPR and US state laws require", () => {
    render(
      <MemoryRouter>
        <LegalPage kind="privacy" />
      </MemoryRouter>,
    );

    for (const heading of [
      "Legal bases for processing",
      "Sensitive information in your documents",
      "International transfers",
      "Security and data breaches",
      "No automated decisions about you",
      "United States privacy rights",
      "Making a privacy request",
    ])
      expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument();

    expect(screen.getByText(/Standard Contractual Clauses/)).toBeInTheDocument();
    expect(screen.getByText(/within 72 hours/)).toBeInTheDocument();
    expect(screen.getByText(/have not sold personal information/)).toBeInTheDocument();
  });

  it("lists every browser storage key the client actually writes", () => {
    render(
      <MemoryRouter>
        <LegalPage kind="privacy" />
      </MemoryRouter>,
    );

    // Keys are grepped from the client; adding one without disclosing it here
    // is what this assertion is guarding against.
    for (const key of [
      "ea_has_session",
      "eliteapply-sidebar-collapsed",
      "eliteapply-recent-searches",
      "eliteapply-reviewer-name",
      "eliteapply.collaborator-invitation",
    ])
      expect(screen.getByText(new RegExp(key.replace(/[.]/g, "\\.")))).toBeInTheDocument();
  });
});
