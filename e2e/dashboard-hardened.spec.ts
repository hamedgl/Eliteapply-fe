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
    if (url.endsWith("/academic-profile")) {
      return route.fulfill({ json: null });
    }
    if (url.endsWith("/academic-documents")) {
      return route.fulfill({ json: [] });
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

test("stage colours explain themselves and every workspace page has help", async ({
  page,
}) => {
  await page.route("**/api/v1/dashboard", (route) =>
    route.fulfill({
      json: {
        ...dashboard,
        applications_by_stage: { researching: 3, preparing: 1 },
      },
    }),
  );

  await page.goto("/app/dashboard");

  const overview = page
    .locator(".dashboard-surface")
    .filter({ hasText: "Applications overview" });
  await overview.getByRole("button", { name: "Researching 3" }).hover();
  await expect(overview.getByRole("status")).toContainText(
    "You are still deciding whether this opportunity is worth pursuing.",
  );
  await expect(overview.getByRole("status")).toContainText("3 of 4");

  const preparingSegment = overview.locator(
    '.donut-segment[aria-label^="Preparing, 1 application"]',
  );
  const donutBox = await overview.locator(".dashboard-donut svg").boundingBox();
  expect(donutBox).not.toBeNull();
  await page.mouse.move(
    donutBox!.x + donutBox!.width * 0.22,
    donutBox!.y + donutBox!.height * 0.22,
  );
  await expect(overview.getByRole("status")).toContainText(
    "You are working on the requirements and supporting material.",
  );
  await preparingSegment.focus();
  await page.screenshot({
    path: "/tmp/eliteapply-stage-details.png",
    fullPage: true,
    animations: "disabled",
  });

  const help = page.getByRole("button", {
    name: "About this page: Dashboard",
  });
  await help.click();
  const guide = page.getByRole("dialog", { name: "About Dashboard" });
  await expect(guide).toContainText(
    "This page gives you a quick read on your whole workspace.",
  );
  await expect(guide.getByRole("listitem")).toHaveCount(2);
  await page.screenshot({
    path: "/tmp/eliteapply-page-guide.png",
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(guide).toBeHidden();

  await page.setViewportSize({ width: 320, height: 700 });
  const mobileHelp = page.getByRole("button", {
    name: "About this page: Dashboard",
  });
  const size = await mobileHelp.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(size.width).toBeGreaterThanOrEqual(44);
  expect(size.height).toBeGreaterThanOrEqual(44);
  await mobileHelp.click();
  await expect(page.getByRole("dialog", { name: "About Dashboard" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(0);
  await page.screenshot({
    path: "/tmp/eliteapply-page-guide-mobile.png",
    animations: "disabled",
  });
});

test("mobile dashboard keeps the progress gauge and drawer contained", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/app/dashboard");

  const ring = page.getByRole("progressbar", {
    name: "Academic profile completion",
  });
  const title = page.getByRole("heading", {
    name: "Build your academic profile",
  });
  const [ringBox, titleBox] = await Promise.all([
    ring.boundingBox(),
    title.boundingBox(),
  ]);
  expect(ringBox).not.toBeNull();
  expect(titleBox).not.toBeNull();
  expect(ringBox!.x + ringBox!.width).toBeLessThanOrEqual(titleBox!.x);

  const focusActions = page.locator(".dashboard-focus-actions > *");
  await expect(focusActions).toHaveCount(2);
  for (const action of await focusActions.all()) {
    const box = await action.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }

  await page.getByRole("button", { name: "Open navigation" }).click();
  const drawer = page.getByRole("dialog", {
    name: "Application navigation",
  });
  const drawerBox = await drawer.boundingBox();
  expect(drawerBox).not.toBeNull();
  expect(drawerBox!.width).toBeLessThanOrEqual(272);
  await expect(
    drawer.getByRole("link", { name: "Interview Practice" }),
  ).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("upcoming deadlines use an interactive compact calendar", async ({
  page,
}) => {
  const applicationId = "00000000-0000-4000-8000-000000000070";
  await page.route("**/api/v1/dashboard", (route) =>
    route.fulfill({
      json: {
        ...dashboard,
        applications_by_stage: { preparing: 1 },
        upcoming_deadlines: [
          {
            application_id: applicationId,
            application_title: "Oxford scholarship",
            deadline_at: "2026-07-24T00:00:00Z",
          },
        ],
      },
    }),
  );

  await page.goto("/app/dashboard");
  const deadlines = page
    .locator(".dashboard-surface")
    .filter({ hasText: "Upcoming deadlines" });
  await expect(deadlines.getByText("July 2026")).toBeVisible();
  await expect(
    deadlines.getByRole("button", { name: /Oxford scholarship/ }),
  ).toBeVisible();
  await deadlines.getByRole("button", { name: "Next period" }).click();
  await expect(deadlines.getByText("August 2026")).toBeVisible();
  await deadlines.getByRole("button", { name: "Previous period" }).click();
  await expect(deadlines.getByText("July 2026")).toBeVisible();
  await page.screenshot({
    path: "/tmp/eliteapply-dashboard-deadline-calendar.png",
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await page.screenshot({
    path: "/tmp/eliteapply-dashboard-deadline-calendar-mobile.png",
    fullPage: true,
    animations: "disabled",
  });

  await deadlines.getByRole("button", { name: /Oxford scholarship/ }).click();
  await expect(page).toHaveURL(
    new RegExp(`/app/applications/${applicationId}$`),
  );
});

test("navigation preloads the next workspace route on hover", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/app/dashboard");

  const applicationPageRequest = page.waitForRequest(
    (request) =>
      request.url().includes("/src/features/applications/ApplicationsPage.tsx"),
  );
  await page.getByRole("link", { name: "Applications" }).hover();
  await applicationPageRequest;
  await expect(
    page.getByRole("heading", { name: "Good morning, Hamed" }),
  ).toBeVisible();
  await page.screenshot({ path: "/tmp/eliteapply-navigation-preload.png" });
  expect(errors).toEqual([]);
});

test("workspace guide uses real saved data and keeps three actions per page", async ({
  page,
}, testInfo) => {
  await page.route("**/api/v1/dashboard", (route) =>
    route.fulfill({
      json: {
        ...dashboard,
        applications_by_stage: { draft: 1 },
        missing_documents: 2,
      },
    }),
  );
  await page.route("**/api/v1/academic-profile", (route) =>
    route.fulfill({
      json: {
        id: "00000000-0000-4000-8000-000000000020",
        version: 1,
        created_at: "2026-07-19T12:00:00Z",
        updated_at: "2026-07-19T12:00:00Z",
        applicant_type: "International student",
        intended_study_level: "Postgraduate",
        target_countries: ["Portugal"],
        sections: {
          education: {
            summary: "BSc Computer Science, completed with distinction.",
          },
        },
        completion: {},
      },
    }),
  );
  await page.route("**/api/v1/academic-documents", (route) =>
    route.fulfill({
      json: [
        {
          id: "00000000-0000-4000-8000-000000000030",
          category: "transcript",
          display_name: "Transcript.pdf",
          storage_key: "test/transcript.pdf",
          content_type: "application/pdf",
          size_bytes: 2048,
          malware_status: "clean",
          created_at: "2026-07-19T12:00:00Z",
        },
      ],
    }),
  );
  await page.route("**/api/v1/writing-studio/documents*", (route) =>
    route.fulfill({
      json: [{ id: "writing-1", status: "draft" }],
    }),
  );
  await page.route("**/api/v1/academic-references*", (route) =>
    route.fulfill({
      json: { items: [{ id: "reference-1", status: "invited" }] },
    }),
  );
  await page.route("**/api/v1/academic-interviews*", (route) =>
    route.fulfill({
      json: { items: [{ id: "interview-1", status: "completed" }] },
    }),
  );

  await page.goto("/app/dashboard");

  const guide = page.getByRole("region", { name: "Workspace guide" });
  await expect(guide.getByText("8/12 complete")).toBeVisible();
  await expect(
    guide.getByRole("heading", { name: "Strengthen your evidence" }),
  ).toBeVisible();
  await guide.getByRole("button", { name: "Previous" }).click();
  await expect(
    guide.getByRole("link", {
      name: "Add academic background, Completed",
    }),
  ).toHaveAttribute("href", "/app/academic-profile");
  await expect(
    page.getByRole("progressbar", { name: "Academic profile completion" }),
  ).toHaveAttribute("aria-valuenow", "0");
  await expect(guide.getByRole("link")).toHaveCount(3);
  await page.screenshot({
    path: `/tmp/eliteapply-workspace-guide-${testInfo.project.name}.png`,
    fullPage: true,
  });

  await guide.getByRole("button", { name: "Next" }).click();
  await expect(
    guide.getByRole("heading", { name: "Strengthen your evidence" }),
  ).toBeVisible();
  await expect(guide.getByRole("link")).toHaveCount(3);
  await expect(
    guide.getByRole("link", {
      name: "Upload a supporting document, Completed",
    }),
  ).toHaveAttribute("href", "/app/documents");

  await guide.getByRole("button", { name: "Next" }).click();
  await expect(
    guide.getByRole("heading", { name: "Prepare to apply" }),
  ).toBeVisible();
  await expect(guide.getByRole("link")).toHaveCount(3);
  await expect(
    guide.getByRole("link", { name: "Resolve document gaps, Start" }),
  ).toHaveAttribute("href", "/app/documents");

  await guide.getByRole("button", { name: "Next" }).click();
  await expect(
    guide.getByRole("heading", { name: "Develop your submission" }),
  ).toBeVisible();
  await expect(guide.getByRole("link")).toHaveCount(3);
  await expect(
    guide.getByRole("link", {
      name: "Draft an application response, Completed",
    }),
  ).toHaveAttribute("href", "/app/writing");
  await expect(
    guide.getByRole("link", { name: "Request a reference, Completed" }),
  ).toHaveAttribute("href", "/app/references");
  await expect(
    guide.getByRole("link", {
      name: "Complete an interview practice, Completed",
    }),
  ).toHaveAttribute("href", "/app/interviews");
  await expect(guide.getByRole("button", { name: "Next" })).toBeDisabled();

  const viewAll = guide.getByRole("button", { name: "View all steps" });
  await viewAll.click();
  const allSteps = page.getByRole("dialog", { name: "Workspace guide" });
  await expect(allSteps.getByRole("link")).toHaveCount(12);
  await page.keyboard.press("Escape");
  await expect(allSteps).toBeHidden();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("workspace guide stays touch-safe at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/app/dashboard");

  const guide = page.getByRole("region", { name: "Workspace guide" });
  await expect(guide.getByText("0/12 complete")).toBeVisible();
  await expect(guide.getByRole("link")).toHaveCount(3);

  const next = guide.getByRole("button", { name: "Next" });
  const nextSize = await next.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(nextSize.width).toBeGreaterThanOrEqual(44);
  expect(nextSize.height).toBeGreaterThanOrEqual(44);
  await next.click();
  await expect(guide.getByRole("link")).toHaveCount(3);
  await next.click();
  await next.click();
  await expect(
    guide.getByRole("link", {
      name: "Draft an application response, Start",
    }),
  ).toHaveAttribute("href", "/app/writing/new");
  await expect(
    guide.getByRole("link", { name: "Request a reference, Start" }),
  ).toHaveAttribute("href", "/app/references/new");
  await expect(
    guide.getByRole("link", {
      name: "Complete an interview practice, Start",
    }),
  ).toHaveAttribute("href", "/app/interviews/new");

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
  const guideNextSize = await page
    .getByRole("region", { name: "Workspace guide" })
    .getByRole("button", { name: "Next" })
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
  expect(guideNextSize.width).toBeGreaterThanOrEqual(44);
  expect(guideNextSize.height).toBeGreaterThanOrEqual(44);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
