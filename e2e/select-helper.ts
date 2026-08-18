import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Chooses an option in the app's listbox-pattern `Select` (see
 * `src/components/ui/select.tsx`). It is a button + portaled listbox, not a
 * native `<select>`, so `locator.selectOption()` does not apply.
 */
export async function chooseOption(
  page: Page,
  trigger: Locator,
  optionName: string | RegExp,
) {
  await trigger.click();
  const option = page.getByRole("option", { name: optionName });
  await expect(option).toBeVisible();
  await option.click();
}
