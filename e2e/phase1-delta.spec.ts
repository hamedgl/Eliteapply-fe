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

test.beforeEach(async ({ page }) => {
  let submitted = false;
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/refresh"))
      return route.fulfill({
        json: { access_token: "test", id_token: "test", expires_in: 3600 },
      });
    if (path.endsWith("/users/me")) return route.fulfill({ json: user });
    if (path.endsWith("/platform/capabilities"))
      return route.fulfill({ json: [] });
    if (path.endsWith("/billing/entitlements"))
      return route.fulfill({
        json: {
          plan_key: "free",
          plan_name: "free",
          plan_label: "Free",
          subscription_status: "active",
          is_active: true,
          cancel_at_period_end: false,
          current_period_end: null,
          trial_end: null,
          ai_tokens_used: 800,
          ai_tokens_limit: 1000,
          ai_tokens_reset_at: "2026-08-01T00:00:00Z",
          purchased_tokens_remaining: 250,
        },
      });
    if (path.endsWith("/billing/subscription"))
      return route.fulfill({
        json: {
          subscription_status: "active",
          plan_key: "free",
          plan_label: "Free",
          cancel_at_period_end: false,
          current_period_start: null,
          current_period_end: null,
          trial_end: null,
          canceled_at: null,
        },
      });
    if (path.endsWith("/billing/plans")) return route.fulfill({ json: [] });
    if (path.endsWith("/billing/token-products"))
      return route.fulfill({
        json: {
          price_cents_per_1k: 10,
          min_tokens: 1000,
          step_tokens: 1000,
          max_tokens: 10000,
          currency: "USD",
          purchased_tokens_remaining: 250,
        },
      });
    if (path.endsWith("/billing/purchases")) return route.fulfill({ json: [] });
    if (path.endsWith("/billing/usage"))
      return route.fulfill({
        json: {
          period: "current",
          summary: {
            prompt_tokens: 400,
            completion_tokens: 400,
            total_tokens: 800,
            metered_tokens: 800,
            cost_usd: 0.08,
            request_count: 2,
          },
          logs: { items: [], next_cursor: null, has_more: false, total: 0 },
        },
      });
    if (path.endsWith("/applications/00000000-0000-4000-8000-000000000010/readiness"))
      return route.fulfill({
        json: {
          application_id: "00000000-0000-4000-8000-000000000010",
          overall_state: "ready",
          readiness_percent: 100,
          blocking_issues: [],
          warnings: [],
          missing_required_documents: [],
          incomplete_requirements: [],
          unresolved_eligibility_issues: [],
          deadline_state: "upcoming",
          recommended_next_actions: ["Review the final submission"],
        },
      });
    if (
      path.endsWith("/applications/00000000-0000-4000-8000-000000000010/submit") &&
      route.request().method() === "POST"
    ) {
      submitted = true;
      return route.fulfill({ json: application("submitted") });
    }
    if (path.endsWith("/applications/00000000-0000-4000-8000-000000000010/workspace"))
      return route.fulfill({
        json: {
          application: application(submitted ? "submitted" : "ready_to_submit"),
          requirements: [],
          tasks: [],
          document_links: [],
          history: [],
        },
      });
    if (path.endsWith("/academic-documents/00000000-0000-4000-8000-000000000002/scan-status"))
      return route.fulfill({
        json: {
          document_id: "00000000-0000-4000-8000-000000000002",
          malware_status: "clean",
          usable_for_protected_workflows: true,
        },
      });
    if (path.endsWith("/academic-documents/00000000-0000-4000-8000-000000000002"))
      return route.fulfill({
        json: {
          id: "00000000-0000-4000-8000-000000000002",
          category: "transcript",
          display_name: "Academic transcript.pdf",
          storage_key: "academic/secure/file.pdf",
          content_type: "application/pdf",
          size_bytes: 1024,
          tags: [],
          malware_status: "clean",
          created_at: "2026-07-01T00:00:00Z",
          expires_at: null,
        },
      });
    return route.fulfill({ json: {} });
  });
});

test("billing uses server-owned entitlement and product values", async ({ page }) => {
  await page.goto("/app/settings/billing");
  await expect(page.getByRole("heading", { name: "Billing & usage" })).toBeVisible();
  await expect(page.getByText("800 of 1,000 tokens")).toBeVisible();
  await expect(page.getByText(/No paid plan is currently available/)).toBeVisible();
  await expect(page.getByLabel("Token amount")).toHaveValue("1000");
});

test("document detail waits for a successful security scan", async ({ page }) => {
  await page.goto("/app/documents/00000000-0000-4000-8000-000000000002");
  await expect(page.getByRole("heading", { name: "Academic transcript.pdf" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ready to use" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download document" })).toBeEnabled();
});

test("workspace checks readiness immediately before submission", async ({ page }) => {
  await page.goto("/app/applications/00000000-0000-4000-8000-000000000010");
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "100");
  await page.getByRole("button", { name: "Mark submitted" }).click();
  await expect(page.getByText(/Programme · Submitted/)).toBeVisible();
});

function application(stage: string) {
  return {
    id: "00000000-0000-4000-8000-000000000010",
    title: "MSc Human-Centred AI",
    application_type: "programme",
    institution_id: null,
    programme_id: null,
    scholarship_id: null,
    stage,
    priority: "high",
    intake: "Autumn 2027",
    primary_deadline_at: "2027-01-15T12:00:00Z",
    source_url: null,
    notes: null,
    tags: [],
    submitted_at: stage === "submitted" ? "2026-07-13T12:00:00Z" : null,
    pre_archive_stage: null,
    version: stage === "submitted" ? 2 : 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-07-13T12:00:00Z",
  };
}
