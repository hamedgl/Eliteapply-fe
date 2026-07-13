import { afterEach, describe, expect, it, vi } from "vitest";
import {
  documentText,
  interviewsApi,
  mergeText,
  notificationsApi,
  referencesApi,
  remindersApi,
} from "../lib/api/phase3";
import { selectInterviewAudioType } from "../features/interviews/InterviewPage";
import { safeNotificationPath } from "../lib/navigation";
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("Phase 3 security and content adapters", () => {
  it("preserves unknown content keys when editing text", () => {
    expect(
      mergeText({ blocks: [], backend_extension: { safe: true } }, "Draft"),
    ).toEqual({ blocks: [], backend_extension: { safe: true }, text: "Draft" });
  });
  it("reads guarded text and never renders arbitrary objects", () => {
    expect(
      documentText({
        blocks: [{ text: "One" }, { unknown: true }, { text: "Two" }],
      }),
    ).toBe("One\n\n\n\nTwo");
  });
  it("sends reference code as a header, never query or storage", async () => {
    const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
      expect(String(input)).not.toContain("secret-code");
      expect(new Headers(init?.headers).get("X-Reference-Code")).toBe(
        "secret-code",
      );
      return Response.json({ status: "open" });
    });
    vi.stubGlobal("fetch", fetchMock);
    await referencesApi.refereeGet("token-value", "secret-code");
    expect(localStorage.length).toBe(0);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it("prevents duplicate referee submission by allowing callers to disable after first await", async () => {
    let resolve!: () => void;
    const pending = new Promise<void>((r) => {
      resolve = r;
    });
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls++;
        await pending;
        return Response.json({ ok: true });
      }),
    );
    const request = referencesApi.refereeSubmit("token", "code", {
      decision: "approve",
      final_content: "A".repeat(50),
      referee_display_name: "Dr Maya Patel",
      relationship_confirmation: true,
      authenticity_attestation: true,
      authority_consent: true,
    });
    expect(calls).toBe(1);
    resolve();
    await request;
  });

  it("keeps server ownership of interview questions", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toEqual({
        mutation_id: "mutation-id",
        answer: "My answer",
      });
      return Response.json({ id: "turn" });
    });
    vi.stubGlobal("fetch", fetchMock);
    await interviewsApi.answer("interview-id", {
      mutation_id: "mutation-id",
      answer: "My answer",
    });
  });

  it("uses contract cursors and filters for Phase 3 lists", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json({ items: [], next_cursor: null, has_more: false }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await notificationsApi.list(true, "next/value");
    await remindersApi.list({ aggregateType: "reference", status: "scheduled", cursor: "next" });
    expect(String(fetchMock.mock.calls[0][0])).toContain("unreadOnly=true&cursor=next%2Fvalue");
    expect(String(fetchMock.mock.calls[1][0])).toContain("aggregateType=reference&status=scheduled&cursor=next");
  });

  it("allowlists notification deep links to internal app routes", () => {
    expect(safeNotificationPath({ path: "/app/references/123?tab=events" })).toBe("/app/references/123?tab=events");
    expect(safeNotificationPath({ url: "https://attacker.test/app/references" })).toBeNull();
    expect(safeNotificationPath({ path: "/login" })).toBeNull();
  });

  it("selects only an audio MIME type supported by the contract and browser", () => {
    expect(selectInterviewAudioType((type) => type === "audio/mp4")).toBe("audio/mp4");
    expect(selectInterviewAudioType(() => false)).toBeNull();
  });
});
