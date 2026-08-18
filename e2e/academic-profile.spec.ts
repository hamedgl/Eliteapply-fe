import { expect, test, type Page } from "@playwright/test";
import { currentTermsVersion } from "./product-config";

const user = {
  id: "00000000-0000-4000-8000-000000000001",
  identity_subject: "test",
  email: "hamed@example.test",
  full_name: "Hamed Golchin",
  headline: null,
  phone_number: null,
  avatar_url: null,
  is_email_verified: true,
  is_active: true,
  is_admin: false,
  consent_version: currentTermsVersion,
  consent_at: "2026-01-01T00:00:00Z",
  marketing_opt_in: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  last_login_at: null,
};

/** Stubs auth + the academic-profile endpoints against an in-memory profile. */
const entitlement = {
  plan_key: "free",
  plan_name: "free",
  plan_label: "Free",
  subscription_status: "active",
  is_active: true,
  cancel_at_period_end: false,
  current_period_end: null,
  trial_end: null,
  ai_tokens_used: 0,
  ai_tokens_limit: 1000,
  ai_tokens_reset_at: "2027-01-01T00:00:00Z",
  purchased_tokens_remaining: 0,
};

async function stubApi(page: Page) {
  const state: {
    profile: Record<string, unknown> | null;
    savedPayload: Record<string, unknown> | null;
  } = { profile: null, savedPayload: null };

  await page.route("**/api/v1/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.endsWith("/auth/refresh"))
      return route.fulfill({
        json: { access_token: "test", id_token: "test", expires_in: 3600 },
      });
    if (url.endsWith("/users/me")) return route.fulfill({ json: user });
    if (url.endsWith("/platform/capabilities")) return route.fulfill({ json: [] });
    if (url.endsWith("/billing/entitlements"))
      return route.fulfill({ json: entitlement });
    if (url.endsWith("/academic-profile/versions")) return route.fulfill({ json: [] });
    if (url.endsWith("/academic-profile") && method === "GET")
      return route.fulfill({ json: state.profile });
    if (url.endsWith("/academic-profile") && method === "PUT") {
      state.savedPayload = route.request().postDataJSON() as Record<string, unknown>;
      state.profile = {
        id: "00000000-0000-4000-8000-000000000020",
        version: ((state.profile?.version as number) ?? 0) + 1,
        created_at: "2026-07-13T12:00:00Z",
        updated_at: "2026-07-13T12:00:00Z",
        ...state.savedPayload,
      };
      return route.fulfill({ json: state.profile });
    }
    return route.fulfill({ json: {} });
  });

  return state;
}

test("academic profile autosaves, tracks completion and keeps the section in the URL", async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  const state = await stubApi(page);

  await page.goto("/app/academic-profile");
  await expect(
    page.getByRole("heading", { name: "Academic profile", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Not saved yet")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Goals", level: 2 })).toBeVisible();
  await expect(page.getByText("0 of 7 sections ready")).toBeVisible();

  await page.screenshot({
    path: "/tmp/eliteapply-academic-profile-empty.png",
    fullPage: true,
  });

  // Autosave fires on edit — there is no explicit save button.
  await page.getByLabel("Fields of study").fill("Public policy");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("All changes saved.");
  expect(state.savedPayload).toMatchObject({
    sections: { goals: { fields_of_study: ["Public policy"] } },
  });

  // Sections are links, so the section survives a reload.
  const nav = page.getByRole("navigation", { name: "Profile sections" });
  await nav.getByRole("link", { name: /^Education/ }).click();
  await expect(page).toHaveURL(/section=education/);
  await expect(
    page.getByRole("heading", { name: "No education added yet", level: 2 }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Add education" }).click();
  await page.getByLabel("Institution").fill("University of Lisbon");
  await page.getByLabel("Field of study").fill("Public policy");
  await expect(page.getByRole("status")).toHaveText("All changes saved.");

  await page.getByLabel("Start date").fill("2021-09-01");
  await page.getByLabel("End date (or expected)").fill("2025-06-30");
  await expect(page.getByRole("status")).toHaveText("All changes saved.");

  await page.reload();
  await expect(page).toHaveURL(/section=education/);
  await expect(page.getByText("University of Lisbon")).toBeVisible();
  // Collapsed rows carry a metadata line so the list stays scannable.
  await expect(page.getByText("Public policy · 2021 – 2025")).toBeVisible();
  await expect(nav.getByRole("link", { name: /Education.*Complete/ })).toBeVisible();
  await expect(page.getByText("1 of 7 sections ready")).toBeVisible();

  await page.screenshot({
    path: "/tmp/eliteapply-academic-profile-education.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: /University of Lisbon/ }).click();
  await expect(page.getByLabel("Institution")).toBeVisible();
  await page.screenshot({
    path: "/tmp/eliteapply-academic-profile-expanded.png",
    fullPage: true,
  });

  expect(runtimeErrors).toEqual([]);
});

test("academic profile stacks into one column on mobile", async ({ page }) => {
  await stubApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/academic-profile");
  await expect(page.getByRole("heading", { name: "Goals", level: 2 })).toBeVisible();

  const mobileNav = page.getByRole("navigation", { name: "Profile sections" });
  const panel = page.getByRole("region", { name: "Goals" });
  const navBox = await mobileNav.boundingBox();
  const panelBox = await panel.boundingBox();
  expect(navBox && panelBox && panelBox.y).toBeGreaterThan(
    (navBox?.y ?? 0) + (navBox?.height ?? 0) - 1,
  );

  // The section strip scrolls inside itself; the page itself must not.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  await page.screenshot({
    path: "/tmp/eliteapply-academic-profile-mobile.png",
    fullPage: true,
  });
});
