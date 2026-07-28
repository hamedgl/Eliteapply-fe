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

test("opportunity import exposes extracted fields and preserves list edits", async ({
  page,
}, testInfo) => {
  const importId = "00000000-0000-4000-8000-000000000061";
  const extracted = {
    id: importId,
    application_id: null,
    source_type: "url",
    source_url: "https://example.edu/programmes/msc-computer-science",
    source_hash: "hash",
    extraction_version: "opportunity-extraction.v2",
    status: "extracted",
    extracted_fields: {
      institution: "Example University",
      deadline: "2027-01-15",
      required_documents: ["Transcript"],
    },
    field_confidence: {
      institution: 0.96,
      deadline: 0.88,
      required_documents: 0.72,
    },
    user_corrections: {},
    confirmed_fields: [],
    retrieved_at: "2026-07-28T12:00:00Z",
    verified_at: null,
  };
  await page.route(/\/api\/v1\/application-intelligence\/imports(?:\/.*)?(?:\?.*)?$/, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === "POST" && path.endsWith("/confirm")) {
      expect(request.postDataJSON().corrections.required_documents).toEqual([
        "Transcript",
        "Passport",
      ]);
      return route.fulfill({
        json: { ...extracted, status: "confirmed" },
      });
    }
    if (path.endsWith(`/${importId}`))
      return route.fulfill({ json: extracted });
    return route.fulfill({
      json: {
        items: [extracted],
        next_cursor: null,
        has_more: false,
        total: 1,
      },
    });
  });

  await page.goto("/app/applications/import");
  await page.getByRole("button", { name: /Msc Computer Science/ }).click();
  await expect(
    page.getByRole("heading", { name: "Review extracted fields" }),
  ).toBeVisible();
  await page
    .getByLabel(/Required Documents/)
    .fill("Transcript\nPassport");
  await page.getByRole("button", { name: "Confirm 3 fields" }).click();
  await expect(page.getByText("confirmed", { exact: true })).toBeVisible();
  await page.screenshot({
    path: `/tmp/eliteapply-import-${testInfo.project.name}.png`,
    fullPage: true,
  });
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

test("Escape closes custom application modals", async ({ page }) => {
  await page.goto("/app/applications");
  await page.getByRole("button", { name: "Add application" }).click();
  const dialog = page.getByRole("dialog", { name: "Add application" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Type").click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
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

test("eligibility explains its factors and returns recommendations", async ({
  page,
}, testInfo) => {
  const applicationId = "00000000-0000-4000-8000-000000000013";
  const eligibility = {
    id: "00000000-0000-4000-8000-000000000041",
    application_id: applicationId,
    findings: [
      {
        id: "research",
        status: "needs_review",
        checked: "Relevant research experience",
        evidence: [
          {
            source: "academic_profile",
            summary: "Research experience appears in the confirmed profile.",
            source_id: "00000000-0000-4000-8000-000000000051",
          },
        ],
        reason: "Related evidence exists but still needs human confirmation.",
        recommended_action: "Compare the evidence with the official criterion.",
      },
    ],
    strengths: [],
    risks: ["Relevant research experience"],
    questions: ["Confirm the research evidence"],
    readiness_score: 58,
    readiness_components: {
      profile: 75,
      requirements: 50,
      deadline_confirmed: 100,
      eligibility_evidence: 50,
    },
    factors: [
      {
        key: "profile",
        label: "Academic profile",
        score: 75,
        weight: 25,
        reason: "Completion of the confirmed academic-profile sections.",
        sources: ["academic_profile"],
      },
      {
        key: "requirements",
        label: "Application requirements",
        score: 50,
        weight: 25,
        reason: "Required application items marked complete.",
        sources: ["application_requirements"],
      },
      {
        key: "deadline_confirmed",
        label: "Deadline confirmed",
        score: 100,
        weight: 25,
        reason: "Whether the application has a recorded deadline.",
        sources: ["application"],
      },
      {
        key: "eligibility_evidence",
        label: "Eligibility evidence",
        score: 50,
        weight: 25,
        reason: "Official criteria with matching confirmed profile evidence.",
        sources: ["scholarship", "academic_profile"],
      },
    ],
    overall_status: "needs_review",
    trigger_source: "refresh",
    data_sources: [
      {
        source: "scholarship",
        label: "Linked scholarship eligibility criteria",
        source_id: "00000000-0000-4000-8000-000000000032",
        last_updated_at: "2026-07-20T00:00:00Z",
      },
      {
        source: "academic_profile",
        label: "Academic profile (75% complete)",
        source_id: "00000000-0000-4000-8000-000000000051",
        last_updated_at: "2026-07-24T00:00:00Z",
      },
    ],
    important_changes: [],
    disclaimer: "Preparation guidance only.",
    created_at: "2026-07-26T01:39:00Z",
    last_calculated_at: "2026-07-26T01:39:00Z",
  };
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith(`/applications/${applicationId}/workspace`))
      return route.fulfill({
        json: {
          application: app(applicationId, "MSc Computer Science", "preparing"),
          requirements: [],
          tasks: [],
          document_links: [],
          linked_resources: [],
          history: [],
          counts: {},
          readiness: {
            application_id: applicationId,
            overall_state: "in_progress",
            readiness_percent: 58,
            blocking_issues: [],
            warnings: [],
            missing_required_documents: [],
            incomplete_requirements: [],
            unresolved_eligibility_issues: ["Relevant research experience"],
            deadline_state: "safe",
            recommended_next_actions: ["Review eligibility evidence"],
          },
        },
      });
    if (path.endsWith("/eligibility/history"))
      return route.fulfill({
        json: { items: [eligibility], next_cursor: null, has_more: false },
      });
    if (path.endsWith("/eligibility/recommendations"))
      return route.fulfill({
        json: {
          summary: "Focus first on evidence that still needs confirmation.",
          recommendations: [
            "Compare the saved evidence with the provider wording.",
          ],
          generated_by: "ai",
          generated_at: "2026-07-26T02:00:00Z",
          disclaimer: "Verify every rule with the provider.",
        },
      });
    if (path.endsWith("/eligibility"))
      return route.fulfill({ json: eligibility });
    return route.fallback();
  });

  await page.goto(`/app/applications/${applicationId}/eligibility`);
  await expect(
    page.getByRole("heading", { name: "How this score is calculated" }),
  ).toBeVisible();
  await expect(page.getByText("Linked scholarship eligibility criteria")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "See report" }),
  ).toHaveAttribute("href", "#eligibility-score-report");
  await page
    .getByRole("button", { name: "Ask AI for recommendations" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Recommended next steps" }),
  ).toBeVisible();
  await expect(page.getByText("Compare the saved evidence with the provider wording.")).toBeVisible();
  await page.screenshot({
    path: `/tmp/eliteapply-eligibility-${testInfo.project.name}.png`,
    fullPage: true,
  });
});
