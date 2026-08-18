import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * `src/lib/config/product.ts` uses `import.meta.env`, which Playwright's node
 * runtime does not provide, so the constant is read from the source instead of
 * imported. Reading it (rather than copying the literal into every fixture)
 * means a terms-version bump can never silently reopen the ConsentGate dialog
 * over every authenticated e2e test.
 */
const source = readFileSync(
  fileURLToPath(new URL("../src/lib/config/product.ts", import.meta.url)),
  "utf8",
);

const match = source.match(/currentTermsVersion:\s*"([^"]+)"/);
if (!match) {
  throw new Error(
    "Could not read currentTermsVersion from src/lib/config/product.ts",
  );
}

export const currentTermsVersion = match[1];
