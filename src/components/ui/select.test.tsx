import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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

    fireEvent.click(screen.getByRole("button", { name: "Scope" }));
    fireEvent.pointerDown(
      screen.getByRole("option", { name: "View and comment" }),
    );
    expect(new FormData(form).get("scope")).toBe("comment");

    fireEvent.reset(form);
    await waitFor(() => expect(new FormData(form).get("scope")).toBe("view"));
  });
});
