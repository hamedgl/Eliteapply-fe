import { afterEach, describe, expect, it, vi } from "vitest";
import { parseBoard, stages } from "../features/applications/model";
import { uploadAcademicDocument } from "../lib/api/phase2";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Phase 2 adapters", () => {
  it("creates every board stage and drops malformed cards", () => {
    const board = parseBoard({ columns: { researching: [{ id: "1", title: "MSc", version: 1, stage: "researching" }, { bad: true }], unexpected: [{ id: "2", title: "No", version: 1 }] } });
    expect(Object.keys(board.columns)).toEqual(stages);
    expect(board.columns.researching).toHaveLength(1);
    expect(board.total).toBe(1);
  });

  it("uses the exact signed PUT upload then registers metadata", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL, init?: RequestInit) => {
      calls.push(`${init?.method ?? "GET"} ${String(input)}`);
      if (String(input).includes("upload-url")) return Response.json({ storage_key: "academic/123456789", upload_url: "https://storage.example/file", upload_method: "PUT", upload_fields: {}, max_size_bytes: 1000 });
      if (String(input) === "https://storage.example/file") return new Response("", { status: 200 });
      if (String(input).endsWith("/academic-documents")) return Response.json({ id: "d1", category: "transcript", display_name: "x.pdf", storage_key: "academic/123456789", content_type: "application/pdf", size_bytes: 3, tags: [], malware_status: "pending", created_at: new Date().toISOString() }, { status: 201 });
      return new Response("", { status: 404 });
    }));
    await uploadAcademicDocument(new File(["pdf"], "x.pdf", { type: "application/pdf" }), "transcript");
    expect(calls).toContain("PUT https://storage.example/file");
    expect(calls).toContain("POST https://api.eliteapply.net/api/v1/academic-documents");
  });

  it("rejects unsupported document types before requesting a signed URL", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(uploadAcademicDocument(new File(["x"], "x.exe", { type: "application/octet-stream" }), "other")).rejects.toThrow(/PDF/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
