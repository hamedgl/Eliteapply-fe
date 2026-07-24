import { describe, expect, it } from "vitest";
import {
  contentToHtml,
  countText,
  DEFAULT_FONT,
  documentFont,
  htmlToPlainText,
  isEditorHtml,
  mergeHtml,
  plainTextToHtml,
} from "./documentHtml";

describe("writing document content format", () => {
  it("keeps paragraph breaks when loading legacy plain text", () => {
    expect(plainTextToHtml("Para one.\n\nPara two.")).toBe(
      "<div>Para one.</div><div>Para two.</div>",
    );
  });

  it("keeps single newlines inside a paragraph as line breaks", () => {
    expect(plainTextToHtml("Line one\nLine two")).toBe(
      "<div>Line one<br>Line two</div>",
    );
  });

  it("escapes markup in plain text instead of letting Trix eat it", () => {
    expect(plainTextToHtml("a < b & <script>alert(1)</script>")).toBe(
      "<div>a &lt; b &amp; &lt;script&gt;alert(1)&lt;/script&gt;</div>",
    );
  });

  it("treats stored text as HTML only when marked and actually marked up", () => {
    expect(isEditorHtml({ text: "<div>hi</div>", format: "html" })).toBe(true);
    expect(isEditorHtml({ text: "plain text", format: "html" })).toBe(false);
    expect(isEditorHtml({ text: "<div>hi</div>" })).toBe(false);
    expect(isEditorHtml(undefined)).toBe(false);
  });

  it("re-escapes when a generation run overwrites HTML with plain text", () => {
    // The backend writes plain text into `content.text` and leaves `format` behind.
    expect(
      contentToHtml({ text: "Fresh draft.\n\nSecond para.", format: "html" }),
    ).toBe("<div>Fresh draft.</div><div>Second para.</div>");
  });

  it("round-trips editor HTML untouched", () => {
    const html = "<div>hello <strong>bold</strong></div>";
    expect(contentToHtml(mergeHtml({}, html))).toBe(html);
  });

  it("preserves unrelated content keys when saving", () => {
    expect(mergeHtml({ evidence: [1] }, "<div>x</div>")).toEqual({
      evidence: [1],
      text: "<div>x</div>",
      format: "html",
      font: DEFAULT_FONT,
    });
  });

  it("counts words across block boundaries rather than gluing them", () => {
    expect(countText("<div>alpha</div><div>beta</div>").words).toBe(2);
    expect(htmlToPlainText("<div>a</div><div>b</div>")).toBe("a\nb\n");
  });

  it("counts decoded entities, not markup", () => {
    expect(countText("<div>Tom &amp; Jerry</div>")).toEqual({
      words: 3,
      chars: 11,
    });
  });

  it("round-trips the chosen typeface", () => {
    expect(documentFont(mergeHtml({}, "<div>x</div>", "times"))).toBe("times");
  });

  it("falls back to the default for a missing or unknown typeface", () => {
    expect(documentFont(undefined)).toBe(DEFAULT_FONT);
    expect(documentFont({ text: "x" })).toBe(DEFAULT_FONT);
    // Comes off the wire and drives a CSS attribute, so it cannot be trusted.
    expect(documentFont({ font: "comic-sans" })).toBe(DEFAULT_FONT);
    expect(documentFont({ font: 42 })).toBe(DEFAULT_FONT);
  });

  it("reports an empty document as zero", () => {
    expect(countText("")).toEqual({ words: 0, chars: 0 });
    expect(plainTextToHtml("   ")).toBe("");
  });
});
