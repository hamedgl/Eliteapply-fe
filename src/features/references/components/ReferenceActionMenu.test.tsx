import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Reference } from "../model";
import { ReferenceActionMenu } from "./ReferenceActionMenu";

const base = {
  id: "reference-id",
  referee_name: "Professor Example",
  status: "invited",
  approved_at: null,
  revoked_at: null,
  confidential: false,
  mode: "referee_direct",
} as Reference;

describe("ReferenceActionMenu", () => {
  it("does not offer backend-invalid actions for pending or revoked references", () => {
    const { rerender } = render(<ReferenceActionMenu reference={base} pending={false} onAction={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /More actions/ }));
    expect(screen.queryByRole("menuitem", { name: "Revoke request" })).not.toBeInTheDocument();

    rerender(
      <ReferenceActionMenu
        reference={{ ...base, status: "revoked", approved_at: "2026-07-20T00:00:00Z", revoked_at: "2026-07-21T00:00:00Z" }}
        pending={false}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByRole("menuitem", { name: "Download verification certificate" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /Download reference/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Attach to application" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Revoke request" })).not.toBeInTheDocument();
  });
});
