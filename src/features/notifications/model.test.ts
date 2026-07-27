import { describe, expect, it } from "vitest";
import { categoryLabel, categoryTone, relativeTime } from "./model";

describe("notifications model", () => {
  it("labels known categories and falls back for unknown ones", () => {
    expect(categoryLabel("writing")).toBe("Writing Studio");
    expect(categoryLabel("mystery")).toBe("General");
  });

  it("gives every known category a badge tone", () => {
    expect(categoryTone("security")).toBe("red");
    expect(categoryTone("mystery")).toBe("grey");
  });

  it("formats relative time across unit boundaries", () => {
    const now = new Date("2026-07-27T12:00:00Z");
    expect(relativeTime("2026-07-27T11:59:40Z", now)).toBe("Just now");
    expect(relativeTime("2026-07-27T11:55:00Z", now)).toBe("5 minutes ago");
    expect(relativeTime("2026-07-27T09:00:00Z", now)).toBe("3 hours ago");
    expect(relativeTime("2026-07-25T12:00:00Z", now)).toBe("2 days ago");
  });
});
