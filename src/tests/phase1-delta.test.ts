import { afterEach, describe, expect, it, vi } from "vitest";
import { billingApi } from "../lib/api/billing";
import { downloadResponse } from "../lib/api/download";
import { mutationIdFor } from "../lib/api/mutations";
import { applicationsApi } from "../lib/api/phase2";
import { writingApi } from "../lib/api/phase3";
import { readFileSync } from "node:fs";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Phase 1 delta helpers", () => {
  it("requests the next usage cursor without changing its value", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      Response.json({
        period: "current",
        summary: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
          metered_tokens: 0,
          cost_usd: 0,
          request_count: 0,
        },
        logs: { items: [], next_cursor: null, has_more: false, total: 0 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await billingApi.usage("next/cursor");

    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "cursor=next%2Fcursor",
    );
  });

  it("saves binary downloads using the server filename", async () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    });

    await downloadResponse(
      new Response("file", {
        headers: {
          "content-type": "application/pdf",
          "content-disposition": 'attachment; filename="transcript.pdf"',
        },
      }),
      "fallback.pdf",
    );

    expect(click).toHaveBeenCalledOnce();
  });

  it("keeps a mutation id stable for the same logical action", () => {
    const registry = new Map<string, string>();
    expect(mutationIdFor(registry, "checkout:pro")).toBe(
      mutationIdFor(registry, "checkout:pro"),
    );
    expect(mutationIdFor(registry, "checkout:pro")).not.toBe(
      mutationIdFor(registry, "checkout:team"),
    );
  });

  it("preserves application cursors and server filter names", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      Response.json({ items: [], next_cursor: null, has_more: false }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await applicationsApi.list({
      cursor: "next/value",
      applicationType: "scholarship",
      archived: true,
    });
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("cursor=next%2Fvalue");
    expect(url).toContain("applicationType=scholarship");
    expect(url).toContain("archived=true");
  });

  it("sends the explicit Writing Studio archive filter", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      Response.json([]),
    );
    vi.stubGlobal("fetch", fetchMock);
    await writingApi.list(undefined, true);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "includeArchived=true",
    );
  });

  it("represents every committed OpenAPI path and schema in generated types", () => {
    const contract = JSON.parse(
      readFileSync("docs/api/openapi.json", "utf8"),
    ) as {
      paths: Record<string, unknown>;
      components: { schemas: Record<string, unknown> };
    };
    const generated = readFileSync("src/generated/api/schema.ts", "utf8");
    // Hardcoded counts, not a self-comparison: this guards against
    // openapi.json changing without `npm run api:generate` being rerun.
    expect(Object.keys(contract.paths)).toHaveLength(198);
    expect(Object.keys(contract.components.schemas)).toHaveLength(241);
    for (const path of Object.keys(contract.paths))
      expect(generated).toContain(`"${path}"`);
    for (const schema of Object.keys(contract.components.schemas))
      expect(generated).toContain(`${schema}:`);
  });
});
