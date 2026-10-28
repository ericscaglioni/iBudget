import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaMock } from "@/test/mock-prisma";

vi.mock("@/lib/prisma", async () => {
  const { createPrismaMock } = await import("@/test/mock-prisma");
  return { prisma: createPrismaMock() };
});

import { prisma } from "@/lib/prisma";
import * as dashboard from "./dashboard";

const db = prisma as unknown as PrismaMock;
const decimal = (value: number) => ({ toNumber: () => value });

type Account = { id: string; name: string; currency: string; initialBalance: unknown; sortOrder?: number | null };
type BalanceTx = { accountId: string; type: "income" | "expense"; amount: unknown; date: Date };
type MonthlyTx = {
  type: "income" | "expense";
  amount: unknown;
  date: Date;
  transferId: string | null;
  currency: string;
  category?: { id: string; name: string; color: string } | null;
};

const food = { id: "food", name: "Food", color: "#f00" };
const salary = { id: "salary", name: "Salary", color: "#0f0" };
const transferCategory = { id: "transfer", name: "Transfer", color: "#999" };

const monthlyTx = (overrides: Partial<MonthlyTx> = {}): MonthlyTx => ({
  type: "expense",
  amount: decimal(10),
  date: new Date(2026, 9, 10, 12),
  transferId: null,
  currency: "USD",
  category: food,
  ...overrides,
});

/** Sets up what the database "contains": the dashboard asks for accounts and transactions in a few shapes. */
const givenData = ({
  accounts = [] as Account[],
  balanceTx = [] as BalanceTx[],
  monthly = [] as MonthlyTx[],
  baseCurrency = undefined as string | undefined,
  latest = undefined as Date | undefined,
} = {}) => {
  db.account.findMany.mockImplementation(async (args: { select: Record<string, boolean> }) =>
    args.select.id ? accounts : accounts.map(({ currency }) => ({ currency }))
  );
  db.userSettings.findUnique.mockResolvedValue(baseCurrency ? { userId: "u1", baseCurrency } : null);
  db.transaction.findMany.mockImplementation(async (args: { select: Record<string, unknown> }) =>
    args.select.accountId
      ? balanceTx
      : monthly.map(({ currency, ...tx }) => ({ ...tx, account: { currency } }))
  );
  db.transaction.findFirst.mockResolvedValue(latest ? { date: latest } : null);
};

const usd = (id: string, name: string, initialBalance: number, extra: Partial<Account> = {}): Account => ({
  id,
  name,
  currency: "USD",
  initialBalance: decimal(initialBalance),
  sortOrder: null, // what the database gives for an account that was never ordered
  ...extra,
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 27, 12)); // 27 Oct 2026
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getMonthlySummary", () => {
  it("adds up income and expenses of the month, in the chosen currency", async () => {
    givenData({
      accounts: [usd("a1", "Main", 0)],
      monthly: [
        monthlyTx({ type: "income", amount: decimal(1000), category: salary }),
        monthlyTx({ amount: decimal(30) }),
        monthlyTx({ amount: decimal(20) }),
      ],
    });

    const result = await dashboard.getMonthlySummary("u1", "2026-10", "USD");

    expect(result).toMatchObject({ currency: "USD", income: 1000, expenses: 50, net: 950, incomeFromExchange: 0, expensesFromExchange: 0 });
  });

  it("defaults to the current month", async () => {
    givenData({ accounts: [usd("a1", "Main", 0)], monthly: [monthlyTx()] });
    const result = await dashboard.getMonthlySummary("u1");
    expect(result.expenses).toBe(10);
  });

  it("groups spending by category, biggest first", async () => {
    const rent = { id: "rent", name: "Rent", color: "#00f" };
    givenData({
      accounts: [usd("a1", "Main", 0)],
      monthly: [
        monthlyTx({ amount: decimal(10) }),
        monthlyTx({ amount: decimal(500), category: rent }),
        monthlyTx({ amount: decimal(15) }),
      ],
    });

    const { categoryBreakdown } = await dashboard.getMonthlySummary("u1", "2026-10", "USD");

    expect(categoryBreakdown).toEqual([
      { categoryId: "rent", categoryName: "Rent", amount: 500, color: "#00f" },
      { categoryId: "food", categoryName: "Food", amount: 25, color: "#f00" },
    ]);
  });

  it("counts an expense without a category, but leaves it out of the category chart", async () => {
    givenData({ accounts: [usd("a1", "Main", 0)], monthly: [monthlyTx({ category: null })] });
    const result = await dashboard.getMonthlySummary("u1", "2026-10", "USD");
    expect(result.expenses).toBe(10);
    expect(result.categoryBreakdown).toEqual([]);
  });

  it("ignores a transfer between two accounts of the same currency", async () => {
    givenData({
      accounts: [usd("a1", "Main", 0), usd("a2", "Savings", 0)],
      monthly: [
        monthlyTx({ amount: decimal(300), transferId: "tr1", category: transferCategory }),
        monthlyTx({ type: "income", amount: decimal(300), transferId: "tr1", category: transferCategory }),
      ],
    });

    const result = await dashboard.getMonthlySummary("u1", "2026-10", "USD");

    expect(result).toMatchObject({ income: 0, expenses: 0, incomeFromExchange: 0, expensesFromExchange: 0 });
  });

  describe("currency exchanges (a transfer between currencies)", () => {
    const exchange = [
      monthlyTx({ amount: decimal(100), transferId: "tr1", category: transferCategory, currency: "USD" }),
      monthlyTx({ type: "income", amount: decimal(520), transferId: "tr1", category: transferCategory, currency: "BRL" }),
    ];
    const accounts = [usd("a1", "Main", 0), { id: "a2", name: "Brazil", currency: "BRL", initialBalance: decimal(0) }];

    it("counts the money sent as an expense in the source currency", async () => {
      givenData({ accounts, monthly: exchange });
      const result = await dashboard.getMonthlySummary("u1", "2026-10", "USD");
      expect(result).toMatchObject({ income: 0, expenses: 100, expensesFromExchange: 100, incomeFromExchange: 0 });
    });

    it("counts the money received as income in the destination currency", async () => {
      givenData({ accounts, monthly: exchange });
      const result = await dashboard.getMonthlySummary("u1", "2026-10", "BRL");
      expect(result).toMatchObject({ income: 520, expenses: 0, incomeFromExchange: 520, expensesFromExchange: 0 });
    });

    it("keeps the exchange out of the category chart", async () => {
      givenData({ accounts, monthly: exchange });
      const result = await dashboard.getMonthlySummary("u1", "2026-10", "USD");
      expect(result.categoryBreakdown).toEqual([]);
    });
  });

  it("ignores transactions that fall outside the month asked for", async () => {
    givenData({ accounts: [usd("a1", "Main", 0)], monthly: [monthlyTx({ date: new Date(2026, 8, 30, 12) })] });
    const result = await dashboard.getMonthlySummary("u1", "2026-10", "USD");
    expect(result.expenses).toBe(0);
  });

  it("asks the database for the user's own data in the right date range", async () => {
    givenData({ accounts: [usd("a1", "Main", 0)] });
    await dashboard.getMonthlySummary("u1", "2026-10", "USD");

    const { where } = db.transaction.findMany.mock.calls[0][0];
    expect(where.userId).toBe("u1");
    expect(where.date.gte.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(where.date.lte.toISOString()).toBe("2026-10-31T23:59:59.999Z");
    expect(where.OR[0]).toEqual({ transferId: null, account: { currency: "USD" } });
  });
});

describe("getAccountBalances", () => {
  it("adds income and takes away expenses (transfers included) from the initial balance", async () => {
    givenData({
      accounts: [usd("a1", "Main", 100), usd("a2", "Savings", 0)],
      balanceTx: [
        { accountId: "a1", type: "income", amount: decimal(50), date: new Date(2026, 9, 1) },
        { accountId: "a1", type: "expense", amount: decimal(30), date: new Date(2026, 9, 2) },
        { accountId: "a2", type: "income", amount: 5, date: new Date(2026, 9, 2) },
      ],
    });

    const result = await dashboard.getAccountBalances("u1");

    expect(result.accountBalances.map((a) => [a.accountId, a.balance])).toEqual([["a1", 120], ["a2", 5]]);
    expect(result.totalBalanceByCurrency).toEqual({ USD: 125 });
  });

  it("totals each currency separately", async () => {
    givenData({
      accounts: [usd("a1", "Main", 10), { id: "a2", name: "Euro", currency: "EUR", initialBalance: decimal(7) }],
    });
    const result = await dashboard.getAccountBalances("u1");
    expect(result.totalBalanceByCurrency).toEqual({ USD: 10, EUR: 7 });
  });

  it("does not query transactions when there are no accounts", async () => {
    givenData();
    const result = await dashboard.getAccountBalances("u1");
    expect(result.accountBalances).toEqual([]);
    expect(db.transaction.findMany).not.toHaveBeenCalled();
  });

  it("ignores transactions that belong to an account we did not ask about", async () => {
    givenData({
      accounts: [usd("a1", "Main", 10)],
      balanceTx: [{ accountId: "other", type: "income", amount: decimal(99), date: new Date(2026, 9, 1) }],
    });
    const result = await dashboard.getAccountBalances("u1");
    expect(result.accountBalances[0].balance).toBe(10);
  });
});

describe("getAccountOverview", () => {
  it("returns the shown currency's accounts and six months of income and expenses", async () => {
    givenData({
      accounts: [usd("a1", "Main", 10), { id: "a2", name: "Euro", currency: "EUR", initialBalance: decimal(7) }],
      monthly: [monthlyTx({ amount: decimal(40) }), monthlyTx({ type: "income", amount: decimal(90), date: new Date(2026, 7, 5, 12) })],
    });

    const result = await dashboard.getAccountOverview("u1", "USD");

    expect(result.currency).toBe("USD");
    expect(result.accountBalances.map((a) => a.accountId)).toEqual(["a1"]);
    expect(result.sixMonthSummary.map((m) => m.month)).toEqual(["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]);
    expect(result.sixMonthSummary[5]).toEqual({ month: "2026-10", income: 0, expenses: 40 });
    expect(result.sixMonthSummary[3]).toEqual({ month: "2026-08", income: 90, expenses: 0 });
  });
});

describe("getDashboardData", () => {
  const accounts = [
    usd("a1", "Banco", 1000),
    usd("a2", "Cash", 200),
    { id: "a3", name: "Euro", currency: "EUR", initialBalance: decimal(50), sortOrder: null },
  ];

  it("shows one currency: its accounts, total and the totals of the other currencies for the switcher", async () => {
    givenData({ accounts });

    const result = await dashboard.getDashboardData("u1", { currency: "USD" });

    expect(result.currency).toBe("USD");
    expect(result.availableCurrencies).toEqual(["USD", "EUR"]);
    expect(result.accountBalances.map((a) => a.accountId)).toEqual(["a1", "a2"]);
    expect(result.totalBalance).toBe(1200);
    expect(result.currencyBalances).toEqual([
      { currency: "USD", balance: 1200 },
      { currency: "EUR", balance: 50 },
    ]);
  });

  it("falls back to the user's default currency when none is asked for", async () => {
    givenData({ accounts, baseCurrency: "EUR" });
    const result = await dashboard.getDashboardData("u1");
    expect(result.currency).toBe("EUR");
    expect(result.totalBalance).toBe(50);
  });

  it("puts accounts in the order the user chose, the rest by name after them", async () => {
    givenData({
      accounts: [
        usd("a1", "Zeta", 0),
        usd("a2", "Alpha", 0),
        usd("a3", "Second", 0, { sortOrder: 1 }),
        usd("a4", "First", 0, { sortOrder: 0 }),
      ],
    });
    const result = await dashboard.getDashboardData("u1", { currency: "USD" });
    expect(result.accountBalances.map((a) => a.name)).toEqual(["First", "Second", "Alpha", "Zeta"]);
  });

  it("compares the balance with where it was at the end of last month", async () => {
    givenData({
      accounts: [usd("a1", "Main", 100)],
      balanceTx: [
        { accountId: "a1", type: "income", amount: decimal(100), date: new Date(2026, 8, 15) }, // last month
        { accountId: "a1", type: "expense", amount: decimal(50), date: new Date(2026, 9, 5) }, // this month
      ],
    });

    const { netWorth } = await dashboard.getDashboardData("u1", { currency: "USD" });

    expect(netWorth).toEqual({ total: 150, previousMonthTotal: 200, change: -50, changePercent: -25 });
  });

  it("has no percentage change when last month's balance was zero", async () => {
    givenData({
      accounts: [usd("a1", "Main", 0)],
      balanceTx: [{ accountId: "a1", type: "income", amount: decimal(80), date: new Date(2026, 9, 5) }],
    });
    const { netWorth } = await dashboard.getDashboardData("u1", { currency: "USD" });
    expect(netWorth).toMatchObject({ total: 80, previousMonthTotal: 0, change: 80, changePercent: null });
  });

  it("returns the last 6 months, and the current and previous month totals", async () => {
    givenData({ accounts: [usd("a1", "Main", 0)] });
    const result = await dashboard.getDashboardData("u1", { currency: "USD" });
    expect(result.sixMonthHistory.map((m) => m.month)).toEqual(["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]);
    expect(result.monthlyTotals).toHaveLength(6);
  });

  it("can leave out the current or the previous month", async () => {
    givenData({ accounts: [usd("a1", "Main", 0)] });

    const noCurrent = await dashboard.getDashboardData("u1", { currency: "USD", includeCurrentMonth: false });
    expect(noCurrent.monthlyTotals.map((m) => m.month)).not.toContain("2026-10");

    const noPrevious = await dashboard.getDashboardData("u1", { currency: "USD", includePreviousMonth: false });
    expect(noPrevious.monthlyTotals.map((m) => m.month)).not.toContain("2026-09");
  });

  it("returns only the month asked for, even an old one outside the 6-month history", async () => {
    givenData({ accounts: [usd("a1", "Main", 0)], monthly: [monthlyTx({ date: new Date(2025, 11, 10, 12), amount: decimal(70) })] });

    const result = await dashboard.getDashboardData("u1", { currency: "USD", month: "2025-12" });

    expect(result.monthlyTotals).toHaveLength(1);
    expect(result.monthlyTotals[0]).toMatchObject({ month: "2025-12", expenses: 70 });
    expect(result.sixMonthHistory.map((m) => m.month)).not.toContain("2025-12");
  });

  it("copes with a user without any account", async () => {
    givenData();
    const result = await dashboard.getDashboardData("u1");
    expect(result).toMatchObject({ currency: "USD", availableCurrencies: [], accountBalances: [], totalBalance: 0 });
  });

  it("lets the monthly summary reach a later month that already has a transaction", async () => {
    givenData({
      accounts: [usd("a1", "Main", 0)],
      monthly: [monthlyTx({ date: new Date("2026-12-01T00:00:00.000Z"), amount: decimal(40) })],
      latest: new Date("2026-12-01T00:00:00.000Z"),
    });

    const result = await dashboard.getDashboardData("u1", { currency: "USD" });

    expect(result.monthlyTotals.map((m) => m.month)).toEqual([
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
      "2026-12",
    ]);
    expect(result.monthlyTotals[7]).toMatchObject({ month: "2026-12", expenses: 40 });
    expect(result.sixMonthHistory.map((m) => m.month)).toEqual([
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
      "2026-12",
    ]);
  });
});
