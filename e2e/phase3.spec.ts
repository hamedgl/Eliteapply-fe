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
const doc = {
  id: "00000000-0000-4000-8000-000000000010",
  application_id: null,
  document_type: "statement_of_purpose",
  cv_mode: null,
  title: "MSc Computer Science — Statement of Purpose",
  prompt_text: null,
  target_requirements: {},
  content: {
    text: "My academic journey began with a curiosity about complex systems.",
  },
  evidence_map: {},
  word_limit: 1000,
  character_limit: null,
  template_id: null,
  theme: {},
  status: "draft",
  version: 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
};
const interview = {
  id: "00000000-0000-4000-8000-000000000020",
  application_id: "00000000-0000-4000-8000-000000000030",
  interview_type: "scholarship_panel",
  mode: "chat",
  context_snapshot: {},
  questions: [
    { question: "Why are you the right candidate for this scholarship?" },
  ],
  status: "in_progress",
  current_question_index: 0,
  current_question: {
    question: "Why are you the right candidate for this scholarship?",
  },
  context_version_hash: "safe-hash",
  report: null,
  prompt_version: "v1",
  disclaimer: "Practice feedback is guidance, not a guarantee of admission.",
  created_at: "2026-07-14T09:00:00Z",
  completed_at: null,
};
test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", async (route) => {
    const url = route.request().url(),
      method = route.request().method();
    if (url.endsWith("/auth/refresh"))
      return route.fulfill({
        json: { access_token: "test", id_token: "test", expires_in: 3600 },
      });
    if (url.endsWith("/users/me")) return route.fulfill({ json: user });
    if (url.endsWith("/platform/capabilities"))
      return route.fulfill({ json: [] });
    if (url.endsWith("/notifications/unread-count"))
      return route.fulfill({ json: { unread_count: 1 } });
    if (url.includes("/notifications?") && method === "GET")
      return route.fulfill({
        json: {
          items: [
            {
              id: "00000000-0000-4000-8000-000000000040",
              category: "interview",
              notification_type: "interview_ready",
              title: "Your practice session is ready",
              body: "Continue with your next scholarship question.",
              data: { path: `/app/interviews/${interview.id}` },
              mandatory: false,
              is_read: false,
              read_at: null,
              created_at: "2026-07-14T09:05:00Z",
            },
          ],
          next_cursor: null,
          has_more: false,
        },
      });
    if (url.endsWith("/notification-preferences"))
      return route.fulfill({
        json: {
          category_settings: {
            interview: { in_app: true, email: true },
            security: { in_app: true, email: true },
          },
          updated_at: "2026-07-14T09:00:00Z",
        },
      });
    if (new URL(url).pathname.endsWith("/reminders") && method === "GET")
      return route.fulfill({
        json: { items: [], next_cursor: null, has_more: false },
      });
    if (url.endsWith("/calendar-feed/token") && method === "POST")
      return route.fulfill({
        json: { feed_url: "https://calendar.example.test/private-feed.ics" },
      });
    if (
      url.endsWith("/notifications/00000000-0000-4000-8000-000000000040/read")
    )
      return route.fulfill({ json: { is_read: true } });
    if (
      new URL(url).pathname.endsWith("/academic-interviews") &&
      method === "GET"
    )
      return route.fulfill({
        json: { items: [interview], next_cursor: null, has_more: false },
      });
    if (url.endsWith(`/academic-interviews/${interview.id}/turns`))
      return route.fulfill({ json: [] });
    if (url.endsWith(`/academic-interviews/${interview.id}`))
      return route.fulfill({ json: interview });
    if (url.endsWith(`/writing-studio/documents/${doc.id}/revisions`))
      return route.fulfill({ json: [] });
    if (url.includes(`/writing-studio/documents/${doc.id}/analyses`))
      return route.fulfill({
        json: { items: [], next_cursor: null, has_more: false },
      });
    if (url.endsWith(`/writing-studio/documents/${doc.id}/generation-runs`))
      return route.fulfill({ json: [] });
    if (url.endsWith("/billing/entitlements"))
      return route.fulfill({
        json: {
          ai_tokens_used: 0,
          ai_tokens_limit: 100,
          purchased_tokens_remaining: 0,
        },
      });
    if (url.endsWith(`/writing-studio/documents/${doc.id}`) && method === "GET")
      return route.fulfill({ json: doc });
    if (
      url.endsWith(`/writing-studio/documents/${doc.id}`) &&
      method === "PATCH"
    )
      return route.fulfill({
        json: { ...doc, version: 2, content: { text: "Updated statement" } },
      });
    if (new URL(url).pathname.endsWith("/writing-studio/documents"))
      return route.fulfill({ json: [doc] });
    return route.fulfill({ json: {} });
  });
});
test("writing library and editor are responsive and save-state aware", async ({
  page,
}) => {
  await page.route("**/api/v1/applications?**", (route) =>
    route.fulfill({
      json: {
        items: [
          {
            id: "00000000-0000-4000-8000-000000000090",
            title: "Oxford MSc application",
            stage: "preparing",
          },
        ],
        next_cursor: null,
        has_more: false,
      },
    }),
  );
  await page.goto("/app/writing");
  await expect(
    page.getByRole("heading", { name: "Writing Studio" }),
  ).toBeVisible();
  await expect(page.getByLabel("Search documents")).toBeVisible();
  await page.getByLabel("Search documents").fill("not in this library");
  await expect(
    page.getByRole("heading", { name: "No documents match these filters" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByRole("button", { name: /Link an application/ }).click();
  await expect(
    page.getByRole("heading", { name: "Link to an application" }),
  ).toBeVisible();
  const linkDialog = page.getByRole("dialog", {
    name: "Link to an application",
  });
  await linkDialog.getByLabel("Application").click();
  await expect(
    linkDialog.getByRole("option", { name: /Oxford MSc application/ }),
  ).toBeVisible();
  expect(
    await linkDialog.evaluate(
      (element) => element.scrollHeight - element.clientHeight,
    ),
  ).toBeLessThanOrEqual(0);
  await expect(
    linkDialog.getByRole("button", { name: "Link application" }),
  ).toBeVisible();
  await linkDialog
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await expect(linkDialog).not.toBeVisible();
  await page.getByRole("link", { name: doc.title }).click();
  await expect(page.getByLabel("Document content")).toContainText(
    /academic journey/,
  );
  await page.getByLabel("Document content").fill("Updated statement");
  await expect(page.getByText("Unsaved")).toBeVisible();
  const canvas = page.locator(".writing-trix");
  const [canvasBox, editorMainBox] = await Promise.all([
    canvas.boundingBox(),
    page.locator(".editor-grid > main").boundingBox(),
  ]);
  expect(canvasBox?.width).toBeGreaterThan(540);
  expect(
    Math.abs(
      canvasBox!.x +
        canvasBox!.width / 2 -
        (editorMainBox!.x + editorMainBox!.width / 2),
    ),
  ).toBeLessThanOrEqual(1);
  await expect(canvas).toHaveCSS("border-color", "rgb(138, 169, 234)");
  await page.screenshot({
    path: "/tmp/eliteapply-phase3-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 2048, height: 1000 });
  expect((await canvas.boundingBox())?.width).toBeGreaterThanOrEqual(860);
  await page.screenshot({
    path: "/tmp/eliteapply-writing-editor-wide.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByLabel("Document content")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(0);
  await page.screenshot({
    path: "/tmp/eliteapply-phase3-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 720 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(0);
});

test("document preview opens as a responsive modal and closes with Escape", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.route(`**/writing-studio/documents/${doc.id}/preview`, (route) =>
    route.fulfill({
      json: {
        html: "<p>Dear Admissions Committee,</p><p>My academic journey has prepared me for advanced study.</p>",
        word_count: 229,
        character_count: 1446,
      },
    }),
  );

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/app/writing/${doc.id}`);
  await expect(page).toHaveTitle(/EliteApply/);
  await page.getByRole("button", { name: "Preview" }).click();

  const dialog = page.getByRole("dialog", { name: "Document preview" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("229 words · 1446 characters")).toBeVisible();
  await expect(dialog.getByTitle("Sanitized document preview")).toBeVisible();
  await page.screenshot({
    path: "/tmp/eliteapply-writing-preview-desktop.png",
    animations: "disabled",
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(dialog).toHaveCSS("border-radius", "0px");
  await page.screenshot({
    path: "/tmp/eliteapply-writing-preview-mobile.png",
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  expect(errors).toEqual([]);
});

test("new writing survives an empty library cache and a failed completion refresh", async ({
  page,
}) => {
  const runId = "00000000-0000-4000-8000-000000000099";
  const application = {
    id: "00000000-0000-4000-8000-000000000091",
    title: "Oxford MSc application",
    stage: "preparing",
  };
  let createBody: Record<string, unknown> | null = null;
  await page.route("**/api/v1/applications?**", (route) =>
    route.fulfill({
      json: { items: [application], next_cursor: null, has_more: false },
    }),
  );
  await page.route("**/api/v1/writing-studio/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (path.endsWith("/templates")) return route.fulfill({ json: [] });
    if (path.endsWith("/documents") && method === "GET")
      return route.fulfill({ json: [] });
    if (path.endsWith("/documents") && method === "POST") {
      createBody = route.request().postDataJSON();
      return route.fulfill({
        status: 201,
        json: {
          ...doc,
          application_id: application.id,
          application_title: application.title,
          application_stage: application.stage,
        },
      });
    }
    if (path.endsWith(`/documents/${doc.id}/generate`))
      return route.fulfill({
        status: 202,
        json: generationRun(runId, "queued"),
      });
    if (path.endsWith(`/generation-runs/${runId}`))
      return route.fulfill({ json: generationRun(runId, "completed") });
    if (path.endsWith(`/documents/${doc.id}`) && method === "GET")
      return route.fulfill({ status: 503, json: { detail: "retry later" } });
    return route.fallback();
  });

  await page.goto("/app/writing");
  await expect(page.getByText("No writing documents yet")).toBeVisible();
  await page.getByRole("button", { name: "New document" }).click();
  await page.getByRole("textbox", { name: /Title/ }).fill(doc.title);
  await page.getByLabel("Application (optional)").click();
  await page
    .getByRole("option", { name: /Oxford MSc application/ })
    .click();
  await page.getByRole("button", { name: "Create document" }).click();
  expect(createBody).toMatchObject({ application_id: application.id });
  await expect(page.getByRole("heading", { name: doc.title })).toBeVisible();

  await page
    .locator(".writing-editor > header")
    .getByRole("link", { name: "Writing Studio" })
    .click();
  await expect(page.getByText(doc.title)).toBeVisible();
  await expect(page.getByText("No writing documents yet")).toHaveCount(0);

  await page.getByText(doc.title).click();
  await page.getByLabel("Instruction").fill("Create a concise outline");
  await page.getByRole("button", { name: "Generate suggestion" }).click();
  await expect(
    page.getByText("The latest version could not be loaded."),
  ).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("heading", { name: doc.title })).toBeVisible();
  await expect(page.getByText("Document unavailable")).toHaveCount(0);
});

test("student reference draft validates its minimum and applies AI polish inline", async ({
  page,
}) => {
  const application = {
    id: "00000000-0000-4000-8000-000000000071",
    title: "Oxford MSc application",
  };
  let polishBody: Record<string, unknown> | null = null;
  const polishedDraft =
    "Professor Silva supervised my research into reliable distributed systems, where I demonstrated rigorous analysis and clear technical communication.";
  await page.route("**/api/v1/academic-references?**", (route) =>
    route.fulfill({
      json: { items: [], next_cursor: null, has_more: false },
    }),
  );
  await page.route("**/api/v1/applications?**", (route) =>
    route.fulfill({
      json: { items: [application], next_cursor: null, has_more: false },
    }),
  );
  await page.route("**/api/v1/academic-references/polish", async (route) => {
    polishBody = route.request().postDataJSON();
    return route.fulfill({
      json: { polished_content: polishedDraft },
    });
  });

  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/app/references");
  await page
    .locator("header")
    .getByRole("button", { name: "Request reference" })
    .click();

  const drawer = page.getByRole("dialog", { name: "Request reference" });
  await drawer.getByRole("radio", { name: "Student draft" }).check();
  await drawer.getByRole("button", { name: "Continue" }).click();
  await drawer.getByLabel("Full name").fill("Professor Ada Silva");
  await drawer.getByLabel("Email").fill("ada@example.test");
  await drawer.getByRole("button", { name: "Continue" }).click();

  await drawer.getByLabel("Application").fill("Oxford");
  await drawer.getByRole("option", { name: application.title }).click();

  const draft = drawer.getByLabel("Student draft");
  await draft.fill("a".repeat(49));
  await expect(drawer.getByText("49 / 50 minimum")).toBeVisible();
  await expect(
    drawer.getByRole("button", { name: "Polish with AI" }),
  ).toBeDisabled();
  await expect(
    drawer.getByRole("button", { name: "Continue" }),
  ).toBeDisabled();

  const completeDraft =
    "I worked with Professor Silva on a research project about reliable distributed systems.";
  await draft.fill(completeDraft);
  await expect(
    drawer.getByRole("button", { name: "Polish with AI" }),
  ).toBeEnabled();

  const referenceType = await drawer
    .getByRole("button", { name: "Reference type" })
    .boundingBox();
  const dueIn = await drawer.getByLabel("Due in").boundingBox();
  expect(referenceType?.y).toBe(dueIn?.y);

  await drawer
    .getByRole("button", { name: "Polish with AI" })
    .click();
  const suggestion = drawer.getByLabel("Polished reference suggestion");
  await expect(suggestion).toHaveValue(polishedDraft);
  await expect(draft).toHaveValue(completeDraft);
  expect(polishBody).toEqual({ content: completeDraft });
  await drawer.getByRole("button", { name: "Use suggestion" }).click();
  await expect(draft).toHaveValue(polishedDraft);

  const overflow = await drawer.evaluate(
    (element) => element.scrollWidth - element.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await page.screenshot({
    path: "/tmp/eliteapply-reference-request-polish.png",
    animations: "disabled",
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await draft.scrollIntoViewIfNeeded();
  const mobilePolish = drawer.locator(".reference-draft-heading > button");
  const mobilePolishBox = await mobilePolish.boundingBox();
  expect(mobilePolishBox?.height).toBeGreaterThanOrEqual(44);
  expect(
    await drawer.evaluate(
      (element) => element.scrollWidth - element.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
  await page.screenshot({
    path: "/tmp/eliteapply-reference-request-polish-mobile.png",
    animations: "disabled",
  });
});

test("existing reference upload can add and refresh security-cleared documents", async ({
  page,
}) => {
  const application = {
    id: "00000000-0000-4000-8000-000000000081",
    title: "Oxford MSc application",
  };
  const uploadedDocument = {
    id: "00000000-0000-4000-8000-000000000082",
    category: "reference_letter",
    display_name: "Professor Silva reference.pdf",
    storage_key: "test/reference.pdf",
    content_type: "application/pdf",
    size_bytes: 2048,
    malware_status: "clean",
    created_at: "2026-07-28T12:00:00Z",
  };
  let availableDocuments: typeof uploadedDocument[] = [];
  let documentRequests = 0;

  await page.route("**/api/v1/academic-references?**", (route) =>
    route.fulfill({
      json: { items: [], next_cursor: null, has_more: false },
    }),
  );
  await page.route("**/api/v1/applications?**", (route) =>
    route.fulfill({
      json: { items: [application], next_cursor: null, has_more: false },
    }),
  );
  await page.route("**/api/v1/academic-documents", (route) => {
    documentRequests += 1;
    return route.fulfill({ json: availableDocuments });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/references");
  await page
    .locator("header")
    .getByRole("button", { name: "Request reference" })
    .click();

  const drawer = page.getByRole("dialog", { name: "Request reference" });
  await drawer.getByRole("radio", { name: "Existing upload" }).check();
  await drawer.getByRole("button", { name: "Continue" }).click();
  await drawer.getByLabel("Full name").fill("Professor Ada Silva");
  await drawer.getByLabel("Email").fill("ada@example.test");
  await expect(
    drawer.getByRole("button", { name: "Referee role" }),
  ).toHaveAttribute("aria-required", "true");
  await drawer.getByRole("button", { name: "Continue" }).click();

  await drawer.getByLabel("Application").fill("Oxford");
  await drawer.getByRole("option", { name: application.title }).click();
  await expect(
    drawer.getByRole("button", { name: "Reference type" }),
  ).toHaveAttribute("aria-required", "true");
  await expect(
    drawer.getByRole("button", { name: "Existing document" }),
  ).toHaveAttribute("aria-required", "true");

  await drawer.getByRole("button", { name: "Upload new" }).click();
  const uploadDialog = page.getByRole("dialog", { name: "Upload documents" });
  await expect(uploadDialog).toBeVisible();

  availableDocuments = [uploadedDocument];
  await uploadDialog.getByRole("button", { name: "Close" }).click();
  await expect.poll(() => documentRequests).toBeGreaterThan(1);
  await drawer.getByRole("button", { name: "Existing document" }).click();
  await page
    .getByRole("option", { name: uploadedDocument.display_name })
    .click();

  const previousRequests = documentRequests;
  await drawer.getByRole("button", { name: "Refresh" }).click();
  await expect.poll(() => documentRequests).toBeGreaterThan(previousRequests);
  await expect(drawer.getByText("1 security-cleared document available.")).toBeVisible();
  expect(
    await drawer.evaluate((element) => element.scrollWidth - element.clientWidth),
  ).toBeLessThanOrEqual(0);
});

function generationRun(id: string, status: string) {
  return {
    id,
    document_id: doc.id,
    retry_of_id: null,
    mutation_id: "00000000-0000-4000-8000-000000000098",
    generation_id: "00000000-0000-4000-8000-000000000097",
    operation: "generate_outline",
    status,
    prompt_version: "v1",
    model_version: "test",
    input_hash: "test",
    usage_reservation_id: "00000000-0000-4000-8000-000000000096",
    failure_reason: null,
    created_at: "2026-07-15T00:00:00Z",
    completed_at: status === "completed" ? "2026-07-15T00:00:01Z" : null,
  };
}

test("public referee code stays out of the URL", async ({ page }) => {
  let header = "";
  await page.route("**/api/v1/referee/**", async (route) => {
    header = route.request().headers()["x-reference-code"] ?? "";
    return route.fulfill({
      json: { referee_role: "professor", institution: "Example University" },
    });
  });
  await page.goto("/referee/academic-reference/token-only");
  await page.getByLabel("Reference code").fill("separate-code");
  await page.getByRole("button", { name: "Continue securely" }).click();
  await expect.poll(() => header).toBe("separate-code");
  expect(page.url()).not.toContain("separate-code");
});

test("notification deep link opens a durable interview session", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/app/notifications");
  await expect(
    page.getByRole("heading", { name: "Notifications" }),
  ).toBeVisible();
  await expect(page.getByText("Your practice session is ready")).toBeVisible();
  const viewDetails = page.getByRole("button", { name: "View details" });
  const viewDetailsBox = await viewDetails.boundingBox();
  expect(viewDetailsBox?.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({
    path: `/tmp/eliteapply-notifications-${testInfo.project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  await viewDetails.click();
  await expect(page).toHaveURL(new RegExp(`/app/interviews/${interview.id}$`));
  await expect(
    page.getByRole("heading", { name: /scholarship panel practice/i }),
  ).toBeVisible();
  await expect(page.getByText("Why are you the right candidate")).toBeVisible();
  await page.screenshot({
    path: "/tmp/eliteapply-phase3-notification-interview.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("interview history remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/interviews");
  await expect(
    page.getByRole("heading", { name: "Interview practice" }),
  ).toBeVisible();
  await expect(page.getByText("scholarship panel")).toBeVisible();
  await page.screenshot({
    path: "/tmp/eliteapply-phase3-interviews-mobile.png",
    fullPage: true,
  });
});

test("calendar combines reminders and deadlines across responsive views", async ({
  page,
}) => {
  const reminder = {
    id: "00000000-0000-4000-8000-000000000050",
    aggregate_type: "custom",
    aggregate_id: null,
    title: "Submit final transcript",
    notes: "Upload the stamped copy.",
    scheduled_at: "2026-07-23T09:00:00Z",
    timezone: "Europe/Lisbon",
    recurrence: "none",
    channel: "in_app",
    status: "scheduled",
    snoozed_until: null,
    version: 1,
    created_at: "2026-07-14T09:00:00Z",
    updated_at: "2026-07-14T09:00:00Z",
  };
  await page.route("**/api/v1/reminders?**", (route) =>
    route.fulfill({
      json: { items: [reminder], next_cursor: null, has_more: false },
    }),
  );
  await page.route("**/api/v1/applications?**", (route) =>
    route.fulfill({
      json: {
        items: [
          {
            id: "00000000-0000-4000-8000-000000000060",
            title: "Oxford scholarship",
            application_type: "scholarship",
            primary_deadline_at: "2026-07-24T00:00:00Z",
          },
        ],
        next_cursor: null,
        has_more: false,
      },
    }),
  );

  await page.goto("/app/reminders?view=calendar");
  await expect(
    page.getByRole("button", { name: /Submit final transcript/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Submit final transcript/ }),
  ).toHaveCSS("text-align", "left");
  await expect(
    page.getByRole("button", { name: /Oxford scholarship/ }),
  ).toBeVisible();
  const todayMarker = await page
    .locator(
      ".event-manager-month-grid > .today .event-manager-day-heading > button",
    )
    .first()
    .boundingBox();
  expect(todayMarker).not.toBeNull();
  expect(Math.abs(todayMarker!.width - todayMarker!.height)).toBeLessThan(0.5);
  await page.getByRole("button", { name: /Submit final transcript/ }).click();
  await expect(
    page.getByRole("heading", { name: "Edit reminder" }),
  ).toBeVisible();
  await page.locator(".reminders-editor").screenshot({
    path: "/tmp/eliteapply-reminder-editor.png",
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Close" }).click();
  await page.screenshot({
    path: "/tmp/eliteapply-reminders-calendar-desktop.png",
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator(".event-manager")).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await page.screenshot({
    path: "/tmp/eliteapply-reminders-calendar-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});

test("calendar sync creates, copies, opens and revokes a private feed", async ({
  page,
}) => {
  const secret = "calendar-secret-never-display";
  const feedUrl = `https://calendar.example.test/api/v1/calendar-feed/${secret}.ics`;
  let creates = 0,
    revokes = 0,
    feedGets = 0;
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (value: string) => {
          (window as Window & { __copiedFeed?: string }).__copiedFeed = value;
        },
      },
    });
  });
  page.on("request", (request) => {
    if (request.url().endsWith(".ics")) feedGets += 1;
  });
  await page.route("**/api/v1/calendar-feed/token", async (route) => {
    if (route.request().method() === "POST") {
      creates += 1;
      return route.fulfill({
        json: { feed_url: feedUrl, created_at: "2026-07-14T09:00:00Z" },
      });
    }
    revokes += 1;
    return route.fulfill({ status: 204 });
  });

  await page.goto("/app/reminders");
  await page.getByRole("button", { name: "Create calendar link" }).click();
  await expect(
    page.getByText("Calendar subscription link created."),
  ).toBeVisible();
  await expect(page.getByText("••••••••.ics", { exact: false })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(secret);
  await expect(
    page.getByRole("link", { name: "Open in calendar app" }),
  ).toHaveAttribute("href", feedUrl.replace("https:", "webcal:"));
  const openIcs = page.getByRole("link", { name: "Open .ics feed" });
  await expect(openIcs).toHaveAttribute("href", feedUrl);
  await expect(openIcs).toHaveAttribute("rel", "noopener noreferrer");
  await expect(
    page.getByRole("link", { name: "Download .ics" }),
  ).toHaveAttribute("download", "eliteapply-calendar.ics");

  await page.getByRole("button", { name: "Copy URL" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { __copiedFeed?: string }).__copiedFeed,
      ),
    )
    .toBe(feedUrl);
  await page.getByText("Set up Google Calendar").click();
  await expect(
    page.getByText("Subscribe from web", { exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/eliteapply-calendar-sync-desktop.png",
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".calendar-sync").screenshot({
    path: "/tmp/eliteapply-calendar-sync-mobile.png",
    animations: "disabled",
  });
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Revoke calendar link" }).click();
  await expect(
    page.getByText("The calendar link has been revoked."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create calendar link" }),
  ).toBeVisible();
  expect(creates).toBe(1);
  expect(revokes).toBe(1);
  expect(feedGets).toBe(0);
});

test("calendar sync shows a safe recoverable create error", async ({
  page,
}) => {
  await page.route("**/api/v1/calendar-feed/token", (route) =>
    route.fulfill({ status: 503, json: { detail: "calendar-secret" } }),
  );
  await page.goto("/app/reminders");
  await page.getByRole("button", { name: "Create calendar link" }).click();
  await expect(
    page.getByText("We couldn’t create the calendar link. Try again shortly."),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("calendar-secret");
});
