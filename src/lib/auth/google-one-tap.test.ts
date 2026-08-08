import { afterEach, describe, expect, it, vi } from "vitest";
import { initGoogleOneTap } from "./google-one-tap";
import { clearAuthenticatedClientState } from "./auth-cleanup";

function stubGoogleIdentity() {
  const initialize = vi.fn();
  const prompt = vi.fn();
  const cancel = vi.fn();
  const disableAutoSelect = vi.fn();
  window.google = { accounts: { id: { initialize, prompt, cancel, disableAutoSelect } } };
  return { initialize, prompt, cancel, disableAutoSelect };
}

afterEach(() => {
  delete window.google;
  vi.restoreAllMocks();
});

describe("initGoogleOneTap", () => {
  it("initializes with auto_select so returning users sign in without a click", async () => {
    const { initialize, prompt } = stubGoogleIdentity();

    await initGoogleOneTap({ clientId: "client-123", onCredential: vi.fn() });

    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: "client-123", auto_select: true }),
    );
    expect(prompt).toHaveBeenCalledOnce();
  });

  it("forwards the credential from Google's callback", async () => {
    const { initialize } = stubGoogleIdentity();
    const onCredential = vi.fn();

    await initGoogleOneTap({ clientId: "client-123", onCredential });
    const config = initialize.mock.calls[0][0];
    config.callback({ credential: "signed-jwt", select_by: "auto" });

    expect(onCredential).toHaveBeenCalledWith("signed-jwt");
  });

  it("returns a cancel function that calls google.accounts.id.cancel", async () => {
    const { cancel } = stubGoogleIdentity();

    const stop = await initGoogleOneTap({ clientId: "client-123", onCredential: vi.fn() });
    stop();

    expect(cancel).toHaveBeenCalledOnce();
  });

  it("disables auto-select when the session is cleared (e.g. logout)", async () => {
    const { disableAutoSelect } = stubGoogleIdentity();
    await initGoogleOneTap({ clientId: "client-123", onCredential: vi.fn() });

    clearAuthenticatedClientState("logout");

    expect(disableAutoSelect).toHaveBeenCalledOnce();
  });
});
