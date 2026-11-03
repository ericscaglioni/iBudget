import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaMock } from "@/test/mock-prisma";
import { NotFoundError, ValidationError } from "@/lib/errors/AppError";

vi.mock("@/lib/prisma", async () => {
  const { createPrismaMock } = await import("@/test/mock-prisma");
  return { prisma: createPrismaMock() };
});

vi.mock("@/lib/server/utils/users", () => ({ ensureUserRow: vi.fn() }));

const calculateMonthlyTotals = vi.fn();
vi.mock("./dashboard", () => ({
  calculateMonthlyTotals: (...args: unknown[]) => calculateMonthlyTotals(...args),
}));

const getRateTable = vi.fn();
vi.mock("./exchange-rates", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./exchange-rates")>();
  return { ...actual, getRateTable: (...args: unknown[]) => getRateTable(...args) };
});

import { prisma } from "@/lib/prisma";
import * as budget from "./budget";

const db = prisma as unknown as PrismaMock;
const decimal = (value: number) => ({ toNumber: () => value });

const salary = { id: "salary", name: "Salary", color: "#0f0", type: "income" as const };
const food = { id: "food", name: "Food", color: "#f00", type: "expense" as const };

const emptyMonth = {
  month: "2026-11",
  income: 0,
  expenses: 0,
  incomeFromExchange: 0,
  expensesFromExchange: 0,
  net: 0,
  categoryBreakdown: [] as { categoryId: string; categoryName: string; amount: number; color: string }[],
  incomeBreakdown: [] as { categoryId: string; categoryName: string; amount: number; color: string }[],
  expectedIncome: null,
  expectedExpenses: null,
  expectedByCategory: {},
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 1, 12));
  calculateMonthlyTotals.mockReset();
  calculateMonthlyTotals.mockResolvedValue([{ ...emptyMonth, month: "2026-11" }]);
  getRateTable.mockReset();
  db.account.findMany.mockResolvedValue([{ currency: "USD" }, { currency: "EUR" }]);
  db.userSettings.findUnique.mockResolvedValue({ userId: "u1", baseCurrency: "USD" });
  db.category.findMany.mockResolvedValue([salary, food]);
  db.budgetEntry.findMany.mockResolvedValue([]);
  db.budgetEntry.count.mockResolvedValue(0);
  db.budgetEntry.findUnique.mockResolvedValue(null);
  db.budgetEntry.deleteMany.mockResolvedValue({ count: 0 });
  db.budgetEntry.upsert.mockResolvedValue({});
  db.budgetEntry.createMany.mockResolvedValue({ count: 0 });
  db.category.findFirst.mockResolvedValue(food);
});

describe("getBudget", () => {
  it("lists every category with empty expected when there is no plan", async () => {
    const result = await budget.getBudget("u1", { yearMonth: "2026-11", currency: "USD" });

    expect(result.canEdit).toBe(true);
    expect(result.hasPlan).toBe(false);
    expect(result.income).toEqual([
      { categoryId: "salary", name: "Salary", color: "#0f0", expected: null, actual: 0 },
    ]);
    expect(result.expenses).toEqual([
      { categoryId: "food", name: "Food", color: "#f00", expected: null, actual: 0 },
    ]);
  });

  it("pairs expected with actuals", async () => {
    db.budgetEntry.findMany.mockResolvedValue([
      { categoryId: "food", currency: "USD", expectedAmount: decimal(200) },
    ]);
    calculateMonthlyTotals.mockResolvedValue([
      {
        ...emptyMonth,
        expenses: 80,
        categoryBreakdown: [{ categoryId: "food", categoryName: "Food", amount: 80, color: "#f00" }],
      },
    ]);

    const result = await budget.getBudget("u1", { yearMonth: "2026-11", currency: "USD" });

    expect(result.hasPlan).toBe(true);
    expect(result.expenses[0]).toMatchObject({ expected: 200, actual: 80 });
    expect(result.totals).toMatchObject({ expectedExpenses: 200, actualExpenses: 80 });
  });

  it("converts expected amounts on All", async () => {
    getRateTable.mockResolvedValue({
      base: "USD",
      asOf: "2026-11-01",
      rates: { USD: 1, EUR: 0.5 },
    });
    db.budgetEntry.findMany.mockImplementation(async (args: { where: { currency?: string } }) => {
      if (args.where.currency) return [];
      return [{ categoryId: "food", currency: "EUR", expectedAmount: decimal(100) }];
    });

    const result = await budget.getBudget("u1", { yearMonth: "2026-11", view: "all" });

    expect(result.view).toBe("all");
    expect(result.canEdit).toBe(false);
    expect(result.expenses[0].expected).toBe(200);
  });

  it("refuses a month that is not YYYY-MM", async () => {
    await expect(budget.getBudget("u1", { yearMonth: "November" })).rejects.toThrow(ValidationError);
  });
});

describe("upsertExpected", () => {
  it("saves a positive expected amount", async () => {
    await budget.upsertExpected("u1", {
      yearMonth: "2026-11",
      currency: "USD",
      categoryId: "food",
      expectedAmount: 150,
    });
    expect(db.budgetEntry.upsert).toHaveBeenCalled();
  });

  it("deletes the plan line when expected is zero", async () => {
    await budget.upsertExpected("u1", {
      yearMonth: "2026-11",
      currency: "USD",
      categoryId: "food",
      expectedAmount: 0,
    });
    expect(db.budgetEntry.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1", yearMonth: "2026-11", currency: "USD", categoryId: "food" },
    });
    expect(db.budgetEntry.upsert).not.toHaveBeenCalled();
  });

  it("refuses a currency the user does not hold", async () => {
    db.account.findMany.mockResolvedValue([{ currency: "USD" }]);
    await expect(
      budget.upsertExpected("u1", {
        yearMonth: "2026-11",
        currency: "EUR",
        categoryId: "food",
        expectedAmount: 10,
      })
    ).rejects.toThrow("currency you have an account in");
  });

  it("refuses a category that is not the user's", async () => {
    db.category.findFirst.mockResolvedValue(null);
    await expect(
      budget.upsertExpected("u1", {
        yearMonth: "2026-11",
        currency: "USD",
        categoryId: "nope",
        expectedAmount: 10,
      })
    ).rejects.toThrow(NotFoundError);
  });
});

describe("copyPreviousMonth", () => {
  const planFromOctober = () => {
    db.budgetEntry.findMany.mockImplementation(async (args: { where?: { yearMonth?: unknown } }) => {
      const yearMonth = args.where?.yearMonth;
      if (yearMonth && typeof yearMonth === "object" && yearMonth !== null && "lt" in yearMonth) {
        return [{ yearMonth: "2026-10" }];
      }
      if (yearMonth === "2026-10") return [{ categoryId: "food", expectedAmount: decimal(90) }];
      return [];
    });
  };

  it("copies the latest earlier plan", async () => {
    planFromOctober();
    await budget.copyPreviousMonth("u1", { yearMonth: "2026-11", currency: "USD" });

    expect(db.budgetEntry.deleteMany).toHaveBeenCalled();
    expect(db.budgetEntry.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: "u1",
          yearMonth: "2026-11",
          currency: "USD",
          categoryId: "food",
        }),
      ],
    });
  });

  it("asks for confirm when the month already has a plan", async () => {
    db.budgetEntry.count.mockResolvedValue(2);
    await expect(budget.copyPreviousMonth("u1", { yearMonth: "2026-11", currency: "USD" })).rejects.toThrow(
      "already has a plan"
    );
  });

  it("replaces an existing plan when overwrite is set", async () => {
    db.budgetEntry.count.mockResolvedValue(2);
    planFromOctober();
    await expect(
      budget.copyPreviousMonth("u1", { yearMonth: "2026-11", currency: "USD", overwrite: true })
    ).resolves.toBeTruthy();
  });

  it("explains when there is nothing to copy", async () => {
    await expect(budget.copyPreviousMonth("u1", { yearMonth: "2026-11", currency: "USD" })).rejects.toThrow(
      "no earlier month"
    );
  });
});

describe("getCategoryStatus", () => {
  it("returns remaining pieces for the form hint", async () => {
    db.budgetEntry.findUnique.mockResolvedValue({ expectedAmount: decimal(200) });
    calculateMonthlyTotals.mockResolvedValue([
      {
        ...emptyMonth,
        categoryBreakdown: [{ categoryId: "food", categoryName: "Food", amount: 40, color: "#f00" }],
      },
    ]);
    await expect(
      budget.getCategoryStatus("u1", { categoryId: "food", yearMonth: "2026-11", currency: "USD" })
    ).resolves.toEqual({ expected: 200, actual: 40 });
  });

  it("treats a missing plan as no expected", async () => {
    await expect(
      budget.getCategoryStatus("u1", { categoryId: "food", yearMonth: "2026-11", currency: "USD" })
    ).resolves.toEqual({ expected: null, actual: 0 });
  });
});
