import { describe, expect, it } from "vitest";
import { isThemePreference, resolvedTheme, themeBootScript } from "./theme";

describe("theme helpers", () => {
  it("accepts only light, dark and system", () => {
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("neon")).toBe(false);
  });

  it("resolves system from the OS", () => {
    expect(resolvedTheme("light", true)).toBe("light");
    expect(resolvedTheme("dark", false)).toBe("dark");
    expect(resolvedTheme("system", true)).toBe("dark");
    expect(resolvedTheme("system", false)).toBe("light");
  });

  it("emits a boot script that names the preference", () => {
    expect(themeBootScript("system")).toContain('"system"');
  });
});
