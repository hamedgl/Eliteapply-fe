import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SampleDataNotice } from "./SampleDataNotice";
import { usersApi } from "../../../lib/api/users";
import { useSession } from "../../../lib/auth/session";
import type { AuthenticatedUser } from "../../../lib/auth/auth-types";

vi.mock("../../../lib/api/users", () => ({
  usersApi: { dismissSampleNotice: vi.fn() },
}));

const profile = (seededAt: string | null) =>
  ({
    id: "user-1",
    email: "student@example.com",
    sample_data_seeded_at: seededAt,
  }) as unknown as AuthenticatedUser;

function renderNotice() {
  return render(
    <MemoryRouter>
      <SampleDataNotice />
    </MemoryRouter>,
  );
}

describe("SampleDataNotice", () => {
  beforeEach(() => {
    vi.mocked(usersApi.dismissSampleNotice).mockReset();
    useSession.setState({ user: null });
  });

  it("stays hidden for an account that was never seeded", () => {
    // Null is the state for every pre-existing account and for a signup whose seeding
    // failed. Neither has anything to announce.
    useSession.setState({ user: profile(null) });
    renderNotice();
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  it("shows once the profile carries a seeded timestamp", () => {
    useSession.setState({ user: profile("2026-08-24T10:00:00Z") });
    renderNotice();
    expect(
      screen.getByRole("heading", {
        name: /We added a few examples to get you started/i,
      }),
    ).toBeVisible();
  });

  it("hides after dismissal by adopting the profile the API returns", async () => {
    // Visibility is server state, not a local flag: the notice must disappear because
    // the API cleared sample_data_seeded_at, so it stays dismissed on another device.
    useSession.setState({ user: profile("2026-08-24T10:00:00Z") });
    vi.mocked(usersApi.dismissSampleNotice).mockResolvedValue(
      profile(null) as never,
    );
    renderNotice();

    await userEvent.click(
      screen.getByRole("button", { name: /Dismiss the sample data notice/i }),
    );

    await waitFor(() => expect(screen.queryByRole("complementary")).toBeNull());
    expect(usersApi.dismissSampleNotice).toHaveBeenCalledOnce();
    expect(useSession.getState().user?.sample_data_seeded_at).toBeNull();
  });

  it("keeps the notice and re-enables the button when dismissal fails", async () => {
    // Informational UI: a failed dismiss must not surface an error, but it also must
    // not pretend to have worked — the next click has to be able to retry.
    useSession.setState({ user: profile("2026-08-24T10:00:00Z") });
    vi.mocked(usersApi.dismissSampleNotice).mockRejectedValue(
      new Error("offline"),
    );
    renderNotice();

    const button = screen.getByRole("button", {
      name: /Dismiss the sample data notice/i,
    });
    await userEvent.click(button);

    await waitFor(() => expect(button).not.toBeDisabled());
    expect(screen.getByRole("complementary")).toBeVisible();
  });
});
