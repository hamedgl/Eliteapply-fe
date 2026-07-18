import { expect, test } from "@playwright/test";

const user = {
  id: "00000000-0000-4000-8000-000000000001",
  identity_subject: "test",
  email: "hamed.golchin-with-a-long-address@example.test",
  full_name: "Hamed Golchin-Albuquerque",
  headline: null,
  phone_number: null,
  avatar_url: null,
  is_email_verified: true,
  is_active: true,
  is_admin: false,
  marketing_opt_in: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  last_login_at: null,
};

const dashboard = {
  applications_by_stage: {},
  upcoming_deadlines: [],
  missing_documents: 0,
  open_tasks: 0,
  profile_completion_percent: 0,
  recommended_next_action: "complete_academic_profile",
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", async (route) => {
    const url = route.request().url();
    if (url.endsWith("/auth/refresh")) {
      return route.fulfill({
        json: { access_token: "test", id_token: "test", expires_in: 3600 },
      });
    }
    if (url.endsWith("/users/me")) return route.fulfill({ json: user });
    if (url.endsWith("/platform/capabilities")) {
      return route.fulfill({ json: [] });
    }
    if (url.endsWith("/dashboard")) {
      return route.fulfill({ json: dashboard });
    }
    return route.fulfill({ json: {} });
  });
});

test("dashboard turns empty backend state into clear next actions", async ({
  page,
}) => {
  await page.goto("/app/dashboard");

  await expect(
    page.getByRole("heading", { name: "Good morning, Hamed" }),
  ).toBeVisible();
  await expect(page.getByText("complete_academic_profile")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Complete your academic profile" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Continue profile" }).first(),
  ).toHaveAttribute("href", "/app/academic-profile");
  await expect(
    page.getByRole("link", { name: "Add your first application" }),
  ).toHaveAttribute("href", "/app/applications");
  await expect(
    page.getByRole("progressbar", { name: "Academic profile completion" }),
  ).toHaveAttribute("aria-valuenow", "0");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("mobile app navigation is touch-safe and closes with Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/dashboard");

  const menu = page.getByRole("button", { name: "Open navigation" });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(
    page.getByRole("dialog", { name: "Application navigation" }),
  ).toHaveClass(/open/);
  await expect(
    page.getByRole("button", { name: "Close navigation" }).last(),
  ).toBeFocused();
  await page.getByRole("button", { name: "Log out" }).focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "EliteApply" }).last(),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Log out" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "false");

  const controlSize = await menu.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(controlSize.width).toBeGreaterThanOrEqual(44);
  expect(controlSize.height).toBeGreaterThanOrEqual(44);
  const notificationSize = await page
    .getByRole("link", { name: /unread notifications/ })
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
  expect(notificationSize.width).toBeGreaterThanOrEqual(44);
  expect(notificationSize.height).toBeGreaterThanOrEqual(44);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
