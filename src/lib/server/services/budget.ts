import { CategoryType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { ValidationError, NotFoundError } from "@/lib/errors/AppError";
import { prisma } from "@/lib/prisma";
import { ensureUserRow } from "@/lib/server/utils/users";
import { getMonthDateRange } from "@/lib/utils/format";
import { dayjs } from "@/lib/utils/dayjs.js";
import { convertAmount, getRateTable, RatesUnavailableError, type RateTable } from "./exchange-rates";
import { calculateMonthlyTotals, type CategoryBreakdown } from "./dashboard";
import { resolveCurrency, getAvailableCurrencies } from "./settings";
import { accountCurrencies } from "@/lib/constants";

const toNumber = (value: Decimal | number): number => (typeof value === "number" ? value : value.toNumber());

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

const isYearMonth = (value: string) => YEAR_MONTH.test(value) && getMonthDateRange(value) !== null;

export type BudgetLine = {
  categoryId: string;
  name: string;
  color: string;
  expected: number | null;
  actual: number;
};

export type BudgetData = {
  currency: string;
  view: "currency" | "all";
  homeCurrency: string;
  availableCurrencies: string[];
  yearMonth: string;
  ratesAsOf: string | null;
  ratesError: string | null;
  hasPlan: boolean;
  canEdit: boolean;
  copyFromMonth: string | null;
  income: BudgetLine[];
  expenses: BudgetLine[];
  totals: {
    expectedIncome: number;
    actualIncome: number;
    expectedExpenses: number;
    actualExpenses: number;
    expectedNet: number;
    actualNet: number;
  };
};

export type CategoryBudgetStatus = {
  expected: number | null;
  actual: number;
};

type BudgetQuery = {
  yearMonth?: string;
  currency?: string;
  view?: "all";
};

const linesFrom = (
  categories: { id: string; name: string; color: string; type: CategoryType }[],
  type: CategoryType,
  expectedById: Map<string, number>,
  actuals: CategoryBreakdown[]
): BudgetLine[] => {
  const actualById = new Map(actuals.map((item) => [item.categoryId, item.amount]));
  return categories
    .filter((category) => category.type === type)
    .map((category) => ({
      categoryId: category.id,
      name: category.name,
      color: category.color,
      expected: expectedById.has(category.id) ? expectedById.get(category.id)! : null,
      actual: actualById.get(category.id) ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

const expectedMap = (
  entries: { categoryId: string; currency: string; expectedAmount: Decimal | number }[],
  convert: (amount: number, from: string) => number
) => {
  const byId = new Map<string, number>();
  entries.forEach((entry) => {
    const amount = convert(toNumber(entry.expectedAmount), entry.currency);
    if (amount <= 0) return;
    byId.set(entry.categoryId, (byId.get(entry.categoryId) ?? 0) + amount);
  });
  return byId;
};

const previousPlanMonth = async (userId: string, yearMonth: string, currency?: string) => {
  const rows = await prisma.budgetEntry.findMany({
    where: {
      userId,
      yearMonth: { lt: yearMonth },
      ...(currency ? { currency } : {}),
    },
    select: { yearMonth: true },
    orderBy: { yearMonth: "desc" },
    take: 1,
  });
  return rows[0]?.yearMonth ?? null;
};

export const getBudget = async (userId: string, query: BudgetQuery = {}): Promise<BudgetData> => {
  const yearMonth = query.yearMonth || dayjs().format("YYYY-MM");
  if (!isYearMonth(yearMonth)) {
    throw new ValidationError("Month must be YYYY-MM.");
  }

  const { currency: resolved, available } = await resolveCurrency(
    userId,
    query.view === "all" ? undefined : query.currency
  );
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const homeCurrency = available.includes(settings?.baseCurrency ?? "") ? settings!.baseCurrency : resolved;
  const canAll = available.length > 1;
  const wantAll = canAll && query.view === "all";

  let ratesError: string | null = null;
  let rates: RateTable | null = null;
  if (wantAll) {
    try {
      rates = await getRateTable(homeCurrency, available);
    } catch (error) {
      ratesError =
        error instanceof RatesUnavailableError
          ? error.message
          : "Couldn't load exchange rates. Showing your home currency instead.";
    }
  }

  const allView = Boolean(wantAll && rates);
  const currency = allView ? homeCurrency : wantAll ? homeCurrency : resolved;
  const mode = allView
    ? ({ kind: "all" as const, home: homeCurrency, rates: rates! })
    : ({ kind: "currency" as const, currency });

  const [categories, entries, [monthTotals], copyFromMonth] = await Promise.all([
    prisma.category.findMany({
      where: { userId },
      select: { id: true, name: true, color: true, type: true },
    }),
    prisma.budgetEntry.findMany({
      where: {
        userId,
        yearMonth,
        ...(allView ? {} : { currency }),
      },
      select: { categoryId: true, currency: true, expectedAmount: true },
    }),
    calculateMonthlyTotals(userId, [yearMonth], mode),
    previousPlanMonth(userId, yearMonth, allView ? undefined : currency),
  ]);

  const convert = (amount: number, from: string) =>
    allView ? convertAmount(amount, from, homeCurrency, rates!.rates, rates!.base) : amount;
  const expectedById = expectedMap(entries, convert);
  const income = linesFrom(categories, "income", expectedById, monthTotals.incomeBreakdown);
  const expenses = linesFrom(categories, "expense", expectedById, monthTotals.categoryBreakdown);
  const expectedIncome = income.reduce((sum, line) => sum + (line.expected ?? 0), 0);
  const expectedExpenses = expenses.reduce((sum, line) => sum + (line.expected ?? 0), 0);

  return {
    currency,
    view: allView ? "all" : "currency",
    homeCurrency,
    availableCurrencies: available,
    yearMonth,
    ratesAsOf: allView ? rates!.asOf : null,
    ratesError: allView ? null : ratesError,
    hasPlan: expectedById.size > 0,
    canEdit: !allView,
    copyFromMonth,
    income,
    expenses,
    totals: {
      expectedIncome,
      actualIncome: monthTotals.income,
      expectedExpenses,
      actualExpenses: monthTotals.expenses,
      expectedNet: expectedIncome - expectedExpenses,
      actualNet: monthTotals.net,
    },
  };
};

export const upsertExpected = async (
  userId: string,
  data: { yearMonth: string; currency: string; categoryId: string; expectedAmount: number | string }
) => {
  const { yearMonth, currency, categoryId } = data;
  const expectedAmount = typeof data.expectedAmount === "number" ? data.expectedAmount : Number(data.expectedAmount);

  if (!isYearMonth(yearMonth)) {
    throw new ValidationError("Month must be YYYY-MM.");
  }
  if (!accountCurrencies.includes(currency)) {
    throw new ValidationError("That currency is not supported.");
  }
  if (!Number.isFinite(expectedAmount) || expectedAmount < 0) {
    throw new ValidationError("Expected amount must be zero or more.");
  }

  await ensureUserRow(userId);

  const available = await getAvailableCurrencies(userId);
  if (!available.includes(currency)) {
    throw new ValidationError("You can only plan a currency you have an account in.");
  }

  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) {
    throw new NotFoundError("Category");
  }

  if (expectedAmount === 0) {
    await prisma.budgetEntry.deleteMany({
      where: { userId, yearMonth, currency, categoryId },
    });
    return getBudget(userId, { yearMonth, currency });
  }

  await prisma.budgetEntry.upsert({
    where: {
      userId_yearMonth_currency_categoryId: { userId, yearMonth, currency, categoryId },
    },
    create: { userId, yearMonth, currency, categoryId, expectedAmount },
    update: { expectedAmount },
  });

  return getBudget(userId, { yearMonth, currency });
};

export const copyPreviousMonth = async (
  userId: string,
  data: { yearMonth: string; currency?: string; view?: "all"; overwrite?: boolean }
) => {
  const yearMonth = data.yearMonth;
  if (!isYearMonth(yearMonth)) {
    throw new ValidationError("Month must be YYYY-MM.");
  }

  await ensureUserRow(userId);

  const available = await getAvailableCurrencies(userId);
  const allView = data.view === "all" && available.length > 1;
  const currencies = allView
    ? available
    : data.currency && available.includes(data.currency)
      ? [data.currency]
      : [(await resolveCurrency(userId, data.currency)).currency];

  const existing = await prisma.budgetEntry.count({
    where: { userId, yearMonth, currency: { in: currencies } },
  });
  if (existing > 0 && !data.overwrite) {
    throw new ValidationError("This month already has a plan. Confirm to replace it.");
  }

  const categoryIds = new Set(
    (await prisma.category.findMany({ where: { userId }, select: { id: true } })).map((category) => category.id)
  );

  const copies: { currency: string; rows: { categoryId: string; expectedAmount: Decimal | number }[] }[] = [];
  for (const currency of currencies) {
    const fromMonth = await previousPlanMonth(userId, yearMonth, currency);
    if (!fromMonth) continue;
    const rows = await prisma.budgetEntry.findMany({
      where: { userId, yearMonth: fromMonth, currency },
      select: { categoryId: true, expectedAmount: true },
    });
    copies.push({ currency, rows: rows.filter((row) => categoryIds.has(row.categoryId)) });
  }

  if (copies.every((copy) => copy.rows.length === 0)) {
    throw new ValidationError("There is no earlier month to copy from.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.budgetEntry.deleteMany({
      where: { userId, yearMonth, currency: { in: currencies } },
    });
    for (const copy of copies) {
      if (copy.rows.length === 0) continue;
      await tx.budgetEntry.createMany({
        data: copy.rows.map((row) => ({
          userId,
          yearMonth,
          currency: copy.currency,
          categoryId: row.categoryId,
          expectedAmount: row.expectedAmount,
        })),
      });
    }
  });

  return getBudget(userId, {
    yearMonth,
    currency: allView ? undefined : currencies[0],
    view: allView ? "all" : undefined,
  });
};

export const getCategoryStatus = async (
  userId: string,
  query: { categoryId: string; yearMonth: string; currency: string }
): Promise<CategoryBudgetStatus> => {
  const { categoryId, yearMonth, currency } = query;
  if (!isYearMonth(yearMonth)) {
    throw new ValidationError("Month must be YYYY-MM.");
  }

  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) {
    throw new NotFoundError("Category");
  }

  const [entry, [monthTotals]] = await Promise.all([
    prisma.budgetEntry.findUnique({
      where: {
        userId_yearMonth_currency_categoryId: { userId, yearMonth, currency, categoryId },
      },
      select: { expectedAmount: true },
    }),
    calculateMonthlyTotals(userId, [yearMonth], { kind: "currency", currency }),
  ]);

  const breakdown = category.type === "income" ? monthTotals.incomeBreakdown : monthTotals.categoryBreakdown;
  const actual = breakdown.find((item) => item.categoryId === categoryId)?.amount ?? 0;
  const expected = entry ? toNumber(entry.expectedAmount) : null;

  return { expected: expected !== null && expected > 0 ? expected : null, actual };
};
