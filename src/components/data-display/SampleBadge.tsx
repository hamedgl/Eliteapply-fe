import { StatusBadge } from "./StatusBadge";

/**
 * Marks a row the backend seeded at signup (`is_sample`), so a new account lands on a
 * populated workspace instead of empty states everywhere.
 *
 * The API's SampleDataService is explicit that this badge — not the row's content — is
 * the authoritative signal that something is demo data: the seeded text is deliberately
 * generic, which makes it plausible enough to be mistaken for the user's own work.
 * Anywhere a seeded row can appear, it has to say so.
 *
 * Renders nothing when `is_sample` is false, so call sites can drop it in unconditionally.
 */
export function SampleBadge({ isSample }: { isSample: boolean | undefined }) {
  if (!isSample) return null;
  return (
    <StatusBadge tone="grey">
      <span title="EliteApply added this example so you can see how this section works. Delete it any time.">
        Sample
      </span>
    </StatusBadge>
  );
}
