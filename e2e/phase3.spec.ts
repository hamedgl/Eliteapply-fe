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
  questions: [{ question: "Why are you the right candidate for this scholarship?" }],
  status: "in_progress",
  current_question_index: 0,
  current_question: { question: "Why are you the right candidate for this scholarship?" },
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
      return route.fulfill({ json: { items: [{ id: "00000000-0000-4000-8000-000000000040", category: "interview", notification_type: "interview_ready", title: "Your practice session is ready", body: "Continue with your next scholarship question.", data: { path: `/app/interviews/${interview.id}` }, mandatory: false, is_read: false, read_at: null, created_at: "2026-07-14T09:05:00Z" }], next_cursor: null, has_more: false } });
    if (url.endsWith("/notification-preferences"))
      return route.fulfill({ json: { category_settings: { interview: { in_app: true, email: true }, security: { in_app: true, email: true } }, updated_at: "2026-07-14T09:00:00Z" } });
    if (new URL(url).pathname.endsWith("/reminders") && method === "GET")
      return route.fulfill({ json: { items: [], next_cursor: null, has_more: false } });
    if (url.endsWith("/calendar-feed/token") && method === "POST")
      return route.fulfill({ json: { feed_url: "https://calendar.example.test/private-feed.ics" } });
    if (url.endsWith("/notifications/00000000-0000-4000-8000-000000000040/read"))
      return route.fulfill({ json: { is_read: true } });
    if (new URL(url).pathname.endsWith("/academic-interviews") && method === "GET")
      return route.fulfill({ json: { items: [interview], next_cursor: null, has_more: false } });
    if (url.endsWith(`/academic-interviews/${interview.id}/turns`))
      return route.fulfill({ json: [] });
    if (url.endsWith(`/academic-interviews/${interview.id}`))
      return route.fulfill({ json: interview });
    if (url.endsWith(`/writing-studio/documents/${doc.id}/revisions`))
      return route.fulfill({ json: [] });
    if (url.includes(`/writing-studio/documents/${doc.id}/analyses`))
      return route.fulfill({ json: { items: [], next_cursor: null, has_more: false } });
    if (url.endsWith(`/writing-studio/documents/${doc.id}/generation-runs`))
      return route.fulfill({ json: [] });
    if (url.endsWith("/billing/entitlements"))
      return route.fulfill({ json: { ai_tokens_used: 0, ai_tokens_limit: 100, purchased_tokens_remaining: 0 } });
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
  await page.goto("/app/writing");
  await expect(
    page.getByRole("heading", { name: "Writing Studio" }),
  ).toBeVisible();
  await page.getByText(doc.title).click();
  await expect(page.getByLabel("Document content")).toHaveValue(
    /academic journey/,
  );
  await page.getByLabel("Document content").fill("Updated statement");
  await expect(page.getByText("Unsaved")).toBeVisible();
  await page.screenshot({
    path: "/tmp/eliteapply-phase3-desktop.png",
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

test("new writing survives an empty library cache and a failed completion refresh", async ({
  page,
}) => {
  const runId = "00000000-0000-4000-8000-000000000099";
  await page.route("**/api/v1/writing-studio/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (path.endsWith("/templates")) return route.fulfill({ json: [] });
    if (path.endsWith("/documents") && method === "GET")
      return route.fulfill({ json: [] });
    if (path.endsWith("/documents") && method === "POST")
      return route.fulfill({ status: 201, json: doc });
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
  await page.getByRole("link", { name: "New document" }).click();
  await page.getByLabel("Title").fill(doc.title);
  await page.getByRole("button", { name: "Create document" }).click();
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

test("notification deep link opens a durable interview session", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/app/notifications");
  await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  await expect(page.getByText("Your practice session is ready")).toBeVisible();
  await page.getByRole("button", { name: "Open related item" }).click();
  await expect(page).toHaveURL(new RegExp(`/app/interviews/${interview.id}$`));
  await expect(page.getByRole("heading", { name: /scholarship panel practice/i })).toBeVisible();
  await expect(page.getByText("Why are you the right candidate")).toBeVisible();
  await page.screenshot({ path: "/tmp/eliteapply-phase3-notification-interview.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("interview history remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/interviews");
  await expect(page.getByRole("heading", { name: "Interview practice" })).toBeVisible();
  await expect(page.getByText("scholarship panel")).toBeVisible();
  await page.screenshot({ path: "/tmp/eliteapply-phase3-interviews-mobile.png", fullPage: true });
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
  await expect(page.getByText("Calendar subscription link created.")).toBeVisible();
  await expect(page.getByText("••••••••.ics", { exact: false })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(secret);
  await expect(page.getByRole("link", { name: "Open in calendar app" })).toHaveAttribute(
    "href",
    feedUrl.replace("https:", "webcal:"),
  );
  const openIcs = page.getByRole("link", { name: "Open .ics feed" });
  await expect(openIcs).toHaveAttribute("href", feedUrl);
  await expect(openIcs).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.getByRole("link", { name: "Download .ics" })).toHaveAttribute(
    "download",
    "eliteapply-calendar.ics",
  );

  await page.getByRole("button", { name: "Copy URL" }).click();
  await expect.poll(() =>
    page.evaluate(
      () => (window as Window & { __copiedFeed?: string }).__copiedFeed,
    ),
  ).toBe(feedUrl);
  await page.getByText("Set up Google Calendar").click();
  await expect(page.getByText("Subscribe from web", { exact: false })).toBeVisible();
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
  await expect(page.getByText("The calendar link has been revoked.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create calendar link" })).toBeVisible();
  expect(creates).toBe(1);
  expect(revokes).toBe(1);
  expect(feedGets).toBe(0);
});

test("calendar sync shows a safe recoverable create error", async ({ page }) => {
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
