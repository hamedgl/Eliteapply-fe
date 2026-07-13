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
    if (new URL(url).pathname.endsWith("/catalogue/institutions"))
      return route.fulfill({
        json: {
          items: [
            {
              id: "00000000-0000-4000-8000-000000000021",
              name: "University of Oxford",
              country_code: "GB",
              created_by_user_id: null,
              source_provenance: { source: "official" },
              last_verified_at: "2026-06-01T00:00:00Z",
              created_at: "2026-01-01T00:00:00Z",
              visibility: "canonical",
            },
          ],
          next_cursor: null,
          has_more: false,
          total: 1,
        },
      });
    if (new URL(url).pathname.endsWith("/catalogue/programmes"))
      return route.fulfill({
        json: {
          items: [
            {
              id: "00000000-0000-4000-8000-000000000031",
              institution_id: "00000000-0000-4000-8000-000000000021",
              name: "MSc Computer Science",
              created_by_user_id: null,
              visibility: "canonical",
            },
          ],
          next_cursor: null,
          has_more: false,
          total: 1,
        },
      });
    if (new URL(url).pathname.endsWith("/catalogue/scholarships"))
      return route.fulfill({
        json: {
          items: [
            {
              id: "00000000-0000-4000-8000-000000000032",
              name: "Rhodes Scholarship",
              provider_name: "Rhodes Trust",
              created_by_user_id: null,
              visibility: "canonical",
            },
          ],
          next_cursor: null,
          has_more: false,
          total: 1,
        },
      });
    if (new URL(url).pathname.endsWith("/saved-searches"))
      return route.fulfill({ json: [] });
    if (
      new URL(url).pathname.endsWith(
        "/application-intelligence/recommendations",
      )
    )
      return route.fulfill({
        json: {
          items: [],
          disclaimer:
            "Recommendations organize relevant options and do not predict admission.",
        },
      });
    if (new URL(url).pathname.includes("/share/"))
      return route.fulfill({
        json: {
          title: "Research motivation statement",
          html: "<h1>Research motivation</h1><p>Safe preview</p>",
          scope: "comment",
          word_count: 2,
          character_count: 17,
        },
      });
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
    if (new URL(url).pathname.endsWith("/applications"))
      return route.fulfill({
        json: {
          items: [
            app(
              "00000000-0000-4000-8000-000000000013",
              "MSc Computer Science",
              "preparing",
            ),
          ],
          next_cursor: null,
          has_more: false,
          total: 1,
        },
      });
    return route.fulfill({ json: {} });
  });
});

test("catalogue distinguishes canonical records and exposes discovery", async ({
  page,
}) => {
  await page.goto("/app/catalogue");
  await expect(
    page.getByRole("heading", { name: "Academic catalogue" }),
  ).toBeVisible();
  await expect(page.getByText("University of Oxford")).toBeVisible();
  await expect(page.getByText("Canonical", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "/tmp/eliteapply-phase2-catalogue.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Saved searches & matches" }).click();
  await expect(
    page.getByRole("heading", { name: "Saved searches & matches" }),
  ).toBeVisible();
  await expect(
    page.getByText(/How to read this:.*do not predict admission/i),
  ).toBeVisible();
});

test("public writing share is noindex and comment-capable", async ({
  page,
}) => {
  await page.goto("/share/safe-token");
  await expect(
    page.getByRole("heading", { name: "Research motivation statement" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Leave a comment" }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex,nofollow",
  );
  await expect(page.locator("iframe")).toHaveAttribute("sandbox", "");
  await page.screenshot({
    path: "/tmp/eliteapply-phase2-share.png",
    fullPage: true,
  });
});

test("scholarship applications require and submit a catalogue scholarship", async ({
  page,
}) => {
  let submitted: Record<string, unknown> | null = null;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname.endsWith("/applications")
    )
      submitted = request.postDataJSON() as Record<string, unknown>;
  });
  await page.goto("/app/applications");
  await page.getByRole("button", { name: "Add application" }).click();
  const dialog = page.getByRole("dialog", { name: "Add application" });
  await dialog.getByLabel("Title").fill("Rhodes 2027");
  await dialog.getByLabel("Type").selectOption("scholarship");
  await expect(dialog.getByText("Scholarship opportunity")).toBeVisible();
  await dialog
    .locator('select[name="scholarship_id"]')
    .selectOption({ label: "Rhodes Scholarship — Rhodes Trust" });
  await dialog.getByRole("button", { name: "Create application" }).click();
  await expect.poll(() => submitted?.scholarship_id).toBe(
    "00000000-0000-4000-8000-000000000032",
  );
  expect(submitted?.programme_id).toBeNull();
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
