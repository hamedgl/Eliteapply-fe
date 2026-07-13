import { afterEach, describe, expect, it, vi } from "vitest";
import { catalogueApi, intelligenceApi } from "../lib/api/phase2";
import { publicShareApi, writingApi } from "../lib/api/phase3";
import { sanitizePreviewHtml } from "../lib/safeHtml";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Phase 2 contract and security adapters", () => {
  it("preserves catalogue cursors and every supported programme filter", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      Response.json({ items: [], next_cursor: null, has_more: false }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await catalogueApi.programmes({
      search: "policy",
      institutionId: "institution-id",
      country: "GB",
      degreeLevel: "masters",
      fieldOfStudy: "public policy",
      cursor: "next/value",
      verified: true,
    });
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("cursor=next%2Fvalue");
    expect(url).toContain("institutionId=institution-id");
    expect(url).toContain("degreeLevel=masters");
    expect(url).toContain("fieldOfStudy=public+policy");
    expect(url).toContain("verified=true");
  });

  it("uses the explicit import retry and eligibility history endpoints", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      Response.json({ items: [], next_cursor: null, has_more: false }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await intelligenceApi.retryImport("import-id");
    await intelligenceApi.eligibilityHistory("application-id", "next");
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/application-intelligence/imports/import-id/retry",
    );
    expect(String(fetchMock.mock.calls[1][0])).toContain(
      "/eligibility/history?cursor=next",
    );
  });

  it("uses generation-run lifecycle endpoints", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      Response.json([]),
    );
    vi.stubGlobal("fetch", fetchMock);
    await writingApi.generationRuns("document-id");
    await writingApi.cancelGeneration("run-id");
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/documents/document-id/generation-runs",
    );
    expect(String(fetchMock.mock.calls[1][0])).toContain(
      "/generation-runs/run-id/cancel",
    );
  });

  it("sends public share passcodes only in the request header", async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).not.toContain("correct-horse");
        expect(new Headers(init?.headers).get("X-Share-Passcode")).toBe(
          "correct-horse",
        );
        return Response.json({
          title: "Statement",
          html: "<p>Draft</p>",
          scope: "view",
          word_count: 1,
          character_count: 5,
        });
      },
    );
    vi.stubGlobal("fetch", fetchMock);
    await publicShareApi.get("share-token", "correct-horse");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("removes active content and unsafe links from preview HTML", () => {
    const html = sanitizePreviewHtml(
      '<script>alert(1)</script><p onclick="steal()">Safe</p><a href="javascript:steal()">bad</a><a href="https://example.edu">source</a>',
    );
    expect(html).not.toContain("script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="https://example.edu"');
  });
});
