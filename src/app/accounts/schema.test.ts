import { describe, expect, it } from "vitest";
import { AccountFormSchema } from "./schema";

const valid = { name: "Savings", type: "savings", currency: "USD", initialBalance: "100.50" };

describe("AccountFormSchema", () => {
  it("accepts a valid account", () => {
    expect(AccountFormSchema.safeParse(valid).success).toBe(true);
  });

  it("needs a name", () => {
    const result = AccountFormSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Name is required");
  });

  it("only accepts the known account types and currencies", () => {
    expect(AccountFormSchema.safeParse({ ...valid, type: "piggy bank" }).success).toBe(false);
    expect(AccountFormSchema.safeParse({ ...valid, currency: "XXX" }).success).toBe(false);
    expect(AccountFormSchema.safeParse({ ...valid, currency: "BRL" }).success).toBe(true);
  });

  it("needs the initial balance to be a number", () => {
    const result = AccountFormSchema.safeParse({ ...valid, initialBalance: "lots" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Initial balance must be a number");
    expect(AccountFormSchema.safeParse({ ...valid, initialBalance: "-20" }).success).toBe(true);
  });
});
