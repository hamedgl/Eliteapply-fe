import { describe, expect, it } from "vitest";
import { passwordMeetsRequirements } from "../features/auth/passwordRules";

describe("password requirements", () => {
  it("requires length, case, number and symbol", () => {
    expect(passwordMeetsRequirements("Valid123!")).toBe(true);
    expect(passwordMeetsRequirements("valid123")).toBe(false);
  });
});
