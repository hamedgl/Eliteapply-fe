import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AiNotice } from "./AiNotice";

describe("AiNotice", () => {
  it("links to the transparency page as a normal same-tab navigation by default", () => {
    render(<AiNotice>Disclosure text</AiNotice>);
    const link = screen.getByRole("link", { name: /how eliteapply uses ai/i });
    expect(link).toHaveAttribute("href", "/ai-transparency");
    expect(link).not.toHaveAttribute("target");
  });

  it("opens in a new tab when placed above unsaved form state, so the disclosure can't navigate the draft away", () => {
    render(<AiNotice openInNewTab>Disclosure text</AiNotice>);
    const link = screen.getByRole("link", { name: /how eliteapply uses ai/i });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
