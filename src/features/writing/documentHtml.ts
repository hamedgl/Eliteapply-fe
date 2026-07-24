import { documentText } from "../../lib/api/phase3";

/**
 * Writing documents historically stored plain text in `content.text`, and the
 * backend still writes plain text there when a generation run completes. The
 * editor now produces HTML, so every read has to decide which one it is holding.
 */
const HTML_FORMAT = "html";

/** Tags Trix itself emits. Deliberately narrow: anything else is treated as plain text. */
const TRIX_TAG = /<(?:div|h1|blockquote|pre|ul|ol|li|br|strong|em|del|a)\b/i;

/** Closing tags that represent a line break once the markup is stripped. */
const BLOCK_BOUNDARY =
  /<\/(?:div|h1|h2|h3|blockquote|pre|li|p)>|<br\s*\/?>/gi;

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character] ?? character,
  );

/**
 * Convert stored plain text into Trix blocks. Without this, `loadHTML` collapses
 * every paragraph into a single line and drops anything that looks like a tag.
 */
export function plainTextToHtml(text: string) {
  if (!text.trim()) return "";
  return text
    .split(/\r?\n\r?\n+/)
    .map(
      (block) =>
        `<div>${escapeHtml(block).replace(/\r?\n/g, "<br>")}</div>`,
    )
    .join("");
}

/** True when `content.text` holds editor HTML rather than legacy/backend plain text. */
export function isEditorHtml(content: Record<string, unknown> | undefined) {
  const text = documentText(content);
  // The marker alone is not trusted. A completed generation run replaces `text`
  // with plain prose; the backend now clears `format` when it does, but this also
  // has to hold for documents written before that fix and if it ever regresses —
  // guessing wrong here renders markup as literal text, or eats the user's prose.
  return content?.format === HTML_FORMAT && TRIX_TAG.test(text);
}

/** Editor-ready HTML for a stored document, whichever format it is in. */
export function contentToHtml(content: Record<string, unknown> | undefined) {
  const text = documentText(content);
  return isEditorHtml(content) ? text : plainTextToHtml(text);
}

/**
 * Typeface options. Document-level rather than per-selection: the backend
 * sanitiser allows 12 tags and strips every attribute except `href`, so a
 * `<span style="font-family:…">` would not survive a save. Only system faces and
 * the two already-self-hosted families are offered, so switching costs no download.
 */
export const FONTS = [
  { value: "serif", label: "Source Serif" },
  { value: "sans", label: "DM Sans" },
  { value: "times", label: "Times New Roman" },
  { value: "arial", label: "Arial" },
  { value: "mono", label: "Monospace" },
] as const;

export type FontKey = (typeof FONTS)[number]["value"];

export const DEFAULT_FONT: FontKey = "serif";

/** Stored font, validated — the value comes off the wire and drives a CSS attribute. */
export function documentFont(content: Record<string, unknown> | undefined) {
  const stored = content?.font;
  return FONTS.some((option) => option.value === stored)
    ? (stored as FontKey)
    : DEFAULT_FONT;
}

/** Stored content for editor HTML, tagged so the next read knows the format. */
export const mergeHtml = (
  content: Record<string, unknown> | undefined,
  html: string,
  font: FontKey = DEFAULT_FONT,
) => ({ ...content, text: html, format: HTML_FORMAT, font });

/**
 * Plain text for word/character counts. Block boundaries have to become newlines
 * first or `<div>a</div><div>b</div>` counts as the single word "ab".
 */
export function htmlToPlainText(html: string) {
  if (!html) return "";
  const withBreaks = html.replace(BLOCK_BOUNDARY, "\n");
  if (typeof DOMParser === "undefined") return withBreaks.replace(/<[^>]*>/g, "");
  return (
    new DOMParser().parseFromString(withBreaks, "text/html").body.textContent ??
    ""
  );
}

export function countText(html: string) {
  const plain = htmlToPlainText(html).trim();
  return {
    words: plain ? plain.split(/\s+/).length : 0,
    chars: htmlToPlainText(html).replace(/\n+$/, "").length,
  };
}
