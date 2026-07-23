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
  tags: string[] = [],
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
  tags,
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
  const titleWidth = await dialog.getByLabel("Title").evaluate((input) => ({
    input: input.getBoundingClientRect().width,
    label: input.closest("label")!.getBoundingClientRect().width,
  }));
  expect(titleWidth.input / titleWidth.label).toBeGreaterThan(0.95);
  await dialog.getByLabel("Title").fill("Rhodes 2027");
  await dialog.getByLabel("Type").click();
  await page.getByRole("option", { name: "Scholarship" }).click();
  await expect(dialog.getByText("Scholarship opportunity")).toBeVisible();
  await dialog.getByLabel("Scholarship opportunity").click();
  await page
    .getByRole("option", { name: "Rhodes Scholarship — Rhodes Trust" })
    .click();
  expect(
    await dialog
      .locator(":is(input, select, textarea):required")
      .evaluateAll((controls) =>
        controls
          .filter(
            (control) =>
              getComputedStyle(control.closest("label")!, "::before")
                .content !== '"*"',
          )
          .map((control) => control.getAttribute("name")),
      ),
  ).toEqual([]);
  await page.screenshot({
    path: "/tmp/eliteapply-required-fields.png",
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "Create application" }).click();
  await expect
    .poll(() => submitted?.scholarship_id)
    .toBe("00000000-0000-4000-8000-000000000032");
  expect(submitted?.programme_id).toBeNull();
});

test("application modal opens a usable private programme form", async ({
  page,
}) => {
  let submitted: Record<string, unknown> | null = null;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname.endsWith("/catalogue/programmes")
    )
      submitted = request.postDataJSON() as Record<string, unknown>;
  });
  await page.goto("/app/applications");
  await page.getByRole("button", { name: "Add application" }).click();
  const addProgramme = page
    .getByRole("dialog", { name: "Add application" })
    .getByRole("link", { name: "Add a private programme" });
  await expect(addProgramme).toHaveAttribute("target", "_blank");
  await page.goto((await addProgramme.getAttribute("href"))!);
  await expect(page).toHaveURL(/\/app\/catalogue\?kind=programmes&create=1$/);
  await expect(
    page.getByRole("heading", { name: "Add private programme" }),
  ).toBeVisible();
  await expect(page.locator('select[name="institution_id"]')).toContainText(
    "University of Oxford",
  );
  const form = page.locator("form").filter({
    has: page.getByRole("heading", { name: "Add private programme" }),
  });
  await form.getByLabel("Name").fill("MSc Public Policy");
  await form
    .locator('select[name="institution_id"]')
    .selectOption("00000000-0000-4000-8000-000000000021");
  await form.getByRole("button", { name: "Create private record" }).click();
  await expect
    .poll(() => submitted?.institution_id)
    .toBe("00000000-0000-4000-8000-000000000021");
  expect(submitted?.name).toBe("MSc Public Policy");
});

test("application filters persist every field after closing and reloading", async ({
  page,
}) => {
  await page.route(/\/api\/v1\/applications\?/, (route) =>
    route.fulfill({
      json: {
        items: [
          app(
            "00000000-0000-4000-8000-000000000013",
            "MSc Computer Science",
            "preparing",
            "normal",
            ["Funding"],
          ),
        ],
        next_cursor: null,
        has_more: false,
        total: 1,
      },
    }),
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/app/applications?view=list");
  await page.getByRole("button", { name: "Filters" }).click();
  const drawer = page.getByRole("dialog", { name: "Filters" });

  await drawer.getByRole("combobox", { name: "Institution" }).click();
  await drawer.getByRole("option", { name: /University of Oxford/ }).click();
  await drawer.getByRole("combobox", { name: "Programme" }).click();
  await drawer.getByRole("option", { name: /MSc Computer Science/ }).click();
  await drawer.getByRole("combobox", { name: "Scholarship" }).click();
  await drawer.getByRole("option", { name: /Rhodes Scholarship/ }).click();

  await drawer
    .locator("label", { hasText: "Application type" })
    .getByRole("button")
    .click();
  await page.getByRole("option", { name: "Scholarship", exact: true }).click();
  await drawer.getByLabel("Deadline from").fill("2026-08-01");
  await drawer.getByLabel("Deadline to").fill("2026-12-31");
  await drawer.locator("label", { hasText: "Tag" }).getByRole("button").click();
  await page.getByRole("option", { name: "Funding", exact: true }).click();
  await drawer
    .locator("label", { hasText: "Priority" })
    .getByRole("button")
    .click();
  await page.getByRole("option", { name: "High", exact: true }).click();
  await drawer.getByLabel("Include archived").click();
  await expect(drawer.getByLabel("Include archived")).toBeChecked();

  await expect
    .poll(() => Object.fromEntries(new URL(page.url()).searchParams))
    .toMatchObject({
      institution: "00000000-0000-4000-8000-000000000021",
      institutionName: "University of Oxford",
      programme: "00000000-0000-4000-8000-000000000031",
      programmeName: "MSc Computer Science",
      scholarship: "00000000-0000-4000-8000-000000000032",
      scholarshipName: "Rhodes Scholarship",
      type: "scholarship",
      deadlineFrom: "2026-08-01",
      deadlineTo: "2026-12-31",
      tag: "Funding",
      priority: "high",
      archived: "true",
    });

  await drawer.getByRole("button", { name: "Done" }).click();
  await page.reload();
  await page.getByRole("button", { name: /Filters/ }).click();

  await expect(
    drawer.getByRole("combobox", { name: "Institution" }),
  ).toHaveValue(
    "University of Oxford",
  );
  await expect(
    drawer.getByRole("combobox", { name: "Programme" }),
  ).toHaveValue(
    "MSc Computer Science",
  );
  await expect(
    drawer.getByRole("combobox", { name: "Scholarship" }),
  ).toHaveValue(
    "Rhodes Scholarship",
  );
  await expect(
    drawer.locator("label", { hasText: "Application type" }),
  ).toContainText("Scholarship");
  await expect(drawer.getByLabel("Deadline from")).toHaveValue("2026-08-01");
  await expect(drawer.getByLabel("Deadline to")).toHaveValue("2026-12-31");
  await expect(drawer.locator("label", { hasText: "Tag" })).toContainText("Funding");
  await expect(
    drawer.locator("label", { hasText: "Priority" }),
  ).toContainText("High");
  await expect(drawer.getByLabel("Include archived")).toBeChecked();
  await page.screenshot({
    path: "/tmp/eliteapply-filters-persisted.png",
    fullPage: false,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileDrawer = await drawer.boundingBox();
  expect(mobileDrawer).not.toBeNull();
  expect(Math.round(mobileDrawer!.width)).toBe(390);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(0);
  await expect(drawer.getByRole("button", { name: "Done" })).toBeVisible();
  await page.screenshot({
    path: "/tmp/eliteapply-filters-mobile.png",
    fullPage: false,
  });
});

test("board is keyboard operable and responsive", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
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
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(0);
  const card = await page
    .locator(".application-list-table tr")
    .last()
    .boundingBox();
  const open = await page.getByRole("link", { name: "Open" }).boundingBox();
  expect(card).not.toBeNull();
  expect(open).not.toBeNull();
  expect(open!.height).toBeGreaterThanOrEqual(44);
  expect(open!.y + open!.height).toBeLessThanOrEqual(card!.y + card!.height);
  const selectTarget = await page
    .locator(".application-row-select")
    .first()
    .boundingBox();
  expect(selectTarget).not.toBeNull();
  expect(selectTarget!.width).toBeGreaterThanOrEqual(44);
  expect(selectTarget!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({
    path: "/tmp/eliteapply-phase2-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 720 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(0);
});

test("board cards drag between stages and columns collapse", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  let stage = "preparing";
  let update: Record<string, unknown> | null = null;
  await page.route("**/api/v1/applications/board*", (route) =>
    route.fulfill({
      json: {
        columns: {
          preparing:
            stage === "preparing"
              ? [
                  app(
                    "00000000-0000-4000-8000-000000000013",
                    "MSc Computer Science",
                    stage,
                  ),
                ]
              : [],
          shortlisted:
            stage === "shortlisted"
              ? [
                  app(
                    "00000000-0000-4000-8000-000000000013",
                    "MSc Computer Science",
                    stage,
                  ),
                ]
              : [],
        },
        total: 1,
      },
    }),
  );
  await page.route(
    "**/api/v1/applications/00000000-0000-4000-8000-000000000013",
    async (route) => {
      update = route.request().postDataJSON() as Record<string, unknown>;
      stage = String(update.stage);
      await route.fulfill({
        json: app(
          "00000000-0000-4000-8000-000000000013",
          "MSc Computer Science",
          stage,
        ),
      });
    },
  );

  await page.goto("/app/applications?view=board");
  const card = page.getByRole("article", { name: "MSc Computer Science" });
  const shortlisted = page.getByRole("region", { name: "Shortlisted" });
  const handle = card.locator(".application-drag-handle");
  await expect(handle).toHaveAttribute("draggable", "true");
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await handle.dispatchEvent("dragstart", { dataTransfer });
  await shortlisted.dispatchEvent("dragover", { dataTransfer });
  await shortlisted.dispatchEvent("drop", { dataTransfer });
  await expect.poll(() => update?.stage).toBe("shortlisted");
  await expect(
    shortlisted.getByRole("article", { name: "MSc Computer Science" }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/eliteapply-kanban-moved.png",
    fullPage: false,
  });

  const collapse = page.getByRole("button", { name: "Collapse Shortlisted" });
  await collapse.click();
  await expect(
    page.getByRole("button", { name: "Expand Shortlisted" }),
  ).toHaveAttribute("aria-expanded", "false");
  await expect(shortlisted.locator(".board-column-content")).toBeHidden();
  await expect(shortlisted).toHaveCSS("flex-basis", "54px");
  await page.screenshot({
    path: "/tmp/eliteapply-kanban-collapsed.png",
    fullPage: false,
  });
  expect(consoleErrors).toEqual([]);
});

test("board shows the backend reason when a move fails", async ({ page }) => {
  await page.route(
    "**/api/v1/applications/00000000-0000-4000-8000-000000000013",
    (route) =>
      route.fulfill({
        status: 422,
        headers: { "x-correlation-id": "req-test-422" },
        json: {
          correlation_id: "req-test-422",
          detail: [
            {
              type: "value_error",
              loc: ["body"],
              msg: "Value error, application is locked while submission is in progress.",
            },
          ],
        },
      }),
  );
  await page.goto("/app/applications?view=board");
  await page
    .getByLabel("Move MSc Computer Science")
    .selectOption("shortlisted");
  const alert = page.getByRole("alert");
  await expect(alert).toContainText(
    "application is locked while submission is in progress.",
  );
  await expect(alert).toContainText("req-test-422");
  await page.screenshot({
    path: "/tmp/eliteapply-kanban-error.png",
    fullPage: false,
  });
});
