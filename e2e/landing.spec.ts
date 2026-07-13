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
      name: "Plan, write and submit stronger scholarship applications.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", {
      name: /interactive eliteapply sample workspace/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "The structure behind a stronger application process.",
    }),
  ).toBeAttached();
  await expect(
    page.getByRole("heading", {
      name: "Questions students ask before starting.",
    }),
  ).toBeAttached();
  await expect(page.locator(".workflow-window a")).toHaveCount(0);
  await expect(page.locator("h1 + h3")).toHaveCount(0);
  await expect(
    page.getByText(/guaranteed scholarship|acceptance rate|students served/i),
  ).toHaveCount(0);
  expect(apiRequests).toEqual([]);

  const heroType = await page
    .locator(".phase-one-hero h1")
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        size: Number.parseFloat(style.fontSize),
        tracking:
          Number.parseFloat(style.letterSpacing) /
          Number.parseFloat(style.fontSize),
      };
    });
  expect(heroType.size).toBeLessThanOrEqual(96);
  expect(heroType.tracking).toBeGreaterThanOrEqual(-0.0401);

  const contrastRatio = await page
    .locator(".phase-one-hero-copy > p")
    .nth(1)
    .evaluate((element) => ({
      foreground: getComputedStyle(element).color,
      background: getComputedStyle(element.closest(".phase-one-hero")!)
        .backgroundColor,
    }));
  expect(
    contrast(contrastRatio.foreground, contrastRatio.background),
  ).toBeGreaterThanOrEqual(4.5);
});

test("hero product proof communicates the three required moments", async ({
  page,
}) => {
  await page.goto("/");

  const demo = page.getByRole("region", {
    name: /interactive eliteapply sample workspace/i,
  });
  await expect(demo.getByText("Next responsible action")).toBeVisible();
  await expect(demo.getByText("Connect leadership evidence")).toBeVisible();
  await expect(demo.getByText("Application readiness")).toBeVisible();
  await expect(demo.getByText("72%", { exact: true })).toBeVisible();
  await expect(demo.getByText("Next deadline")).toBeVisible();
  await expect(demo.getByText("18 days")).toBeVisible();
  await expect(demo.getByText("3 items need attention")).toBeVisible();
});

test("hero sample workspace supports switching, completing and resetting tasks", async ({
  page,
}) => {
  await page.goto("/");

  const demo = page.getByRole("region", {
    name: /interactive eliteapply sample workspace/i,
  });
  await demo
    .getByRole("button", { name: /connect leadership evidence/i })
    .click();
  const leadershipTask = demo.getByRole("checkbox", {
    name: /connect leadership evidence/i,
  });
  await expect(leadershipTask).not.toBeChecked();
  await leadershipTask.check();
  await expect(demo.getByText("80%", { exact: true })).toBeVisible();
  await expect(demo.getByText("2 items need attention")).toBeVisible();
  await expect(demo.getByText("10 requirements covered")).toBeVisible();

  await demo
    .getByRole("combobox", { name: "Sample application" })
    .selectOption("knight-hennessy");
  await expect(demo.locator(":scope > header strong")).toHaveText(
    "Knight-Hennessy Scholars",
  );
  await expect(
    demo.getByText("Strengthen the personal statement"),
  ).toBeVisible();
  await expect(demo.getByText("61%", { exact: true })).toBeVisible();

  await demo
    .getByRole("combobox", { name: "Sample application" })
    .selectOption("rhodes");
  await expect(demo.getByText("80%", { exact: true })).toBeVisible();
  await demo.getByRole("button", { name: "Reset" }).click();
  await expect(demo.getByText("72%", { exact: true })).toBeVisible();
  await expect(demo.getByText("3 items need attention")).toBeVisible();
});

test("phase one includes product, trust, comparison and FAQ content", async ({
  page,
}) => {
  await page.goto("/");

  for (const heading of [
    "See every application, deadline and next action in one place.",
    "Build each statement from evidence—not from a blank page.",
    "Keep transcripts, certificates and supporting evidence connected to the right application.",
    "Track reference requirements before they become last-minute emergencies.",
    "Know what is ready, what is missing and what deserves one final review.",
    "Built for serious applications at every stage.",
    "Why not use a spreadsheet or a general notes app?",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toBeAttached();
  }

  await expect(
    page.getByRole("table", { name: /Comparison of EliteApply/i }),
  ).toContainText("Task manager");
  const guarantee = page.getByText(
    "Does EliteApply guarantee a scholarship?",
    { exact: true },
  );
  await guarantee.click();
  await expect(
    page.getByText(/Scholarship decisions remain entirely with the provider/i),
  ).toBeVisible();
  await expect(
    page.getByText(/Paid plans are not currently available/i),
  ).toBeAttached();
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

test("landing page renders without browser console or runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await page.locator("#faq").scrollIntoViewIfNeeded();
  await page.getByText("Can I track multiple applications?", { exact: true }).click();
  await expect(
    page.getByText(/Each application can keep its own deadline/i),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("guided tour auto-advances and every stage remains selectable", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#how-it-works").scrollIntoViewIfNeeded();

  const firstStep = page.getByRole("button", { name: /Add the opportunity/i });
  const secondStep = page.getByRole("button", {
    name: /Break down the requirements/i,
  });
  const thirdStep = page.getByRole("button", {
    name: /Prepare the application/i,
  });
  const fourthStep = page.getByRole("button", {
    name: /Review and submit/i,
  });
  await expect(firstStep).toHaveAttribute("aria-pressed", "true");
  await expect(secondStep).toHaveAttribute("aria-pressed", "true", {
    timeout: 6000,
  });

  await firstStep.click();
  await expect(firstStep).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("img", {
      name: /Add the opportunity: Opportunity details/i,
    }),
  ).toBeVisible();
  await expect(page.locator(".discovery-demo")).toContainText(
    "Rhodes Scholarship",
  );

  await secondStep.click();
  await expect(page.locator(".evidence-demo")).toContainText(
    "Community research partnership",
  );

  await thirdStep.click();
  await expect(page.locator(".writing-demo")).toContainText("Add one outcome");

  await fourthStep.click();
  await expect(page.locator(".submission-demo")).toContainText(
    "Open final review",
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

test("mobile navigation traps focus, closes on Escape and stays touch-safe", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuButton = page.getByRole("button", { name: "Open navigation" });
  await menuButton.click();
  const productMenu = page
    .getByRole("navigation", { name: "Main navigation" })
    .locator("summary");
  await expect(productMenu).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Close navigation" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(productMenu).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeFocused();

  const undersized = await page
    .locator(
      ".marketing a:visible, .marketing button:visible, .marketing summary:visible",
    )
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

test("marketing layout reflows without page overflow at supported widths", async ({
  page,
}) => {
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Plan, write and submit stronger scholarship applications.",
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  }
});

test("footer accessibility link reaches a real statement", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Accessibility" }).last().click();
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
  await page.getByRole("link", { name: "Start free" }).first().click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(
    page.getByRole("heading", { name: "Create your EliteApply account" }),
  ).toBeVisible();
});
