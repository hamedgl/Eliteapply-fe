import { describe, expect, it } from "vitest";
import { normalizeUploadFile } from "../features/documents/model";

const file = (name: string, type: string) =>
  new File(["x"], name, { type });

describe("normalizeUploadFile", () => {
  it("passes through files the upload endpoint already accepts", () => {
    const pdf = file("transcript.pdf", "application/pdf");
    expect(normalizeUploadFile(pdf)).toBe(pdf);
  });

  it("recovers the MIME type from the extension when the browser omits it", () => {
    const recovered = normalizeUploadFile(file("degree.docx", ""));
    expect(recovered?.type).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(recovered?.name).toBe("degree.docx");
  });

  it("is case-insensitive about extensions", () => {
    expect(normalizeUploadFile(file("scan.JPEG", ""))?.type).toBe("image/jpeg");
  });

  it("rejects unsupported files instead of letting them fail mid-upload", () => {
    expect(normalizeUploadFile(file("notes.zip", "application/zip"))).toBeNull();
    expect(normalizeUploadFile(file("noextension", ""))).toBeNull();
  });
});
