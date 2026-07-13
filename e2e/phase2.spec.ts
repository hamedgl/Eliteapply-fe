import { expect, test } from "@playwright/test";
const user = {
  id: "00000000-0000-4000-8000-000000000001",
  identity_subject: "test",
  email: "maya@example.test",
  full_name: "Maya Chen",
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
const app = (
  id: string,
  title: string,
  stage: string,
  priority = "normal",
) => ({
  id,
  title,
  application_type: "programme",
  institution_id: null,
  programme_id: null,
  scholarship_id: null,
  stage,
  priority,
  intake: "Autumn 2027",
  primary_deadline_at: "2027-01-15T12:00:00Z",
  source_url: null,
  notes: null,
  tags: [],
  version: 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
});
test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", async (route) => {
    const url = route.request().url();
    if (url.endsWith("/auth/refresh"))
      return route.fulfill({
        json: { access_token: "test", id_token: "test", expires_in: 3600 },
      });
    if (url.endsWith("/users/me")) return route.fulfill({ json: user });
    if (url.endsWith("/platform/capabilities"))
      return route.fulfill({ json: [] });
    if (url.endsWith("/applications/board"))
      return route.fulfill({
        json: {
          columns: {
            researching: [
              app(
                "00000000-0000-4000-8000-000000000011",
                "PhD Computer Vision",
                "researching",
              ),
            ],
            shortlisted: [
              app(
                "00000000-0000-4000-8000-000000000012",
                "Rhodes Scholarship",
                "shortlisted",
                "high",
              ),
            ],
            preparing: [
              app(
                "00000000-0000-4000-8000-000000000013",
                "MSc Computer Science",
                "preparing",
              ),
            ],
          },
          total: 3,
        },
      });
    return route.fulfill({ json: {} });
  });
});
test("board is keyboard operable and responsive", async ({ page }) => {
  await page.goto("/app/applications");
  await expect(
    page.getByRole("heading", { name: "Applications", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("MSc Computer Science")).toBeVisible();
  await page.getByLabel("Move MSc Computer Science").focus();
  await expect(page.getByLabel("Move MSc Computer Science")).toBeFocused();
  await page.screenshot({
    path: "/tmp/eliteapply-phase2-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "List" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByText("MSc Computer Science")).toBeVisible();
  await page.screenshot({
    path: "/tmp/eliteapply-phase2-mobile.png",
    fullPage: true,
  });
});
