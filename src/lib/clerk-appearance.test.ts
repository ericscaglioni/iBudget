import { describe, expect, it } from "vitest";
import { clerkAppearance } from "./clerk-appearance";

describe("clerkAppearance", () => {
  it("uses Forest CSS variables so the SignIn card follows light and dark", () => {
    expect(clerkAppearance.variables?.colorBackground).toBe("rgb(var(--surface))");
    expect(clerkAppearance.variables?.colorText).toBe("rgb(var(--ink))");
    expect(clerkAppearance.variables?.colorPrimary).toBe("rgb(var(--brand))");
  });
});
