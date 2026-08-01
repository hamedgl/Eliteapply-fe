import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { GeneratedPageSkeleton, RoutePageSkeleton } from "./PageSkeleton";

describe("page skeletons", () => {
  it("renders the requested backend-shaped table fields", () => {
    const { container } = render(
      <GeneratedPageSkeleton page="applicationsList" />,
    );

    expect(
      screen.getByRole("status", { name: "Loading applications" }),
    ).toHaveAttribute("aria-busy", "true");
    expect(
      container.querySelector('[data-columns="9"][data-selection]'),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".page-skeleton-data-row")).toHaveLength(
      6,
    );
  });

  it("keeps route fallbacks aligned with query-selected layouts", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/app/reminders?view=calendar"]}>
        <RoutePageSkeleton />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("status", { name: "Loading reminders calendar" }),
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll(".page-skeleton-calendar-grid > span"),
    ).toHaveLength(35);
  });

  it("derives section-specific profile structure from the route", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/app/academic-profile?section=research"]}>
        <RoutePageSkeleton />
      </MemoryRouter>,
    );

    expect(
      container.querySelector('[data-section="research"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll(".page-skeleton-profile-entries > span"),
    ).toHaveLength(2);
    expect(
      container.querySelectorAll(".page-skeleton-profile-layout nav > span"),
    ).toHaveLength(7);
  });
});
