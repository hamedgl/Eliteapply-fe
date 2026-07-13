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
  await page.screenshot({
    path: "/tmp/eliteapply-phase3-mobile.png",
    fullPage: true,
  });
});
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
