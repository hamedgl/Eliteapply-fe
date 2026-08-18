import { expect, test, type Page } from "@playwright/test";
import { currentTermsVersion } from "./product-config";

const applicationId = "00000000-0000-4000-8000-000000000010";
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
  consent_version: currentTermsVersion,
  consent_at: "2026-01-01T00:00:00Z",
  marketing_opt_in: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  last_login_at: null,
};
const application = {
  id: applicationId,
  title: "MSc Human-Centred AI",
  application_type: "programme",
  institution_id: null,
  programme_id: null,
  scholarship_id: null,
  stage: "preparing",
  priority: "high",
  intake: "Autumn 2027",
  primary_deadline_at: "2027-01-15T12:00:00Z",
  source_url: null,
  notes: null,
  tags: [],
  submitted_at: null,
  pre_archive_stage: null,
  version: 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-07-13T12:00:00Z",
};
const requirement = {
  id: "00000000-0000-4000-8000-000000000011",
  application_id: applicationId,
  requirement_type: "transcript",
  title: "Upload transcript",
  status: "not_started",
  required: true,
  owner: "student",
  due_at: "2026-12-01T12:00:00Z",
  source_url: null,
  notes: null,
  validation_state: "unverified",
  validation_source: null,
  position: 0,
  version: 1,
  created_at: "2026-07-01T00:00:00Z",
};
const tasks = [
  task("Review overdue draft", "2020-01-01T12:00:00Z", "open", 0),
  task("Prepare interview notes", "2099-01-01T12:00:00Z", "open", 1),
  task("Ask admissions a question", null, "open", 2),
  task("Create application", null, "completed", 3),
];
const documentLinks = [
  {
    id: "00000000-0000-4000-8000-000000000030",
    application_id: applicationId,
    document_id: "00000000-0000-4000-8000-000000000031",
    requirement_id: requirement.id,
    created_at: "2026-07-01T00:00:00Z",
  },
];

test("workspace seeds requirement and task routes without extra list requests", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  const counts = await mockApi(page);
  await page.goto(`/app/applications/${applicationId}`);
  await expect(
    page.getByRole("heading", { name: application.title, level: 1 }),
  ).toBeVisible();
  expect(counts.workspace).toBeGreaterThan(0);
  expect(counts.requirements).toBe(0);
  expect(counts.tasks).toBe(0);

  await page.getByRole("tab", { name: /^Requirements/ }).click();
  await expect(page).toHaveURL(
    new RegExp(`/app/applications/${applicationId}/requirements$`),
  );
  await expect(page.getByText(requirement.title)).toBeVisible();
  await expect(page.getByText("1 linked document")).toBeVisible();
  expect(counts.requirements).toBe(0);
  expect(counts.documentLinks).toBe(0);
  await page.screenshot({
    path: "/tmp/eliteapply-phase1-requirements.png",
    fullPage: false,
  });

  await page.getByRole("tab", { name: /^Tasks/ }).click();
  await expect(page.getByText("Review overdue draft")).toBeVisible();
  await expect(page.getByLabel("Task schedule summary")).toContainText(
    "Overdue 1",
  );
  expect(counts.tasks).toBe(0);
  expect(consoleErrors).toEqual([]);
});

test("manual refresh refetches the composite workspace, not the per-resource routes", async ({
  page,
}) => {
  const counts = await mockApi(page);
  await page.goto(`/app/applications/${applicationId}`);
  await page.getByRole("tab", { name: /^Requirements/ }).click();
  await expect(page.getByText(requirement.title)).toBeVisible();
  const before = counts.workspace;
  await page.getByRole("button", { name: "Refresh page data" }).click();
  await expect.poll(() => counts.workspace).toBeGreaterThan(before);
  // Every tab reads from the one composite payload, so refreshing must not
  // start fanning out to the dedicated list operations.
  expect(counts.requirements).toBe(0);
  expect(counts.tasks).toBe(0);
  expect(counts.documentLinks).toBe(0);
});

test("a direct task link opens the workspace on the tasks tab in one request", async ({
  page,
}) => {
  const counts = await mockApi(page);
  await page.goto(`/app/applications/${applicationId}/tasks`);
  await expect(
    page.getByRole("heading", { name: application.title, level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: /^Tasks/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByText("Prepare interview notes")).toBeVisible();
  // The composite workspace payload already carries the tasks, so the deep
  // link must not also hit the dedicated task and requirement list routes.
  expect(counts.workspace).toBeGreaterThan(0);
  expect(counts.requirements).toBe(0);
  expect(counts.tasks).toBe(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByText("Prepare interview notes")).toBeVisible();
  await page.screenshot({
    path: "/tmp/eliteapply-phase1-tasks-mobile.png",
    fullPage: false,
  });
});

test("a failed workspace degrades to a recoverable retry, never a blank page", async ({
  page,
}) => {
  const counts = await mockApi(page, true);
  await page.goto(`/app/applications/${applicationId}`);
  await expect(
    page.getByRole("heading", { name: "Application workspace unavailable" }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to applications" }),
  ).toBeVisible();
  expect(counts.workspace).toBeGreaterThan(0);
  expect(counts.requirements).toBe(0);
  expect(counts.tasks).toBe(0);
});

const workspaceReadiness = {
  application_id: applicationId,
  overall_state: "in_progress",
  readiness_percent: 25,
  blocking_issues: [],
  warnings: [],
  missing_required_documents: [],
  incomplete_requirements: [requirement.id],
  unresolved_eligibility_issues: [],
  deadline_state: "upcoming",
  recommended_next_actions: [],
};

async function mockApi(page: Page, failWorkspace = false) {
  const counts = { workspace: 0, requirements: 0, tasks: 0, documentLinks: 0 };
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
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
          ai_tokens_used: 0,
          ai_tokens_limit: 1000,
          ai_tokens_reset_at: null,
          purchased_tokens_remaining: 0,
        },
      });
    if (path.endsWith(`/applications/${applicationId}/workspace`)) {
      counts.workspace += 1;
      if (failWorkspace)
        return route.fulfill({ status: 503, json: { detail: "Unavailable" } });
      return route.fulfill({
        // Shape must match ApplicationWorkspaceResponse in docs/api/openapi.json:
        // linked_resources and readiness are required there too.
        json: {
          application,
          requirements: [requirement],
          tasks,
          document_links: documentLinks,
          linked_resources: [],
          history: [],
          readiness: workspaceReadiness,
        },
      });
    }
    if (path.endsWith(`/applications/${applicationId}/requirements`)) {
      counts.requirements += 1;
      return route.fulfill({ json: [requirement] });
    }
    if (path.endsWith(`/applications/${applicationId}/tasks`)) {
      counts.tasks += 1;
      return route.fulfill({ json: tasks });
    }
    if (path.endsWith(`/applications/${applicationId}/documents`)) {
      counts.documentLinks += 1;
      return route.fulfill({ json: documentLinks });
    }
    if (path.endsWith(`/applications/${applicationId}/readiness`))
      return route.fulfill({ json: workspaceReadiness });
    if (path.endsWith(`/applications/${applicationId}/collaborator-view`))
      return route.fulfill({ json: {} });
    return route.fulfill({ json: {} });
  });
  return counts;
}

function task(
  title: string,
  due_at: string | null,
  status: string,
  position: number,
) {
  return {
    id: `00000000-0000-4000-8000-${String(position + 20).padStart(12, "0")}`,
    application_id: applicationId,
    title,
    due_at,
    status,
    position,
    version: 1,
    created_at: "2026-07-01T00:00:00Z",
  };
}
