import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error Wrangler executes this plain-JavaScript entry directly.
import worker from "../../workers/entry.js";

afterEach(() => vi.restoreAllMocks());

describe("R2 avatar finalization", () => {
  it("deletes an upload whose bytes do not match its image content type", async () => {
    const deleteObject = vi.fn(async () => undefined);
    const api = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({
        id: "user-1",
        avatar_url: null,
      }),
    );
    const response = await worker.fetch(
      new Request("https://eliteapply.net/api/avatar/complete", {
        method: "POST",
        headers: {
          authorization: "Bearer test",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          storage_key: "staging/avatars/user-1/not-an-image.png",
        }),
      }),
      {
        API_BASE_URL: "https://api.eliteapply.net/api/v1",
        AVATARS: {
          get: vi.fn(async () => ({
            httpMetadata: { contentType: "image/png" },
            arrayBuffer: async () =>
              new TextEncoder().encode("not an image").buffer,
          })),
          delete: deleteObject,
        },
      },
    );

    expect(response.status).toBe(415);
    expect(deleteObject).toHaveBeenCalledWith(
      "staging/avatars/user-1/not-an-image.png",
    );
    expect(api).toHaveBeenCalledOnce();
  });
});
