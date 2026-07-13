import { expect, test } from "@playwright/test";

function relativeLuminance(rgb: string) {
  const channels = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  return channels.reduce((sum, channel, index) => {
    const normalized = channel / 255;
    const linear =
      normalized <= 0.04045
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
}

function contrast(foreground: string, background: string) {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

test("landing page stays self-contained and semantically ordered", async ({
  page,
}) => {
  const apiRequests: string[] = [];
  await page.route("**/api/v1/**", async (route) => {
    apiRequests.push(route.request().url());
    await route.abort();
  });

  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Build stronger scholarship applications in one calm workspace.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", {
      name: "Interactive EliteApply sample workspace",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /EliteApply demonstration/i }),
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: "Today" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.locator(".workflow-window a")).toHaveCount(0);
  await expect(page.locator("h1 + h3")).toHaveCount(0);
  expect(apiRequests).toEqual([]);

  const heroType = await page.locator(".hero h1").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      size: Number.parseFloat(style.fontSize),
      tracking:
        Number.parseFloat(style.letterSpacing) /
        Number.parseFloat(style.fontSize),
    };
  });
  expect(heroType.size).toBeLessThanOrEqual(88);
  expect(heroType.tracking).toBeGreaterThanOrEqual(-0.0351);

  const contrastRatio = await page
    .locator(".demo-canvas small")
    .first()
    .evaluate((element) => ({
      foreground: getComputedStyle(element).color,
      background: getComputedStyle(element.closest(".workflow-window")!)
        .backgroundColor,
    }));
  expect(
    contrast(contrastRatio.foreground, contrastRatio.background),
  ).toBeGreaterThanOrEqual(4.5);
});

test("hero sample workspace supports keyboard and sample-data navigation", async ({
  page,
}) => {
  await page.goto("/");

  const demo = page.getByRole("region", {
    name: "Interactive EliteApply sample workspace",
  });
  const today = demo.getByRole("tab", { name: "Today" });
  const applications = demo.getByRole("tab", { name: "Applications" });
  const documents = demo.getByRole("tab", { name: "Documents" });

  await today.focus();
  await page.keyboard.press("ArrowRight");
  await expect(applications).toHaveAttribute("aria-selected", "true");
  await expect(applications).toBeFocused();
  await expect(demo.getByText("Three active applications")).toBeVisible();

  await demo
    .locator(".demo-application-table")
    .getByRole("button", { name: /Rhodes Scholarship/i })
    .click();
  await expect(demo.getByText("Connect research evidence")).toBeVisible();

  await documents.click();
  await demo.getByRole("button", { name: /Academic CV/i }).click();
  await expect(demo.getByText("Ready to use")).toBeVisible();

  await today.click();
  await demo
    .locator(".demo-application-rail")
    .getByRole("button", { name: /Excellence Scholarship/i })
    .click();
  await expect(demo.getByText("Confirm programme requirements")).toBeVisible();

  await demo
    .getByRole("button", { name: /Open supporting documents/i })
    .click();
  await expect(documents).toHaveAttribute("aria-selected", "true");
});

test("landing page exposes descriptive search and sharing metadata", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle(
    "EliteApply | Scholarship Application Workspace",
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /scholarship applications, deadlines, evidence, documents, and references/i,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://eliteapply.net/",
  );
  const structuredData = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  expect(structuredData).toContain("WebApplication");
});

test("guided tour auto-advances through distinct workflows", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#how-it-works").scrollIntoViewIfNeeded();

  const thirdStep = page.getByRole("button", {
    name: /Shape your application/i,
  });
  const fourthStep = page.getByRole("button", {
    name: /Submit with clarity/i,
  });
  await expect(thirdStep).toHaveAttribute("aria-pressed", "true");
  await expect(fourthStep).toHaveAttribute("aria-pressed", "true", {
    timeout: 6000,
  });

  const firstStep = page.getByRole("button", { name: /Find your focus/i });
  await firstStep.click();
  await expect(firstStep).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("img", {
      name: /Find your focus: Programme Shortlist/i,
    }),
  ).toBeVisible();
  await expect(page.locator("#workflow-preview")).toContainText(
    "Rhodes Scholarship",
  );
  await expect(page.locator(".discovery-demo")).toBeVisible();
  await expect(page.locator(".discovery-demo .gauge-value")).toHaveAttribute(
    "stroke-dasharray",
    "94 6",
  );

  await page.getByRole("button", { name: /Build your evidence/i }).click();
  await expect(page.locator(".evidence-demo")).toContainText(
    "Community research partnership",
  );

  await thirdStep.click();
  await expect(page.locator(".writing-demo")).toContainText("Add one outcome");

  await fourthStep.click();
  await expect(page.locator(".submission-demo")).toContainText(
    "Open final review",
  );
  await expect(page.locator(".submission-demo .gauge-value")).toHaveAttribute(
    "stroke-dasharray",
    "92 8",
  );
  await expect(
    page.getByRole("button", { name: "Pause product tour" }),
  ).toBeVisible();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByText("Manual tour", { exact: true })).toBeVisible();
  await expect(page.locator("#workflow-preview")).not.toHaveClass(
    /demo-animated/,
  );
});

test("mobile navigation is touch-safe and restores focus on Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuButton = page.getByRole("button", { name: "Open navigation" });
  await menuButton.click();
  await expect(page.getByRole("link", { name: "How it works" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeFocused();

  const undersized = await page
    .locator(".marketing a:visible, .marketing button:visible")
    .evaluateAll((elements) =>
      elements
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            text: element.textContent?.trim(),
            width: rect.width,
            height: rect.height,
          };
        })
        .filter(({ width, height }) => width < 44 || height < 44),
    );
  expect(undersized).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
});

test("footer accessibility link reaches a real statement", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Accessibility" }).click();
  await expect(page).toHaveURL(/\/accessibility$/);
  await expect(
    page.getByRole("heading", { name: "Accessibility" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "support@eliteapply.net" }),
  ).toBeVisible();
});

test("primary CTA crosses into the authenticated runtime", async ({ page }) => {
  await page.route("**/api/v1/**", async (route) => {
    if (route.request().url().endsWith("/platform/capabilities")) {
      return route.fulfill({ json: [] });
    }
    return route.fulfill({ status: 401, json: { detail: "Signed out" } });
  });

  await page.goto("/");
  await page
    .getByRole("link", { name: "Start your workspace" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(
    page.getByRole("heading", { name: "Create your EliteApply account" }),
  ).toBeVisible();
});
