import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OverflowMenu } from "./OverflowMenu";

describe("OverflowMenu", () => {
  it("renders outside clipping ancestors and runs actions", async () => {
    const onClick = vi.fn();
    const Icon = () => null;
    const { container } = render(
      <div className="app-shell">
        <div data-testid="clipping-parent" style={{ overflow: "hidden" }}>
          <OverflowMenu label="More actions" items={[{ key: "edit", label: "Edit", icon: Icon, onClick }]} />
        </div>
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    const menu = await screen.findByRole("menu");
    expect(screen.getByTestId("clipping-parent")).not.toContainElement(menu);
    expect(container.querySelector(".app-shell")).toContainElement(menu);

    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
