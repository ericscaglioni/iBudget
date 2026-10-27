import { describe, expect, it } from "vitest";
import { DESCRIPTION_MAX_LENGTH } from "@/lib/constants";
import { TransactionFormSchema, createTransactionFormSchema } from "./schema";

const accounts = [
  { value: "usd1", currency: "USD" },
  { value: "usd2", currency: "USD" },
  { value: "brl1", currency: "BRL" },
  { value: "nocurrency" },
];
const categories = [{ id: "food" }, { id: "salary" }];
const schema = createTransactionFormSchema(accounts, categories);

const expense = {
  type: "expense",
  amount: "10",
  date: "2026-10-20",
  description: "Lunch",
  accountId: "usd1",
  categoryId: "food",
};
const transfer = {
  type: "transfer",
  amount: "100",
  date: "2026-10-20",
  description: "Move money",
  fromAccountId: "usd1",
  toAccountId: "usd2",
};

const messages = (data: unknown) => {
  const result = schema.safeParse(data);
  return result.success ? [] : result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
};

describe("createTransactionFormSchema: common fields", () => {
  it("accepts a valid expense and a valid income", () => {
    expect(messages(expense)).toEqual([]);
    expect(messages({ ...expense, type: "income", categoryId: "salary" })).toEqual([]);
  });

  it("needs an amount, a date and a description of 3+ characters", () => {
    expect(messages({ ...expense, amount: "" })).toContain("amount: Amount is required");
    expect(messages({ ...expense, date: "" })).toContain("date: Date is required");
    expect(messages({ ...expense, description: "ab" })).toContain("description: Description has to be at least 3 characters long");
  });

  it("limits the description to what the database column holds", () => {
    expect(messages({ ...expense, description: "a".repeat(DESCRIPTION_MAX_LENGTH) })).toEqual([]);
    expect(messages({ ...expense, description: "a".repeat(DESCRIPTION_MAX_LENGTH + 1) })).toContain(
      `description: Description can be at most ${DESCRIPTION_MAX_LENGTH} characters long`
    );
  });

  it("rejects an unknown type", () => {
    expect(schema.safeParse({ ...expense, type: "gift" }).success).toBe(false);
  });
});

describe("createTransactionFormSchema: expenses and incomes", () => {
  it("needs an account and a category", () => {
    expect(messages({ ...expense, accountId: undefined })).toContain("accountId: Account is required");
    expect(messages({ ...expense, categoryId: undefined })).toContain("categoryId: Category is required");
  });

  it("needs them to be among the available options", () => {
    expect(messages({ ...expense, accountId: "elsewhere" })).toContain("accountId: Please select a valid account");
    expect(messages({ ...expense, categoryId: "elsewhere" })).toContain("categoryId: Please select a valid category");
  });
});

describe("createTransactionFormSchema: transfers", () => {
  it("accepts a transfer between accounts in the same currency", () => {
    expect(messages(transfer)).toEqual([]);
  });

  it("needs both accounts, and valid ones", () => {
    expect(messages({ ...transfer, fromAccountId: undefined })).toContain("fromAccountId: From account is required");
    expect(messages({ ...transfer, toAccountId: undefined })).toContain("toAccountId: To account is required");
    expect(messages({ ...transfer, fromAccountId: "elsewhere" })).toContain("fromAccountId: Please select a valid from account");
    expect(messages({ ...transfer, toAccountId: "elsewhere" })).toContain("toAccountId: Please select a valid to account");
  });

  it("does not allow the same account on both sides", () => {
    expect(messages({ ...transfer, toAccountId: "usd1" })).toContain("toAccountId: Cannot transfer to the same account");
  });

  it("needs the amount received when the currencies differ", () => {
    const crossCurrency = { ...transfer, toAccountId: "brl1" };
    expect(messages(crossCurrency)).toContain("toAmount: Enter the amount received in BRL");
    expect(messages({ ...crossCurrency, toAmount: "0" })).toContain("toAmount: Enter the amount received in BRL");
    expect(messages({ ...crossCurrency, toAmount: "abc" })).toContain("toAmount: Enter the amount received in BRL");
    expect(messages({ ...crossCurrency, toAmount: "520" })).toEqual([]);
  });

  it("does not ask for it when a currency is unknown", () => {
    expect(messages({ ...transfer, toAccountId: "nocurrency" })).toEqual([]);
  });
});

describe("createTransactionFormSchema: recurring transactions", () => {
  it("needs a frequency", () => {
    expect(messages({ ...expense, isRecurring: true })).toContain("frequency: Frequency is required for recurring transactions");
    expect(messages({ ...expense, isRecurring: true, frequency: "monthly" })).toEqual([]);
    expect(messages({ ...expense, isRecurring: false })).toEqual([]);
  });

  it("needs the end date to be after the transaction date", () => {
    const recurring = { ...expense, isRecurring: true, frequency: "weekly" };
    expect(messages({ ...recurring, endsAt: "2026-10-20" })).toContain("endsAt: End date must be after transaction date");
    expect(messages({ ...recurring, endsAt: "2026-10-19" })).toContain("endsAt: End date must be after transaction date");
    expect(messages({ ...recurring, endsAt: "2027-01-01" })).toEqual([]);
  });
});

describe("TransactionFormSchema (no options)", () => {
  it("cannot match any account or category", () => {
    expect(TransactionFormSchema.safeParse(expense).success).toBe(false);
  });
});
