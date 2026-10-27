import { describe, expect, it } from "vitest";
import { CategoryFormSchema } from "./schema";

describe("CategoryFormSchema", () => {
  const valid = { name: "Food", color: "#10B981", type: "expense" };

  it("accepts a valid category", () => {
    expect(CategoryFormSchema.safeParse(valid).success).toBe(true);
    expect(CategoryFormSchema.safeParse({ ...valid, type: "income" }).success).toBe(true);
  });

  it("needs a name and a color", () => {
    expect(CategoryFormSchema.safeParse({ ...valid, name: "" }).error?.issues[0].message).toBe("Category name is required");
    expect(CategoryFormSchema.safeParse({ ...valid, color: "" }).error?.issues[0].message).toBe("Color is required");
  });

  it("only allows income or expense", () => {
    expect(CategoryFormSchema.safeParse({ ...valid, type: "transfer" }).success).toBe(false);
  });
});
