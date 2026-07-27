import { afterEach, describe, expect, it, vi } from "vitest";
import { publicShareApi } from "../lib/api/phase3";
import { ApiError, normalizeApiError } from "../lib/api/errors";
import { sanitizePreviewHtml } from "../lib/safeHtml";
import { useSession } from "../lib/auth/session";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function stubFetch(response: () => Response) {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => response());
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("share-link requests", () => {
  it("sends the passcode as a header and never as a query parameter", async () => {
    const fetchMock = stubFetch(() => Response.json({ title: "Draft", html: "" }));

    await publicShareApi.get("tok-en", "hunter42");

    const url = String(fetchMock.mock.calls[0][0]);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(url).toContain("/share/tok-en");
    expect(url).not.toContain("hunter42");
    expect(new Headers(init.headers).get("X-Share-Passcode")).toBe("hunter42");
  });

  it("omits the passcode header entirely when there is none", async () => {
    const fetchMock = stubFetch(() => Response.json({ title: "Draft", html: "" }));

    await publicShareApi.get("tok-en");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).has("X-Share-Passcode")).toBe(false);
  });

  it("does not attach the session Authorization header to public share calls", async () => {
    // A signed-in owner may open their own share link; the request must still go
    // out unauthenticated so the token, not the session, decides access.
    useSession.setState({ accessToken: "owner-session-token" });
    const fetchMock = stubFetch(() => Response.json([]));

    await publicShareApi.comments("tok-en", "hunter42");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).has("Authorization")).toBe(false);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/share/tok-en/comments");
    useSession.setState({ accessToken: null });
  });

  it("posts a comment to the token's thread", async () => {
    const fetchMock = stubFetch(() =>
      Response.json({
        id: "c1",
        author_label: "Prof A",
        body: "Tighten this",
        resolved: false,
        created_at: new Date().toISOString(),
      }),
    );

    await publicShareApi.comment("tok-en", { author_label: "Prof A", body: "Tighten this" });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(String(fetchMock.mock.calls[0][0])).toContain("/share/tok-en/comments");
  });
});

describe("passcode error codes", () => {
  // The page branches on these to decide between prompting, re-prompting with an
  // error, showing a lockout, and showing "link no longer available".
  it.each([
    ["share_passcode_required", 403],
    ["share_passcode_invalid", 403],
    ["share_passcode_locked", 403],
  ])("surfaces %s from the response body", async (code, status) => {
    const error = await normalizeApiError(
      new Response(JSON.stringify({ code, message: "nope" }), {
        status,
        headers: { "content-type": "application/json" },
      }),
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe(code);
  });

  it("falls back to a generic code for a revoked or unknown link", async () => {
    const error = await normalizeApiError(
      new Response(JSON.stringify({ detail: "Share link not found or expired" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
    );
    expect(error.code).toBe("NOT_FOUND");
  });
});

describe("shared document body sanitisation", () => {
  it("drops scripts, event handlers, and non-allowlisted tags", () => {
    const clean = sanitizePreviewHtml(
      '<p onclick="steal()">Hi</p><script>steal()</script><iframe src="x"></iframe>',
    );
    expect(clean).toContain("Hi");
    expect(clean).not.toContain("onclick");
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("<iframe");
  });

  it("keeps http links but forces them to open safely", () => {
    const clean = sanitizePreviewHtml('<a href="https://example.com">docs</a>');
    expect(clean).toContain('href="https://example.com"');
    expect(clean).toContain('rel="noreferrer noopener"');
  });

  it("strips javascript: URLs", () => {
    const clean = sanitizePreviewHtml('<a href="javascript:alert(1)">x</a>');
    expect(clean).not.toContain("javascript:");
  });
});
