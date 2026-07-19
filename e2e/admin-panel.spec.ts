import { expect, test, type Page, type Route } from "@playwright/test";

const adminId = "00000000-0000-4000-8000-000000000001";
const userId = "00000000-0000-4000-8000-000000000002";
const operationId = "00000000-0000-4000-8000-000000000003";

const admin = {
  id: adminId,
  identity_subject: "admin-subject",
  email: "ops@eliteapply.net",
  full_name: "Alex Morgan",
  headline: null,
  phone_number: null,
  avatar_url: null,
  is_email_verified: true,
  is_active: true,
  is_admin: true,
  marketing_opt_in: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-07-19T09:00:00Z",
  last_login_at: "2026-07-19T08:45:00Z",
};

const managedUser = {
  id: userId,
  email: "student@example.test",
  full_name: "Taylor Student",
  is_active: true,
  is_admin: false,
  created_at: "2026-04-02T10:00:00Z",
  last_login_at: "2026-07-18T15:30:00Z",
};

const pageOf = <T>(items: T[], nextCursor: string | null = null) => ({
  items,
  next_cursor: nextCursor,
  has_more: Boolean(nextCursor),
  total: null,
});

async function mockAdminApi(page: Page, currentUser = admin) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path.endsWith("/auth/refresh")) {
      return route.fulfill({
        json: { access_token: "test", id_token: "test", expires_in: 3600 },
      });
    }
    if (path.endsWith("/users/me")) return route.fulfill({ json: currentUser });
    if (path.endsWith("/platform/capabilities"))
      return route.fulfill({ json: [] });
    if (path.endsWith("/admin/launch-readiness")) {
      return route.fulfill({
        json: {
          ready: false,
          passed: 9,
          total: 12,
          blocking_gates: ["email_delivery", "billing_webhook", "queue_alarm"],
        },
      });
    }
    if (path.endsWith("/admin/operations")) {
      return route.fulfill({
        json: pageOf([
          {
            id: operationId,
            type: "writing_generation",
            status: "processing",
            user_id: userId,
            created_at: "2026-07-19T08:40:00Z",
          },
        ]),
      });
    }
    if (path.endsWith("/admin/feature-flags")) {
      return route.fulfill({
        json: [
          {
            key: "writing_studio_v2",
            enabled: true,
            rollout_percentage: 25,
            cohorts: ["staff"],
            kill_switch: false,
            updated_at: "2026-07-19T08:30:00Z",
          },
        ],
      });
    }
    if (path.endsWith("/admin/audit-log")) {
      return route.fulfill({
        json: pageOf([
          {
            id: "00000000-0000-4000-8000-000000000004",
            admin_user_id: adminId,
            action: "feature_flag_updated",
            target_type: "feature_flag",
            target_id: "writing_studio_v2",
            reason: "Controlled staff rollout",
            metadata_safe: { rollout_percentage: 25 },
            created_at: "2026-07-19T08:32:00Z",
          },
        ]),
      });
    }
    if (path.endsWith(`/admin/users/${userId}`)) {
      if (request.method() === "PATCH") {
        const body = request.postDataJSON() as {
          is_active?: boolean;
          reason: string;
        };
        return route.fulfill({
          json: { ...managedUser, is_active: body.is_active ?? true },
        });
      }
      return route.fulfill({ json: managedUser });
    }
    if (path.endsWith("/admin/users")) {
      return route.fulfill({ json: pageOf([managedUser]) });
    }
    return route.fulfill({ json: {} });
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const offenders = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((element) => {
        if (element.getBoundingClientRect().right <= window.innerWidth + 1)
          return false;
        let ancestor = element.parentElement;
        while (ancestor && ancestor !== document.body) {
          const overflow = getComputedStyle(ancestor).overflowX;
          if (
            ["auto", "scroll", "hidden", "clip"].includes(overflow) &&
            ancestor.getBoundingClientRect().right <= window.innerWidth + 1
          )
            return false;
          ancestor = ancestor.parentElement;
        }
        return true;
      })
      .slice(0, 8)
      .map((element) => ({
        element: `${element.tagName.toLowerCase()}.${element.className}`,
        right: Math.round(element.getBoundingClientRect().right),
        width: Math.round(element.getBoundingClientRect().width),
      })),
  );
  expect(offenders, JSON.stringify(offenders)).toEqual([]);
}

test("rejects an authenticated non-administrator without rendering the console", async ({
  page,
}) => {
  await mockAdminApi(page, { ...admin, is_admin: false });
  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "Administrator access required" }),
  ).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
});

test("renders independent operational signals and remains overflow-safe", async ({
  page,
}, testInfo) => {
  await mockAdminApi(page);
  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "Operations overview" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Launch readiness" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recent operations" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Feature controls" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recent admin actions" }),
  ).toBeVisible();
  await expect(page.getByText("9 of 12")).toBeVisible();
  await expect(page.getByText("Production")).toHaveCount(1);
  await expectNoHorizontalOverflow(page);

  const menu = page.getByRole("button", { name: "Open admin navigation" });
  if (await menu.isVisible()) {
    await menu.click();
    await expect(
      page.getByRole("navigation", { name: "Admin sections" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
  }

  await page.screenshot({
    path: `/tmp/eliteapply-admin-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test("uses opaque cursor history and resets it when a filter changes", async ({
  page,
}) => {
  const seenCursors: (string | null)[] = [];
  await mockAdminApi(page);
  await page.route("**/api/v1/admin/users?**", async (route) => {
    const url = new URL(route.request().url());
    const cursor = url.searchParams.get("cursor");
    seenCursors.push(cursor);
    return route.fulfill({
      json: pageOf(
        [{ ...managedUser, full_name: cursor ? "Second Page" : "First Page" }],
        cursor ? null : "opaque/+next==",
      ),
    });
  });

  await page.goto("/admin/users");
  await expect(page.getByText("First Page")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Second Page")).toBeVisible();
  await page.getByLabel("Role").selectOption("admin");
  await expect(page.getByText("First Page")).toBeVisible();

  expect(seenCursors).toContain("opaque/+next==");
  expect(seenCursors.at(-1)).toBeNull();
});

test("requires a reason and exact identity before deactivating an account", async ({
  page,
}) => {
  let patchBody: unknown;
  await mockAdminApi(page);
  await page.route(`**/api/v1/admin/users/${userId}`, async (route: Route) => {
    if (route.request().method() === "PATCH") {
      patchBody = route.request().postDataJSON();
      return route.fulfill({ json: { ...managedUser, is_active: false } });
    }
    return route.fulfill({ json: managedUser });
  });

  await page.goto(`/admin/users/${userId}`);
  await page.getByRole("button", { name: "Deactivate account" }).click();
  await page.getByLabel("Reason").fill("Confirmed duplicate account");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel(`Type ${managedUser.email}`).fill(managedUser.email);
  await page.getByRole("button", { name: "Deactivate account" }).last().click();

  await expect(page.getByText("Account access was updated.")).toBeVisible();
  expect(patchBody).toEqual({
    is_active: false,
    reason: "Confirmed duplicate account",
  });
});
