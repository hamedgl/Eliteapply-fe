import { describe, expect, it } from "vitest";
import { getWorkspacePageGuide } from "./AppShell";

const routes = [
  ["/app/dashboard", "Dashboard"],
  ["/app/onboarding", "Dashboard"],
  ["/app/applications", "Applications"],
  ["/app/applications/import", "Import an opportunity"],
  ["/app/applications/app-1", "Application workspace"],
  ["/app/applications/app-1/tasks", "Application workspace"],
  ["/app/academic-profile", "Academic profile"],
  ["/app/documents", "Documents"],
  ["/app/documents/doc-1", "Document details"],
  ["/app/catalogue", "Academic catalogue"],
  ["/app/catalogue/scholarships/item-1", "Catalogue record"],
  ["/app/discovery", "Saved searches"],
  ["/app/writing", "Writing Studio"],
  ["/app/writing/new", "New writing document"],
  ["/app/writing/doc-1", "Writing document"],
  ["/app/stories", "Story Bank"],
  ["/app/references", "References"],
  ["/app/references/new", "New reference request"],
  ["/app/references/ref-1", "Reference details"],
  ["/app/interviews", "Interview practice"],
  ["/app/interviews/new", "New practice session"],
  ["/app/interviews/session-1", "Practice session"],
  ["/app/notifications", "Notifications"],
  ["/app/reminders", "Reminders"],
  ["/app/settings/profile", "Profile settings"],
  ["/app/settings/security", "Security settings"],
  ["/app/settings/privacy", "Privacy and data"],
  ["/app/settings/billing/success", "Billing and usage"],
] as const;

describe("workspace page guides", () => {
  it.each(routes)("matches %s to %s", (path, title) => {
    expect(getWorkspacePageGuide(path).title).toBe(title);
  });

  it("keeps every guide short and plain", () => {
    for (const [path] of routes) {
      const guide = getWorkspacePageGuide(path);
      const copy = [guide.intro, ...guide.tips].join(" ");
      expect(guide.tips).toHaveLength(2);
      expect(copy).not.toMatch(/[—–]/);
      expect(copy).not.toMatch(
        /\b(?:additionally|delve|elevate|seamless|showcase|tapestry|vibrant)\b/i,
      );
    }
  });
});
