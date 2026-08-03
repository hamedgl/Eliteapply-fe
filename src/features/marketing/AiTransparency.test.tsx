import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { LegalPage } from "./LegalPage";
import { AiNotice } from "../../components/common/AiNotice";
import { getPageSeo } from "../../seo/site";

afterEach(cleanup);

describe("AI transparency notice", () => {
  it("states the Art. 50 disclosures the product relies on", () => {
    render(
      <MemoryRouter>
        <LegalPage kind="ai" />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "AI Transparency Notice" }),
    ).toBeInTheDocument();
    // The prohibited-practice limits are the load-bearing claims of the page.
    expect(screen.getByText(/No emotion recognition/)).toBeInTheDocument();
    expect(screen.getByText(/No biometric identification/)).toBeInTheDocument();
    expect(screen.getByText(/No social scoring/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Regulation \(EU\) 2024\/1689/ }),
    ).toHaveAttribute("href", "https://eur-lex.europa.eu/eli/reg/2024/1689/oj");
  });

  it("is indexable and reachable at /ai-transparency", () => {
    const seo = getPageSeo("/ai-transparency");
    expect(seo.indexable).toBe(true);
    expect(seo.canonical).toBe("https://eliteapply.net/ai-transparency");
  });

  it("points every AI surface at that notice and shows run provenance", () => {
    render(<AiNotice provenance="Model gpt-x · Prompt v2">Written by AI.</AiNotice>);

    expect(screen.getByRole("link", { name: /How EliteApply uses AI/ })).toHaveAttribute(
      "href",
      "/ai-transparency",
    );
    expect(screen.getByText("Model gpt-x · Prompt v2")).toBeInTheDocument();
  });
});
