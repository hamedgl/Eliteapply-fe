import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SampleBadge } from "./SampleBadge";

describe("SampleBadge", () => {
  it("renders nothing for user-created rows", () => {
    // Call sites drop this in unconditionally, so false must produce no markup at all
    // rather than an empty pill.
    const { container } = render(<SampleBadge isSample={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the field is absent", () => {
    // Defensive: an older cached response, or a surface whose type predates is_sample.
    const { container } = render(<SampleBadge isSample={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("labels seeded rows", () => {
    // The API's SampleDataService is explicit that this badge, not the row's generic
    // content, is what tells the user the row is demo data.
    render(<SampleBadge isSample />);
    expect(screen.getByText("Sample")).toBeVisible();
  });
});
