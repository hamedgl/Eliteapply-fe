import { expect, test } from "@playwright/test";

const user = {
  id: "00000000-0000-4000-8000-000000000001",
  identity_subject: "test",
  email: "alex@example.test",
  full_name: "Alex Morgan",
  headline: null,
  phone_number: null,
  avatar_url:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23174bd6'/%3E%3Ctext x='20' y='26' text-anchor='middle' font-size='16' fill='white'%3EAM%3C/text%3E%3C/svg%3E",
  is_email_verified: true,
  is_active: true,
  is_admin: false,
  marketing_opt_in: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-07-19T09:00:00Z",
  last_login_at: "2026-07-19T08:45:00Z",
};

test("signed-in marketing header exposes account settings and logout", async ({
  page,
}, testInfo) => {
  let loggedOut = false;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.route("**/api/v1/**", async (route) => {
    const url = route.request().url();
    if (url.endsWith("/auth/refresh"))
      return route.fulfill({
        json: { access_token: "test", id_token: "test", expires_in: 3600 },
      });
    if (url.endsWith("/users/me")) return route.fulfill({ json: user });
    if (url.endsWith("/auth/logout")) {
      loggedOut = true;
      return route.fulfill({ status: 204 });
    }
    if (url.endsWith("/platform/capabilities"))
      return route.fulfill({ json: [] });
    return route.fulfill({ json: {} });
  });

  await page.goto("/");
  await expect(page).toHaveURL("/");
  await expect(page).toHaveTitle(/EliteApply/);
  await expect(
    page.getByRole("heading", {
      name: "Plan, write and submit stronger scholarship applications.",
    }),
  ).toBeVisible();
  const navigationToggle = page.getByRole("button", {
    name: "Open navigation",
  });
  if (await navigationToggle.isVisible()) await navigationToggle.click();

  const account = page.getByRole("button", {
    name: "Open account menu for Alex Morgan",
  });
  await expect(account).toBeVisible();
  await account.click();
  await expect(
    page.getByRole("menuitem", { name: "Account settings" }),
  ).toHaveAttribute("href", "/app/settings/profile");
  await page.screenshot({
    path: `/tmp/eliteapply-account-${testInfo.project.name}.png`,
  });

  await page.keyboard.press("Escape");
  await expect(account).toBeFocused();
  await account.click();
  await page.getByRole("menuitem", { name: "Log out" }).click();

  await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
  expect(loggedOut).toBe(true);
  expect(errors).toEqual([]);
});
