import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Select } from "./select";

describe("Select", () => {
  it("keeps HTML form values in sync and restores the default on reset", async () => {
    const { container } = render(
      <form>
        <Select
          ariaLabel="Scope"
          name="scope"
          defaultValue="view"
          options={[
            { value: "view", label: "View only" },
            { value: "comment", label: "View and comment" },
          ]}
        />
      </form>,
    );
    const form = container.querySelector("form")!;

    fireEvent.click(screen.getByRole("combobox", { name: "Scope" }));
    fireEvent.pointerDown(
      screen.getByRole("option", { name: "View and comment" }),
    );
    expect(new FormData(form).get("scope")).toBe("comment");

    fireEvent.reset(form);
    await waitFor(() => expect(new FormData(form).get("scope")).toBe("view"));
  });
  it("moves the highlight with the arrow keys and only commits on Enter", () => {
    const onChange = vi.fn();
    render(
      <Select
        ariaLabel="Sharing"
        value="view"
        onChange={onChange}
        options={[
          { value: "view", label: "View only" },
          { value: "blocked", label: "Unavailable", disabled: true },
          { value: "edit", label: "View and edit" },
        ]}
      />,
    );
    const trigger = screen.getByRole("combobox", { name: "Sharing" });

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    // Arrowing past the disabled option must not fire onChange for anything
    // it passes over — it only moves aria-activedescendant.
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "View and edit" }).id,
    );

    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toBe("edit");
  });
});
