import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error Wrangler executes this plain-JavaScript entry directly.
import worker from "../../workers/entry.js";

afterEach(() => vi.restoreAllMocks());

describe("R2 avatar upload", () => {
  it("does not store bytes that do not match the image content type", async () => {
    const putObject = vi.fn(async () => undefined);
    const api = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({
        id: "user-1",
        avatar_url: null,
      }),
    );
    const response = await worker.fetch(
      new Request("https://eliteapply.net/api/avatar", {
        method: "POST",
        headers: {
          authorization: "Bearer test",
          "content-type": "image/png",
          "content-length": "12",
        },
        body: new TextEncoder().encode("not an image"),
      }),
      {
        API_BASE_URL: "https://api.eliteapply.net/api/v1",
        AVATARS: {
          put: putObject,
        },
      },
    );

    expect(response.status).toBe(415);
    expect(putObject).not.toHaveBeenCalled();
    expect(api).toHaveBeenCalledOnce();
  });
});
