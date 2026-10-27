import { describe, expect, it } from "vitest";
import { ValidationError } from "@/lib/errors/AppError";
import { DESCRIPTION_MAX_LENGTH } from "@/lib/constants";
import { normalizeDescription, sanitizeFilterInput } from "./sanitize";

describe("sanitizeFilterInput", () => {
  it("trims and strips characters that are not safe in a search", () => {
    expect(sanitizeFilterInput("  coffee (large) & milk  ")).toBe("coffee large  milk");
  });

  it("keeps letters, numbers, spaces and the allowed punctuation", () => {
    expect(sanitizeFilterInput("a-b_c 'd' @e.f, 1")).toBe("a-b_c 'd' @e.f, 1");
  });

  it("cuts the text to the max length (100 by default)", () => {
    expect(sanitizeFilterInput("a".repeat(150))).toHaveLength(100);
    expect(sanitizeFilterInput("abcdef", 3)).toBe("abc");
  });
});

describe("normalizeDescription", () => {
  it("keeps the text exactly as typed, apart from the outer spaces", () => {
    expect(normalizeDescription("  Café (big) - 50% off & more #1  ")).toBe("Café (big) - 50% off & more #1");
  });

  it("rejects anything that is not a string", () => {
    expect(() => normalizeDescription(undefined)).toThrow(ValidationError);
    expect(() => normalizeDescription(42)).toThrow("Description is required");
  });

  it("accepts the max length and rejects one more character", () => {
    expect(normalizeDescription("a".repeat(DESCRIPTION_MAX_LENGTH))).toHaveLength(DESCRIPTION_MAX_LENGTH);
    expect(() => normalizeDescription("a".repeat(DESCRIPTION_MAX_LENGTH + 1))).toThrow(
      `Description can be at most ${DESCRIPTION_MAX_LENGTH} characters long`
    );
  });
});
