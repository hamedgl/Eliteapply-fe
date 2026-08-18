/**
 * Humanises a snake_case API enum for display: `needs_review` → `Needs Review`.
 *
 * Nullish input yields an empty string. This runs on dozens of optional payload
 * fields across applications, writing, stories and billing; a missing one has to
 * render blank rather than throw and take the whole page down with it — the
 * public share page did exactly that when a document arrived without a status.
 */
export const label = (value: string | null | undefined) =>
  (value ?? "").replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase());
