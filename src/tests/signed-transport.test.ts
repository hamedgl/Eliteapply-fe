import { afterEach, describe, expect, it, vi } from "vitest";
import { calendarFeedUrls, maskCalendarFeedUrl } from "../lib/calendarFeed";
import { downloadResponse } from "../lib/api/download";
import {
  downloadSignedFile,
  openSignedDownload,
  redactSignedUrl,
  resolveSafeHttpUrl,
  uploadToSignedUrl,
} from "../lib/api/signedTransport";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("signed storage transport", () => {
  it("resolves API-relative URLs and preserves signed query order", () => {
    expect(
      resolveSafeHttpUrl("/api/v1/storage/upload?token=first&part=second"),
    ).toBe(
      "https://api.eliteapply.net/api/v1/storage/upload?token=first&part=second",
    );
    expect(resolveSafeHttpUrl("http://localhost:8000/file?token=dev")).toBe(
      "http://localhost:8000/file?token=dev",
    );
  });

  it.each(["javascript:alert(1)", "data:text/plain,secret", "not a url "])(
    "rejects an unsafe URL: %s",
    (url) => expect(() => resolveSafeHttpUrl(url)).toThrow(/URL|protocol/),
  );

  it("uploads a raw PUT without credentials or bearer authentication", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(null, { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["pdf"], "record.pdf", { type: "application/pdf" });
    const url = "https://storage.example.test/file?part=2&token=secret";

    await uploadToSignedUrl({
      uploadUrl: url,
      method: "PUT",
      file,
      contentType: file.type,
      maxSizeBytes: 100,
    });

    expect(fetchMock.mock.calls[0][0]).toBe(url);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("PUT");
    expect(init.body).toBe(file);
    expect(init.credentials).toBe("omit");
    expect(new Headers(init.headers).has("authorization")).toBe(false);
    expect(new Headers(init.headers).get("content-type")).toBe(
      "application/pdf",
    );
  });

  it("uploads multipart fields unchanged and appends the file", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(null, { status: 204 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["x"], "x.txt", { type: "text/plain" });

    await uploadToSignedUrl({
      uploadUrl: "https://storage.example.test/form?token=secret",
      method: "POST",
      fields: { key: "uploads/exact", policy: "signed-value" },
      file,
      contentType: file.type,
      maxSizeBytes: 10,
    });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const body = init.body as FormData;
    expect(init.method).toBe("POST");
    expect(body.get("key")).toBe("uploads/exact");
    expect(body.get("policy")).toBe("signed-value");
    expect(body.get("file")).toBe(file);
    expect(new Headers(init.headers).has("content-type")).toBe(false);
  });

  it("rejects oversized and cancelled uploads before transfer", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["large"], "large.txt");
    await expect(
      uploadToSignedUrl({
        uploadUrl: "https://storage.example.test/file?token=secret",
        method: "PUT",
        file,
        maxSizeBytes: 2,
      }),
    ).rejects.toThrow(/exceeds/);

    const controller = new AbortController();
    controller.abort();
    await expect(
      uploadToSignedUrl({
        uploadUrl: "https://storage.example.test/file?token=secret",
        method: "PUT",
        file: new File(["x"], "x.txt"),
        maxSizeBytes: 2,
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports transfer progress when XMLHttpRequest is available", async () => {
    class FakeRequest extends EventTarget {
      upload = new EventTarget();
      status = 204;
      open() {}
      setRequestHeader() {}
      send() {
        this.upload.dispatchEvent(
          new ProgressEvent("progress", {
            lengthComputable: true,
            loaded: 5,
            total: 10,
          }),
        );
        this.dispatchEvent(new Event("load"));
      }
      abort() {
        this.dispatchEvent(new Event("abort"));
      }
    }
    vi.stubGlobal("XMLHttpRequest", FakeRequest);
    const progress = vi.fn();

    await uploadToSignedUrl({
      uploadUrl: "https://storage.example.test/file?token=secret",
      method: "PUT",
      file: new File(["x"], "x.txt"),
      maxSizeBytes: 2,
      onProgress: progress,
    });

    expect(progress).toHaveBeenCalledWith({ loaded: 5, total: 10, percent: 50 });
  });

  it("sanitizes failed transfers and signed URL displays", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 403 })),
    );
    const secretUrl =
      "https://storage.example.test/file?token=never-log-this&part=2";
    let error: Error | undefined;
    try {
      await uploadToSignedUrl({
        uploadUrl: secretUrl,
        method: "PUT",
        file: new File(["x"], "x.txt"),
        maxSizeBytes: 2,
      });
    } catch (caught) {
      error = caught as Error;
    }

    expect(error?.message).not.toContain("never-log-this");
    expect(redactSignedUrl(secretUrl)).toBe(
      "https://storage.example.test/file?[redacted]",
    );
  });

  it("opens a signed download directly with safe link attributes", () => {
    let anchor: HTMLAnchorElement | undefined;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function (this: HTMLAnchorElement) {
        anchor = this;
      },
    );
    const url = "https://storage.example.test/file?token=exact-secret&part=2";

    openSignedDownload(url);

    expect(anchor?.href).toBe(url);
    expect(anchor?.target).toBe("_blank");
    expect(anchor?.rel).toBe("noopener noreferrer");
  });

  it("downloads a signed Blob without auth and revokes its object URL", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response("file", { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined,
    );
    const createObjectURL = vi.fn(() => "blob:signed-file");
    const revokeObjectURL = vi.fn();
    const NativeURL = URL;
    class TestURL extends NativeURL {
      static createObjectURL = createObjectURL;
      static revokeObjectURL = revokeObjectURL;
    }
    vi.stubGlobal("URL", TestURL);

    await downloadSignedFile(
      "https://storage.example.test/file?token=secret",
      "record.pdf",
    );

    expect((fetchMock.mock.calls[0][1] as RequestInit).credentials).toBe("omit");
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:signed-file");
  });

  it("downloads ordinary JSON exports instead of treating them as URL metadata", async () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:json-export"),
      revokeObjectURL: vi.fn(),
    });

    await downloadResponse(
      Response.json({ application: { id: "app-1" }, requirements: [] }),
      "application.json",
    );

    expect(click).toHaveBeenCalledOnce();
  });
});

describe("calendar feed URL helpers", () => {
  it("constructs HTTPS/webcal URLs by changing only the scheme", () => {
    const value =
      "https://api.example.test/api/v1/calendar-feed/private-token.ics?view=full";
    const urls = calendarFeedUrls(value);
    expect(urls.https).toBe(value);
    expect(urls.webcal).toBe(
      "webcal://api.example.test/api/v1/calendar-feed/private-token.ics?view=full",
    );
  });

  it("masks the token and query from the display URL", () => {
    const value =
      "https://api.example.test/api/v1/calendar-feed/private-token.ics?token=also-secret";
    const masked = maskCalendarFeedUrl(value);
    expect(masked).toBe(
      "https://api.example.test/api/v1/calendar-feed/••••••••.ics",
    );
    expect(masked).not.toContain("private-token");
    expect(masked).not.toContain("also-secret");
  });
});
