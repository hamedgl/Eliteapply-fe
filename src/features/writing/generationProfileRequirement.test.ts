import { describe, expect, it } from "vitest";
import { ApiError, normalizeApiError } from "../../lib/api/errors";
import {
  academicProfileFieldLabel,
  academicProfileRequirement,
} from "./generationProfileRequirement";

describe("academicProfileRequirement", () => {
  it("reads the generation precondition contract and friendly field labels", async () => {
    const error = await normalizeApiError(
      Response.json(
        {
          detail: "Complete your education details before generating.",
          code: "academic_profile_incomplete",
          details: {
            required_action: "complete_academic_profile",
            missing_fields: ["institution", "field_of_study"],
          },
        },
        { status: 422 },
      ),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(academicProfileRequirement(error)).toEqual({
      detail: "Complete your education details before generating.",
      missingFields: ["institution", "field_of_study"],
    });
    expect(academicProfileFieldLabel("institution")).toBe("Institution");
    expect(academicProfileFieldLabel("field_of_study")).toBe("Field of study");
  });

  it("leaves unrelated validation errors on their existing path", async () => {
    const error = await normalizeApiError(
      Response.json(
        {
          detail: [
            {
              loc: ["body", "instruction"],
              msg: "Instruction is required",
              type: "missing",
            },
          ],
        },
        { status: 422 },
      ),
    );

    expect(academicProfileRequirement(error)).toBeNull();
    expect(error).toMatchObject({
      code: "VALIDATION_ERROR",
      fields: [
        {
          field: "instruction",
          message: "Instruction is required",
          type: "missing",
        },
      ],
    });
  });
});
