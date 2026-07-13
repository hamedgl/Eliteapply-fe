import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", async (route) => {
    if (route.request().url().endsWith("/platform/capabilities")) {
      return route.fulfill({ json: [] });
    }
    return route.fulfill({ status: 401, json: { detail: "Signed out" } });
  });
});

const requiredRoutes = [
  ["/features", "One workspace for the complete application process."],
  ["/features/scholarship-application-tracker", "Keep every scholarship application moving."],
  ["/features/personal-statement-workspace", "Build each statement from evidence—not from a blank page."],
  ["/features/document-organiser", "Keep every document connected to the requirement it supports."],
  ["/features/reference-tracking", "Track reference requirements before they become urgent."],
  ["/features/submission-readiness", "Know what is ready, what is missing and what needs one final review."],
  ["/how-it-works", "From opportunity to final check, keep the whole application connected."],
  ["/for-students", "Built for serious applications at every stage."],
  ["/pricing", "Start organising your applications for free."],
  ["/security", "Clear account controls for personal application work."],
  ["/about", "Scholarship applications deserve a calmer working system."],
  ["/contact", "Contact EliteApply."],
  ["/resources", "Practical guidance for stronger, better-organised applications."],
  ["/privacy", "Privacy information"],
  ["/terms", "Terms information"],
  ["/accessibility", "Accessibility"],
  ["/scholarship-application-tracker", "Track scholarship applications from first shortlist to final decision."],
  ["/scholarship-application-organiser", "Organise every scholarship application without losing the details."],
  ["/scholarship-deadline-tracker", "Turn scholarship deadlines into a preparation plan."],
  ["/scholarship-application-checklist", "Build a scholarship application checklist around the real requirements."],
] as const;

const guideRoutes = [
  ["/resources/organise-multiple-scholarship-applications", "How to organise multiple scholarship applications"],
  ["/resources/scholarship-application-checklist", "Scholarship application checklist"],
  ["/resources/scholarship-deadline-planning", "Scholarship deadline planning guide"],
  ["/resources/plan-scholarship-personal-statement", "How to plan a scholarship personal statement"],
  ["/resources/connect-claims-to-evidence", "How to connect claims to evidence"],
  ["/resources/authentic-voice-ai-assistance", "How to preserve your authentic voice when using AI assistance"],
  ["/resources/request-scholarship-reference", "How to request a scholarship reference"],
  ["/resources/reference-request-email-template", "Scholarship reference request email template"],
  ["/resources/international-scholarship-document-checklist", "Document checklist for international scholarship applications"],
  ["/resources/translations-certified-documents", "How to manage translations and certified documents"],
] as const;

test("every Phase 2 public route renders unique meaningful content without runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  for (const [path, heading] of [...requiredRoutes, ...guideRoutes]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.locator("main#main-content")).not.toBeEmpty();
    await expect(page).toHaveTitle(/\| EliteApply$/);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description?.trim().length).toBeGreaterThanOrEqual(40);
  }

  expect(errors).toEqual([]);
});

test("high-intent routes target distinct search questions", async ({ page }) => {
  const titles = new Set<string>();
  const headings = new Set<string>();
  for (const [path] of requiredRoutes.filter(([path]) => path.startsWith("/scholarship-"))) {
    await page.goto(path);
    await expect(page).toHaveTitle(/\| EliteApply$/);
    titles.add(await page.title());
    headings.add(await page.getByRole("heading", { level: 1 }).innerText());
    await expect(page.getByRole("heading", { name: "Tracker, organiser, deadline tracker or checklist?" })).toBeVisible();
  }
  expect(titles.size).toBe(4);
  expect(headings.size).toBe(4);
});

test("homepage and guide links create contextual journeys", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Application tracker" }).last().click();
  await expect(page).toHaveURL(/\/features\/scholarship-application-tracker$/);
  await expect(page.getByRole("heading", { name: "Continue with practical guidance" })).toBeVisible();

  await page.getByRole("link", { name: "How to organise multiple scholarship applications" }).click();
  await expect(page).toHaveURL(/\/resources\/organise-multiple-scholarship-applications$/);
  await expect(page.getByText("Before you use this guide")).toBeVisible();
  await page.getByRole("link", { name: "Open the related EliteApply capability" }).click();
  await expect(page).toHaveURL(/\/scholarship-application-organiser$/);
});

test("resource hub contains four useful clusters and provider-first guidance", async ({ page }) => {
  await page.goto("/resources");
  for (const heading of ["Organisation", "Writing", "Evidence and references", "International applicants"]) {
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }
  await expect(page.getByText("always defer to the scholarship provider's current instructions")).toBeVisible();
  await expect(page.getByRole("link", { name: "How to preserve your authentic voice when using AI assistance" })).toBeVisible();
});

test("pricing and transparency routes avoid unsupported production claims", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByText("Paid plans are not currently available")).toBeVisible();
  await expect(page.getByText("Credit card today").locator(".." )).toContainText("Not required or requested");
  await expect(page.getByText(/£|\$\d|per month/i)).toHaveCount(0);

  await page.goto("/security");
  await expect(page.getByRole("heading", { name: "What still needs launch documentation" })).toBeVisible();
  await expect(page.getByText(/bank-level|SOC 2 certified|military-grade/i)).toHaveCount(0);

  await page.goto("/privacy");
  await expect(page.getByText("Approved jurisdiction-specific privacy policy copy is still required before production launch.")).toBeVisible();
});

test("mobile public navigation traps focus, closes on Escape and preserves the visible CTA", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/features");
  const button = page.getByRole("button", { name: "Open navigation" });
  await expect(button).toBeVisible();
  await expect(page.getByRole("link", { name: "Start free" }).last()).toBeVisible();
  await button.click();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveClass(/open/);
  await expect(page.locator("details.product-menu summary")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
});

test("representative Phase 2 routes reflow without horizontal page overflow", async ({ page }) => {
  const routes = ["/features/scholarship-application-tracker", "/resources", "/pricing", "/resources/request-scholarship-reference"];
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of routes) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const sizes = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      expect(sizes.scroll, `${path} overflowed at ${width}px`).toBeLessThanOrEqual(sizes.client + 1);
    }
  }
});
