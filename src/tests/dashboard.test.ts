import { describe, expect, it } from "vitest";
import { safeDashboard } from "../lib/api/platform";

describe("dashboard adapter", () => {
  it("guards open ended data", () => {
    expect(
      safeDashboard({
        profile_completion_percent: 500,
        upcoming_deadlines: [
          null,
          { title: "Legacy shape without due_at" },
          {
            application_id: "app-1",
            application_title: "Oxford MSc",
            due_at: "2026-11-01T00:00:00Z",
            kind: "requirement_due",
          },
        ],
      }),
    ).toMatchObject({
      profile_completion_percent: 100,
      upcoming_deadlines: [
        {
          application_id: "app-1",
          application_title: "Oxford MSc",
          kind: "requirement_due",
        },
      ],
      missing_documents: 0,
    });
  });

  it("falls back to open_tasks and the flat percent when the new fields are absent", () => {
    expect(safeDashboard({ open_tasks: 4, profile_completion_percent: 62 })).toMatchObject({
      tasks: { total: 0, open: 4, completed: 0, overdue: 0 },
      profile_completion: { percent: 62, sections: [] },
    });
  });

  it("keeps the served task counts and completion sections", () => {
    expect(
      safeDashboard({
        open_tasks: 3,
        tasks: { total: 12, open: 3, completed: 9, overdue: 1 },
        profile_completion_percent: 75,
        profile_completion: {
          percent: 75,
          sections: [
            { key: "education", label: "Education", complete: true, weight: 25 },
            "not an object",
          ],
        },
      }),
    ).toMatchObject({
      tasks: { total: 12, completed: 9, overdue: 1 },
      profile_completion: {
        percent: 75,
        sections: [{ key: "education", weight: 25 }],
      },
    });
  });
});
