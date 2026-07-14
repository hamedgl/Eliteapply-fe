import { expect, test } from "@playwright/test";

const user = {
  id: "00000000-0000-4000-8000-000000000001",
  identity_subject: "test",
  email: "hamed@example.test",
  full_name: "Hamed Golchin",
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

test("new academic profiles handle a null response and become versioned after save", async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  let storedProfile: Record<string, unknown> | null = null;
  let savedPayload: Record<string, unknown> | null = null;
  let versionRequests = 0;

  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.route("**/api/v1/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.endsWith("/auth/refresh")) {
      return route.fulfill({
        json: { access_token: "test", id_token: "test", expires_in: 3600 },
      });
    }
    if (url.endsWith("/users/me")) return route.fulfill({ json: user });
    if (url.endsWith("/platform/capabilities")) {
      return route.fulfill({ json: [] });
    }
    if (url.endsWith("/academic-profile/versions")) {
      versionRequests += 1;
      return route.fulfill({ json: [] });
    }
    if (url.endsWith("/academic-profile") && method === "GET") {
      return route.fulfill({ json: storedProfile });
    }
    if (url.endsWith("/academic-profile") && method === "PUT") {
      savedPayload = route.request().postDataJSON() as Record<string, unknown>;
      storedProfile = {
        id: "00000000-0000-4000-8000-000000000020",
        version: 1,
        created_at: "2026-07-13T12:00:00Z",
        updated_at: "2026-07-13T12:00:00Z",
        ...savedPayload,
        completion: { direction: true, academic_evidence: false },
      };
      return route.fulfill({ json: storedProfile });
    }
    return route.fulfill({ json: {} });
  });

  await page.goto("/app/academic-profile");
  await expect(
    page.getByRole("heading", { name: "Academic Profile", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Not saved yet")).toBeVisible();
  await expect(page.getByRole("button", { name: "Import profile" })).toHaveClass(
    /secondary-action/,
  );
  await expect(
    page.getByText("Your first version will appear here after you save."),
  ).toBeVisible();
  expect(versionRequests).toBe(0);
  expect(runtimeErrors).toEqual([]);
  await page.screenshot({
    path: "/tmp/eliteapply-academic-profile-new.png",
    fullPage: true,
  });

  await page.getByLabel("Applicant type").fill("International student");
  await page.getByLabel("Intended study level").fill("Postgraduate");
  await page.getByLabel("Target countries").fill("Portugal, United Kingdom");
  await page
    .getByLabel("education")
    .fill("BSc Computer Science, completed with distinction.");
  await page.getByRole("button", { name: "Save academic profile" }).click();

  await expect(page.getByText("Academic profile saved.")).toBeVisible();
  await expect(
    page.getByText("Version 1", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete profile" })).toHaveClass(
    /secondary-action danger/,
  );
  expect(savedPayload).toMatchObject({
    applicant_type: "International student",
    intended_study_level: "Postgraduate",
    target_countries: ["Portugal", "United Kingdom"],
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByLabel("Applicant type")).toHaveValue(
    "International student",
  );
  await expect(
    page.getByText("Version 1", { exact: true }).first(),
  ).toBeVisible();
  expect(runtimeErrors).toEqual([]);
  await page.screenshot({
    path: "/tmp/eliteapply-academic-profile-saved-mobile.png",
    fullPage: true,
  });
});
