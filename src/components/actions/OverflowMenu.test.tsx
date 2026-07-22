import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OverflowMenu } from "./OverflowMenu";

describe("OverflowMenu", () => {
  it("renders outside clipping ancestors and runs actions", async () => {
    const onClick = vi.fn();
    const Icon = () => null;
    const { container } = render(
      <div className="app-shell">
        <section className="apps-drawer" data-testid="drawer">
          <div data-testid="clipping-parent" style={{ overflow: "hidden" }}>
            <OverflowMenu
              label="More actions"
              items={[{ key: "edit", label: "Edit", icon: Icon, onClick }]}
            />
          </div>
        </section>
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    const menu = await screen.findByRole("menu");
    expect(
      screen.getByRole("menuitem", { name: "Edit" }).querySelector("span"),
    ).toHaveTextContent("Edit");
    expect(screen.getByTestId("clipping-parent")).not.toContainElement(menu);
    expect(screen.getByTestId("drawer")).toContainElement(menu);
    expect(container.querySelector(".app-shell")).toContainElement(menu);

    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
