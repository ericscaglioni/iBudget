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

export type ExchangeLine = {
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
  /** Null on All — FX expected is per-currency and would double-count salary. */
  exchangeIn: ExchangeLine | null;
  exchangeOut: ExchangeLine | null;
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

export type ExchangeDirection = "in" | "out";

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

const plannedAmount = (value: Decimal | number | null | undefined) => {
  if (value == null) return null;
  const amount = toNumber(value);
  return amount > 0 ? amount : null;
};

const previousPlanMonth = async (userId: string, yearMonth: string, currency?: string) => {
  const where = {
    userId,
    yearMonth: { lt: yearMonth },
    ...(currency ? { currency } : {}),
  };
  const [fromEntries, fromFx] = await Promise.all([
    prisma.budgetEntry.findFirst({
      where,
      select: { yearMonth: true },
      orderBy: { yearMonth: "desc" },
    }),
    prisma.budgetExchange.findFirst({
      where,
      select: { yearMonth: true },
      orderBy: { yearMonth: "desc" },
    }),
  ]);
  const months = [fromEntries?.yearMonth, fromFx?.yearMonth].filter((month): month is string => Boolean(month));
  if (months.length === 0) return null;
  return months.sort()[months.length - 1];
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
  const canExchange = available.length > 1;
  const currency = allView ? homeCurrency : wantAll ? homeCurrency : resolved;
  const mode = allView
    ? ({ kind: "all" as const, home: homeCurrency, rates: rates! })
    : ({ kind: "currency" as const, currency });

  const [categories, entries, exchange, [monthTotals], copyFromMonth] = await Promise.all([
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
    allView || !canExchange
      ? Promise.resolve(null)
      : prisma.budgetExchange.findUnique({
          where: { userId_yearMonth_currency: { userId, yearMonth, currency } },
          select: { expectedIn: true, expectedOut: true },
        }),
    calculateMonthlyTotals(userId, [yearMonth], mode),
    previousPlanMonth(userId, yearMonth, allView ? undefined : currency),
  ]);

  const convert = (amount: number, from: string) =>
    allView ? convertAmount(amount, from, homeCurrency, rates!.rates, rates!.base) : amount;
  const expectedById = expectedMap(entries, convert);
  const income = linesFrom(categories, "income", expectedById, monthTotals.incomeBreakdown);
  const expenses = linesFrom(categories, "expense", expectedById, monthTotals.categoryBreakdown);
  const exchangeIn =
    allView || !canExchange
      ? null
      : {
          expected: plannedAmount(exchange?.expectedIn),
          actual: monthTotals.incomeFromExchange,
        };
  const exchangeOut =
    allView || !canExchange
      ? null
      : {
          expected: plannedAmount(exchange?.expectedOut),
          actual: monthTotals.expensesFromExchange,
        };
  const expectedIncome =
    income.reduce((sum, line) => sum + (line.expected ?? 0), 0) + (exchangeIn?.expected ?? 0);
  const expectedExpenses =
    expenses.reduce((sum, line) => sum + (line.expected ?? 0), 0) + (exchangeOut?.expected ?? 0);

  return {
    currency,
    view: allView ? "all" : "currency",
    homeCurrency,
    availableCurrencies: available,
    yearMonth,
    ratesAsOf: allView ? rates!.asOf : null,
    ratesError: allView ? null : ratesError,
    hasPlan: expectedById.size > 0 || exchangeIn?.expected != null || exchangeOut?.expected != null,
    canEdit: !allView,
    copyFromMonth,
    income,
    expenses,
    exchangeIn,
    exchangeOut,
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

export const upsertExchangeExpected = async (
  userId: string,
  data: {
    yearMonth: string;
    currency: string;
    direction: ExchangeDirection;
    expectedAmount: number | string;
  }
) => {
  const { yearMonth, currency, direction } = data;
  const expectedAmount = typeof data.expectedAmount === "number" ? data.expectedAmount : Number(data.expectedAmount);

  if (!isYearMonth(yearMonth)) {
    throw new ValidationError("Month must be YYYY-MM.");
  }
  if (direction !== "in" && direction !== "out") {
    throw new ValidationError("Direction must be in or out.");
  }
  if (!accountCurrencies.includes(currency)) {
    throw new ValidationError("That currency is not supported.");
  }
  if (!Number.isFinite(expectedAmount) || expectedAmount < 0) {
    throw new ValidationError("Expected amount must be zero or more.");
  }

  await ensureUserRow(userId);

  const available = await getAvailableCurrencies(userId);
  if (available.length < 2) {
    throw new ValidationError("From and to other currencies are only available when you have accounts in more than one currency.");
  }
  if (!available.includes(currency)) {
    throw new ValidationError("You can only plan a currency you have an account in.");
  }

  const existing = await prisma.budgetExchange.findUnique({
    where: { userId_yearMonth_currency: { userId, yearMonth, currency } },
    select: { expectedIn: true, expectedOut: true },
  });
  const nextIn = direction === "in" ? expectedAmount : toNumber(existing?.expectedIn ?? 0);
  const nextOut = direction === "out" ? expectedAmount : toNumber(existing?.expectedOut ?? 0);

  if (nextIn <= 0 && nextOut <= 0) {
    await prisma.budgetExchange.deleteMany({ where: { userId, yearMonth, currency } });
    return getBudget(userId, { yearMonth, currency });
  }

  await prisma.budgetExchange.upsert({
    where: { userId_yearMonth_currency: { userId, yearMonth, currency } },
    create: { userId, yearMonth, currency, expectedIn: nextIn, expectedOut: nextOut },
    update: { expectedIn: nextIn, expectedOut: nextOut },
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
  const canExchange = available.length > 1;
  const allView = data.view === "all" && canExchange;
  const currencies = allView
    ? available
    : data.currency && available.includes(data.currency)
      ? [data.currency]
      : [(await resolveCurrency(userId, data.currency)).currency];

  const [existingEntries, existingFx] = await Promise.all([
    prisma.budgetEntry.count({
      where: { userId, yearMonth, currency: { in: currencies } },
    }),
    canExchange
      ? prisma.budgetExchange.count({
          where: { userId, yearMonth, currency: { in: currencies } },
        })
      : Promise.resolve(0),
  ]);
  if (existingEntries + existingFx > 0 && !data.overwrite) {
    throw new ValidationError("This month already has a plan. Confirm to replace it.");
  }

  const categoryIds = new Set(
    (await prisma.category.findMany({ where: { userId }, select: { id: true } })).map((category) => category.id)
  );

  const copies: {
    currency: string;
    rows: { categoryId: string; expectedAmount: Decimal | number }[];
    exchange: { expectedIn: Decimal | number; expectedOut: Decimal | number } | null;
  }[] = [];
  for (const currency of currencies) {
    const fromMonth = await previousPlanMonth(userId, yearMonth, currency);
    if (!fromMonth) continue;
    const [rows, exchange] = await Promise.all([
      prisma.budgetEntry.findMany({
        where: { userId, yearMonth: fromMonth, currency },
        select: { categoryId: true, expectedAmount: true },
      }),
      canExchange
        ? prisma.budgetExchange.findUnique({
            where: { userId_yearMonth_currency: { userId, yearMonth: fromMonth, currency } },
            select: { expectedIn: true, expectedOut: true },
          })
        : Promise.resolve(null),
    ]);
    copies.push({
      currency,
      rows: rows.filter((row) => categoryIds.has(row.categoryId)),
      exchange:
        exchange && (toNumber(exchange.expectedIn) > 0 || toNumber(exchange.expectedOut) > 0) ? exchange : null,
    });
  }

  if (copies.every((copy) => copy.rows.length === 0 && !copy.exchange)) {
    throw new ValidationError("There is no earlier month to copy from.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.budgetEntry.deleteMany({
      where: { userId, yearMonth, currency: { in: currencies } },
    });
    await tx.budgetExchange.deleteMany({
      where: { userId, yearMonth, currency: { in: currencies } },
    });
    for (const copy of copies) {
      if (copy.rows.length > 0) {
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
      if (copy.exchange) {
        await tx.budgetExchange.create({
          data: {
            userId,
            yearMonth,
            currency: copy.currency,
            expectedIn: copy.exchange.expectedIn,
            expectedOut: copy.exchange.expectedOut,
          },
        });
      }
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

export const getExchangeStatus = async (
  userId: string,
  query: { yearMonth: string; currency: string; direction: ExchangeDirection }
): Promise<CategoryBudgetStatus> => {
  const { yearMonth, currency, direction } = query;
  if (!isYearMonth(yearMonth)) {
    throw new ValidationError("Month must be YYYY-MM.");
  }
  if (direction !== "in" && direction !== "out") {
    throw new ValidationError("Direction must be in or out.");
  }

  const available = await getAvailableCurrencies(userId);
  if (available.length < 2) {
    return { expected: null, actual: 0 };
  }

  const [exchange, [monthTotals]] = await Promise.all([
    prisma.budgetExchange.findUnique({
      where: { userId_yearMonth_currency: { userId, yearMonth, currency } },
      select: { expectedIn: true, expectedOut: true },
    }),
    calculateMonthlyTotals(userId, [yearMonth], { kind: "currency", currency }),
  ]);

  const expected = plannedAmount(direction === "in" ? exchange?.expectedIn : exchange?.expectedOut);
  const actual = direction === "in" ? monthTotals.incomeFromExchange : monthTotals.expensesFromExchange;
  return { expected, actual };
};
