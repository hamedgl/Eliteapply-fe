import { expect, test, type Page } from "@playwright/test";

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

const INTERVIEW_ID = "00000000-0000-4000-8000-000000000020";
const QUESTIONS = [
  { category: "motivation", question: "What motivated you to pursue a doctoral degree?" },
  { category: "fit", question: "Why this department in particular?" },
];

const turn = (index: number) => ({
  id: `00000000-0000-4000-8000-00000000010${index}`,
  question_index: index,
  question: QUESTIONS[index].question,
  answer: `My recorded answer for question ${index + 1}.`,
  scoring: { clarity: 80, specificity: 50, evidence: 30 },
  feedback: {
    strong_points: ["Clear opening statement"],
    improvements: ["Add a specific example"],
    structure: "Lead with the motivation, then the evidence.",
    example_upgrade: "During my BSc I ran a study on X, which led me to…",
    disclaimer: "Practice feedback does not predict an admissions outcome.",
  },
  contradiction_warnings: [
    { type: "unsupported", claim: "2019", reason: "not_found_in_submitted_context" },
  ],
  created_at: "2026-07-14T09:10:00Z",
});

const interview = () => ({
  id: INTERVIEW_ID,
  application_id: "00000000-0000-4000-8000-000000000030",
  interview_type: "graduate",
  mode: "chat",
  context_snapshot: {},
  questions: QUESTIONS,
  status: "in_progress",
  current_question_index: 1,
  current_question: QUESTIONS[1],
  context_version_hash: "safe-hash",
  report: null,
  prompt_version: "v1",
  disclaimer:
    "Practice feedback does not predict or guarantee an admissions, scholarship, fellowship, or visa outcome.",
  created_at: "2026-07-14T09:00:00Z",
  completed_at: null,
  cancelled_at: null,
});

const report = {
  interview_id: INTERVIEW_ID,
  overall_score: 62,
  rubric_explanation: "Average of per-question category scores; not an admissions probability.",
  category_scores: { clarity: 80, specificity: 50, evidence: 55 },
  strengths: ["clarity"],
  improvement_areas: ["specificity"],
  weak_claims: [{ type: "unsupported", claim: "2019", reason: "not_found_in_submitted_context" }],
  contradictions: [],
  question_summary: [],
  suggested_practice_actions: ["Practice this improvement: specificity"],
  transcript_availability: "available",
  prompt_version: "v1",
  rubric_version: "academic-interview-rubric.v2",
  disclaimer:
    "Practice feedback does not predict or guarantee an admissions, scholarship, fellowship, or visa outcome.",
  completed_at: "2026-07-14T09:30:00Z",
};

type Fixture = {
  session: Record<string, unknown>;
  turns: unknown[];
  onAnswer?: (body: Record<string, unknown>) => void;
  onCreate?: (body: Record<string, unknown>) => void;
};

async function stubApi(page: Page, fixture: Fixture) {
  await page.route("**/api/v1/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.endsWith("/auth/refresh"))
      return route.fulfill({
        json: { access_token: "test", id_token: "test", expires_in: 3600 },
      });
    if (url.endsWith("/users/me")) return route.fulfill({ json: user });
    if (url.endsWith("/platform/capabilities")) return route.fulfill({ json: [] });
    if (new URL(url).pathname.endsWith("/applications"))
      return route.fulfill({
        json: {
          items: [
            {
              id: "00000000-0000-4000-8000-000000000030",
              title: "PhD application",
              institution_name: "University of Lisbon",
            },
          ],
          next_cursor: null,
          has_more: false,
        },
      });
    if (url.endsWith(`/academic-interviews/${INTERVIEW_ID}/turns`))
      return route.fulfill({ json: fixture.turns });
    if (url.endsWith(`/academic-interviews/${INTERVIEW_ID}/report.pdf`))
      return route.fulfill({
        body: Buffer.from("%PDF-1.7 stub"),
        contentType: "application/pdf",
        headers: {
          "content-disposition": `attachment; filename="interview-practice-report-${INTERVIEW_ID}.pdf"`,
        },
      });
    if (url.endsWith(`/academic-interviews/${INTERVIEW_ID}/report`))
      return route.fulfill({ json: report });
    if (url.endsWith(`/academic-interviews/${INTERVIEW_ID}/complete`) && method === "POST") {
      fixture.session = {
        ...fixture.session,
        status: "completed",
        current_question: null,
        completed_at: "2026-07-14T09:30:00Z",
      };
      return route.fulfill({ json: fixture.session });
    }
    if (url.endsWith(`/academic-interviews/${INTERVIEW_ID}/answers`) && method === "POST") {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      fixture.onAnswer?.(body);
      const index = fixture.turns.length;
      fixture.turns = [...fixture.turns, { ...turn(index), answer: String(body.answer) }];
      fixture.session = {
        ...fixture.session,
        status: "completed",
        current_question: null,
        current_question_index: index + 1,
        completed_at: "2026-07-14T09:30:00Z",
      };
      return route.fulfill({ json: fixture.turns[index] });
    }
    if (url.endsWith(`/academic-interviews/${INTERVIEW_ID}`))
      return route.fulfill({ json: fixture.session });
    if (new URL(url).pathname.endsWith("/academic-interviews")) {
      if (method === "POST") {
        fixture.onCreate?.(route.request().postDataJSON() as Record<string, unknown>);
        return route.fulfill({ json: fixture.session });
      }
      return route.fulfill({ json: { items: [fixture.session], next_cursor: null, has_more: false } });
    }
    return route.fulfill({ json: {} });
  });
}

test("a session with every question answered offers the report instead of a phantom question", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  // The exact stranded state that shipped: still in_progress, index past the last question.
  const fixture: Fixture = {
    session: {
      ...interview(),
      status: "in_progress",
      current_question_index: QUESTIONS.length,
      current_question: null,
    },
    turns: [turn(0), turn(1)],
  };
  await stubApi(page, fixture);

  await page.goto(`/app/interviews/${INTERVIEW_ID}`);
  await expect(page.getByRole("heading", { name: /graduate practice/i })).toBeVisible();

  // No invented prompt, no answer box, no "Question 3 of 2".
  await expect(page.getByText("Continue when you are ready.")).toHaveCount(0);
  await expect(page.getByLabel("Your answer")).toHaveCount(0);
  await expect(page.getByText(`Question ${QUESTIONS.length + 1} of`)).toHaveCount(0);

  await expect(
    page.getByRole("heading", { name: "You’ve answered every question" }),
  ).toBeVisible();
  await expect(page.getByText("2 of 2 questions answered")).toHaveCount(0);
  await expect(page.getByText("All questions answered. Generate the report to finish.")).toBeVisible();

  await page.screenshot({
    path: "/tmp/eliteapply-interview-awaiting-completion.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Finish and see report" }).click();
  await expect(page.getByRole("heading", { name: "Practice report" })).toBeVisible();
  await expect(page.getByText("62")).toBeVisible();

  await page.screenshot({
    path: "/tmp/eliteapply-interview-report.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("answering the last question rolls straight into the report", async ({ page }) => {
  const sent: Record<string, unknown>[] = [];
  const fixture: Fixture = {
    session: interview(),
    turns: [turn(0)],
    onAnswer: (body) => sent.push(body),
  };
  await stubApi(page, fixture);

  await page.goto(`/app/interviews/${INTERVIEW_ID}`);
  await expect(page.getByText("Why this department in particular?")).toBeVisible();
  await expect(page.getByText("Question 2 of 2")).toBeVisible();

  // Earlier turns render as a transcript with collapsible feedback.
  await expect(page.getByText("My recorded answer for question 1.")).toBeVisible();
  await page.getByRole("group").filter({ hasText: "Coach feedback" }).first().click();
  await expect(page.getByText("Lead with the motivation, then the evidence.")).toBeVisible();

  const answer = page.getByLabel("Your answer");
  await answer.fill("Because the department runs the exact lab I want to join.");
  await page.getByRole("button", { name: "Submit answer" }).click();

  await expect(page.getByRole("heading", { name: "Practice report" })).toBeVisible();
  expect(sent).toHaveLength(1);
  expect(sent[0].answer).toBe("Because the department runs the exact lab I want to join.");
});

test("history and the new-session form render the session set-up", async ({ page }) => {
  await stubApi(page, { session: interview(), turns: [turn(0)] });

  await page.goto("/app/interviews");
  await expect(page.getByRole("heading", { name: "Interview practice", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Graduate", level: 2 })).toBeVisible();
  await expect(page.getByText("1 of 2 questions answered")).toBeVisible();
  await page.screenshot({ path: "/tmp/eliteapply-interview-history.png", fullPage: true });

  await page.getByRole("link", { name: "New session" }).click();
  await expect(page).toHaveURL(/\/app\/interviews\/new$/);
  await expect(page.getByRole("group", { name: "Interview type" })).toBeVisible();
  // Radio cards, so the selected option is announced rather than implied by colour.
  await expect(page.getByRole("radio", { name: /Graduate/ })).toBeChecked();
  await page.getByRole("radio", { name: /PhD supervisor/ }).check();
  await expect(page.getByRole("radio", { name: /PhD supervisor/ })).toBeChecked();
  await page.screenshot({ path: "/tmp/eliteapply-interview-new.png", fullPage: true });
});

test("the session length is chosen up front and sent with the request", async ({ page }) => {
  const created: Record<string, unknown>[] = [];
  await stubApi(page, {
    session: interview(),
    turns: [],
    onCreate: (body) => created.push(body),
  });

  await page.goto("/app/interviews/new");
  const lengths = page.getByRole("radiogroup", { name: "How many questions?" });
  await expect(lengths.getByRole("radio", { name: "4" })).toBeChecked();
  await expect(page.getByText("Roughly 12–20 minutes.")).toBeVisible();

  await lengths.getByRole("radio", { name: "7" }).check();
  await expect(page.getByText("Roughly 21–35 minutes.")).toBeVisible();
  await page.screenshot({ path: "/tmp/eliteapply-interview-length.png", fullPage: true });

  await page.getByRole("button", { name: "Start session" }).click();
  expect(created).toHaveLength(1);
  expect(created[0].question_count).toBe(7);
});

test("the finished report can be exported as a PDF", async ({ page }) => {
  await stubApi(page, {
    session: {
      ...interview(),
      status: "completed",
      current_question: null,
      current_question_index: QUESTIONS.length,
    },
    turns: [turn(0), turn(1)],
  });

  await page.goto(`/app/interviews/${INTERVIEW_ID}`);
  await expect(page.getByRole("heading", { name: "Practice report" })).toBeVisible();

  await page.screenshot({ path: "/tmp/eliteapply-interview-export.png", fullPage: true });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF" }).click();
  expect((await download).suggestedFilename()).toBe(
    `interview-practice-report-${INTERVIEW_ID}.pdf`,
  );
});

test("a custom session requires a scenario description and sends it to the API", async ({
  page,
}) => {
  const created: Record<string, unknown>[] = [];
  await stubApi(page, {
    session: interview(),
    turns: [],
    onCreate: (body) => created.push(body),
  });

  await page.goto("/app/interviews/new");
  const start = page.getByRole("button", { name: "Start session" });
  await expect(start).toBeEnabled();

  // The box only exists for the custom type; the others carry their own brief.
  await expect(page.getByLabel("Describe the interview")).toHaveCount(0);
  await page.getByRole("radio", { name: /Custom/ }).check();

  const box = page.getByLabel("Describe the interview");
  await expect(box).toBeVisible();
  await expect(start).toBeDisabled();

  await box.fill("  A 20-minute teaching assistantship panel with two faculty members.  ");
  await expect(start).toBeEnabled();
  await page.screenshot({ path: "/tmp/eliteapply-interview-custom.png", fullPage: true });
  await start.click();

  expect(created).toHaveLength(1);
  expect(created[0].interview_type).toBe("custom");
  expect(created[0].custom_focus).toBe(
    "A 20-minute teaching assistantship panel with two faculty members.",
  );

  // Switching back to a preset type drops the field from the payload entirely.
  await page.goto("/app/interviews/new");
  await page.getByRole("radio", { name: /PhD supervisor/ }).check();
  await page.getByRole("button", { name: "Start session" }).click();
  expect(created).toHaveLength(2);
  expect(created[1]).not.toHaveProperty("custom_focus");
});

test("a custom session shows the scenario the candidate described", async ({ page }) => {
  const brief = "A 20-minute teaching assistantship panel with two faculty members.";
  await stubApi(page, {
    session: {
      ...interview(),
      interview_type: "custom",
      context_snapshot: { custom_focus: brief },
    },
    turns: [],
  });
  await page.goto(`/app/interviews/${INTERVIEW_ID}`);
  await expect(page.getByRole("heading", { name: "Your scenario" })).toBeVisible();
  await expect(page.getByText(brief)).toBeVisible();
});

test("the session view stacks on mobile without horizontal overflow", async ({ page }) => {
  await stubApi(page, { session: interview(), turns: [turn(0)] });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/app/interviews/${INTERVIEW_ID}`);
  await expect(page.getByLabel("Your answer")).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  await page.screenshot({
    path: "/tmp/eliteapply-interview-mobile.png",
    fullPage: true,
  });
});
