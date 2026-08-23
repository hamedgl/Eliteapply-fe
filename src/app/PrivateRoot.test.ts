import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchUserWithRetry } from "./PrivateRoot";
import { usersApi } from "../lib/api/users";

vi.mock("../lib/api/users", () => ({
  usersApi: { me: vi.fn() },
}));

describe("fetchUserWithRetry", () => {
  afterEach(() => {
    vi.mocked(usersApi.me).mockReset();
    vi.useRealTimers();
  });

  it("returns the profile from the first attempt when it succeeds", async () => {
    const user = { id: "u1" };
    vi.mocked(usersApi.me).mockResolvedValue(user as never);

    await expect(fetchUserWithRetry()).resolves.toBe(user);
    expect(usersApi.me).toHaveBeenCalledOnce();
  });

  it("retries once after a transient failure instead of leaving the session profile-less", async () => {
    vi.useFakeTimers();
    const user = { id: "u1" };
    vi.mocked(usersApi.me)
      .mockRejectedValueOnce(new Error("network blip"))
      .mockResolvedValueOnce(user as never);

    const promise = fetchUserWithRetry();
    await vi.advanceTimersByTimeAsync(1000);

    await expect(promise).resolves.toBe(user);
    expect(usersApi.me).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("propagates the error when both attempts fail", async () => {
    vi.useFakeTimers();
    vi.mocked(usersApi.me).mockRejectedValue(new Error("still down"));

    const promise = fetchUserWithRetry();
    // Attach a rejection handler immediately so the fake-timer advance below
    // doesn't race an unhandled-rejection warning against the assertion.
    const settled = promise.catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(1000);

    await expect(settled).resolves.toMatchObject({ message: "still down" });
    expect(usersApi.me).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
