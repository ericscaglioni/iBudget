import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { calendarMonthString, getMonthDateRange, parseYearMonth } from "@/lib/utils/format";
import { dayjs } from "@/lib/utils/dayjs.js";
import { resolveCurrency } from "./settings";
import { sortAccountsByUserOrder } from "@/lib/utils/sort-accounts";
import { convertAmount, getRateTable, RatesUnavailableError, type RateTable } from "./exchange-rates";

// Helper function to convert Decimal to number
const toNumber = (value: Decimal | number): number => {
  return typeof value === 'number' ? value : value.toNumber();
};

export interface AccountBalance {
  accountId: string;
  name: string;
  /** Native balance in `currency`. */
  balance: number;
  currency: string;
  /** Present on the All view: `balance` converted into the home currency. */
  convertedBalance?: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  color: string;
}

export interface MonthlyTotal {
  month: string; // YYYY-MM format
  income: number;
  expenses: number;
  /** Part of `income` that is money received from another currency (a transfer between currencies). */
  incomeFromExchange: number;
  /** Part of `expenses` that is money sent to another currency (a transfer between currencies). */
  expensesFromExchange: number;
  net: number;
  categoryBreakdown: CategoryBreakdown[];
}

export interface SixMonthHistory {
  month: string; // YYYY-MM format
  income: number;
  expenses: number;
}

export interface CurrencyBalance {
  currency: string;
  balance: number; // total held in this currency, native amount
}

export interface NetWorth {
  total: number;
  previousMonthTotal: number; // total at the end of the previous month
  change: number;
  changePercent: number | null;
}

interface DashboardQuery {
  includeCurrentMonth?: boolean;
  includePreviousMonth?: boolean;
  month?: string; // YYYY-MM format for filtering specific month
  currency?: string; // currency to show; falls back to the user's default
  /** Request the converted All view (`?view=all`). Ignored with fewer than two currencies. */
  view?: "all";
}

export interface DashboardData {
  /**
   * The currency everything below is expressed in. On a one-currency view this is native.
   * On All it is the home currency, after conversion.
   */
  currency: string;
  /** `all` only when conversion succeeded. */
  view: "currency" | "all";
  /** Saved home currency (All converts into this). */
  homeCurrency: string;
  /** Currencies the user has accounts in (what they can switch between). */
  availableCurrencies: string[];
  /** Total held in each of those currencies, for the switcher (native amounts). */
  currencyBalances: CurrencyBalance[];
  totalBalance: number;
  netWorth: NetWorth;
  /** Accounts in the shown currency, or every account on All. */
  accountBalances: AccountBalance[];
  monthlyTotals: MonthlyTotal[];
  sixMonthHistory: SixMonthHistory[];
  /** Rate date shown on All, or null on a one-currency view. */
  ratesAsOf: string | null;
  /** Set when All was requested but rates failed; the rest of the payload is the home-currency view. */
  ratesError: string | null;
}

type AccountRecord = { id: string; name: string; currency: string; initialBalance: Decimal };

/**
 * Calculate current balances (and the balance at the end of the previous month) for accounts.
 * Balance = initialBalance + income - expense + incoming transfers - outgoing transfers
 *
 * How transfers work:
 * - Outgoing transfer: expense transaction with transferId on fromAccount (subtract)
 * - Incoming transfer: income transaction with transferId on toAccount (add)
 *
 * Excludes future transactions by filtering date <= now.
 */
const calculateBalances = async (accounts: AccountRecord[]) => {
  const now = new Date();
  const previousMonthEnd = dayjs().subtract(1, "month").endOf("month").toDate();

  const transactions = accounts.length
    ? await prisma.transaction.findMany({
        where: {
          accountId: { in: accounts.map((account) => account.id) },
          date: { lte: now },
        },
        select: { accountId: true, type: true, amount: true, date: true },
      })
    : [];

  const balances = new Map<string, { current: number; previousMonthEnd: number }>();
  accounts.forEach((account) => {
    const initial = toNumber(account.initialBalance);
    balances.set(account.id, { current: initial, previousMonthEnd: initial });
  });

  transactions.forEach((tx) => {
    const entry = balances.get(tx.accountId);
    if (!entry) return;

    const signed = tx.type === TransactionType.income ? toNumber(tx.amount) : -toNumber(tx.amount);
    entry.current += signed;
    if (tx.date <= previousMonthEnd) {
      entry.previousMonthEnd += signed;
    }
  });

  return balances;
};

/** Month keys (YYYY-MM) for the last `count` months, oldest first. */
const lastMonths = (count: number) =>
  Array.from({ length: count }, (_, i) => dayjs().subtract(count - 1 - i, "month").format("YYYY-MM"));

type MonthlyMode =
  | { kind: "currency"; currency: string }
  | { kind: "all"; home: string; rates: RateTable };

/**
 * Income / expense totals and category breakdown for each given month.
 *
 * One-currency view:
 * - Same-currency transfers are excluded (the same money moving around).
 * - A currency exchange counts as expense in the source and income in the destination, and is
 *   left out of the category chart.
 *
 * All view: every transfer is skipped. Remaining income and expenses are converted into the
 * home currency at today's rates.
 */
const calculateMonthlyTotals = async (
  userId: string,
  months: string[],
  mode: MonthlyMode
): Promise<MonthlyTotal[]> => {
  const sorted = [...months].sort();
  const startDate = getMonthDateRange(sorted[0])!.startDate;
  const endDate = getMonthDateRange(sorted[sorted.length - 1])!.endDate;
  const allView = mode.kind === "all";

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
      ...(allView
        ? { transferId: null }
        : {
            OR: [
              { transferId: null, account: { currency: mode.currency } },
              // Transfer sides in any currency: we need both to tell whether the currencies differ
              { transferId: { not: null } },
            ],
          }),
    },
    select: {
      type: true,
      amount: true,
      date: true,
      transferId: true,
      account: { select: { currency: true } },
      category: { select: { id: true, name: true, color: true } },
    },
  });

  // Currencies involved in each transfer (both sides share the same date, so both are in range)
  const transferCurrencies = new Map<string, Set<string>>();
  transactions.forEach((tx) => {
    if (!tx.transferId) return;
    const currencies = transferCurrencies.get(tx.transferId) ?? new Set<string>();
    currencies.add(tx.account.currency);
    transferCurrencies.set(tx.transferId, currencies);
  });

  const byMonth = new Map<
    string,
    { income: number; expenses: number; incomeFromExchange: number; expensesFromExchange: number; categories: Map<string, CategoryBreakdown> }
  >();
  months.forEach((month) =>
    byMonth.set(month, { income: 0, expenses: 0, incomeFromExchange: 0, expensesFromExchange: 0, categories: new Map() })
  );

  const toDisplay = (amount: number, from: string) =>
    allView ? convertAmount(amount, from, mode.home, mode.rates.rates, mode.rates.base) : amount;

  transactions.forEach((tx) => {
    const entry = byMonth.get(calendarMonthString(tx.date));
    if (!entry) return;

    const isTransfer = !!tx.transferId;
    if (isTransfer) {
      if (mode.kind === "all") return;
      const isCurrencyExchange = (transferCurrencies.get(tx.transferId!)?.size ?? 0) > 1;
      if (!isCurrencyExchange || tx.account.currency !== mode.currency) return;
    }

    const amount = toDisplay(toNumber(tx.amount), tx.account.currency);

    if (tx.type === TransactionType.income) {
      entry.income += amount;
      if (isTransfer) entry.incomeFromExchange += amount;
      return;
    }

    entry.expenses += amount;
    if (isTransfer) entry.expensesFromExchange += amount;
    if (tx.category && !isTransfer) {
      const existing = entry.categories.get(tx.category.id);
      if (existing) {
        existing.amount += amount;
      } else {
        entry.categories.set(tx.category.id, {
          categoryId: tx.category.id,
          categoryName: tx.category.name,
          amount,
          color: tx.category.color,
        });
      }
    }
  });

  return months.map((month) => {
    const { income, expenses, incomeFromExchange, expensesFromExchange, categories } = byMonth.get(month)!;
    return {
      month,
      income,
      expenses,
      incomeFromExchange,
      expensesFromExchange,
      net: income - expenses,
      categoryBreakdown: Array.from(categories.values()).sort((a, b) => b.amount - a.amount),
    };
  });
};

/**
 * Get monthly summary for a specific month (in the shown currency)
 */
export const getMonthlySummary = async (userId: string, month?: string, requestedCurrency?: string) => {
  // Default to current month if not provided
  const targetMonth = month || dayjs().format("YYYY-MM");
  const { currency } = await resolveCurrency(userId, requestedCurrency);

  const [monthlyData] = await calculateMonthlyTotals(userId, [targetMonth], { kind: "currency", currency });

  return {
    currency,
    income: monthlyData.income,
    expenses: monthlyData.expenses,
    incomeFromExchange: monthlyData.incomeFromExchange,
    expensesFromExchange: monthlyData.expensesFromExchange,
    net: monthlyData.net,
    categoryBreakdown: monthlyData.categoryBreakdown,
  };
};

/**
 * Get account overview (balances + 6-month history)
 */
export const getAccountOverview = async (userId: string, requestedCurrency?: string) => {
  const { currency } = await resolveCurrency(userId, requestedCurrency);
  const accountBalancesResult = await getAccountBalances(userId);
  const monthlyTotals = await calculateMonthlyTotals(userId, lastMonths(6), { kind: "currency", currency });

  return {
    currency,
    accountBalances: accountBalancesResult.accountBalances.filter((account) => account.currency === currency),
    sixMonthSummary: monthlyTotals.map(({ month, income, expenses }) => ({ month, income, expenses })),
  };
};

/**
 * Get account balances for a user
 */
export const getAccountBalances = async (userId: string) => {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true, name: true, currency: true, initialBalance: true },
    orderBy: { name: "asc" },
  });

  const balances = await calculateBalances(accounts);

  const accountBalances: AccountBalance[] = accounts.map((account) => ({
    accountId: account.id,
    name: account.name,
    currency: account.currency,
    balance: balances.get(account.id)!.current,
  }));

  // Calculate total balance by currency
  const totalBalanceByCurrency: Record<string, number> = {};
  accountBalances.forEach(account => {
    totalBalanceByCurrency[account.currency] = (totalBalanceByCurrency[account.currency] ?? 0) + account.balance;
  });

  return {
    totalBalanceByCurrency,
    accountBalances,
  };
};

const monthsForDashboard = async (userId: string, month?: string) => {
  const recentMonths = lastMonths(6);
  const latest = await prisma.transaction.findFirst({
    where: { userId },
    orderBy: { date: "desc" },
    select: { date: true },
  });
  const currentMonthKey = dayjs().format("YYYY-MM");
  const latestMonth = latest?.date ? calendarMonthString(latest.date) : currentMonthKey;
  const endMonth = latestMonth > currentMonthKey ? latestMonth : currentMonthKey;
  const monthsThroughLatest: string[] = [];
  let cursor = parseYearMonth(recentMonths[0]);
  const end = parseYearMonth(endMonth);
  while (cursor && end && !cursor.isAfter(end, "month")) {
    monthsThroughLatest.push(cursor.format("YYYY-MM"));
    cursor = cursor.add(1, "month");
  }
  const months =
    month && !monthsThroughLatest.includes(month)
      ? [...monthsThroughLatest, month].sort()
      : monthsThroughLatest;
  return { months, monthsThroughLatest };
};

const pickMonthlySlice = (
  allMonthlyTotals: MonthlyTotal[],
  monthsThroughLatest: string[],
  query: Pick<DashboardQuery, "includeCurrentMonth" | "includePreviousMonth" | "month">
) => {
  const { includeCurrentMonth = true, includePreviousMonth = true, month } = query;
  const chartMonths = monthsThroughLatest.slice(-6);
  const sixMonthHistory = chartMonths.map((monthKey) => {
    const entry = allMonthlyTotals.find((item) => item.month === monthKey)!;
    return { month: monthKey, income: entry.income, expenses: entry.expenses };
  });
  const currentMonth = dayjs().format("YYYY-MM");
  const previousMonth = dayjs().subtract(1, "month").format("YYYY-MM");
  const monthlyTotals = month
    ? allMonthlyTotals.filter((entry) => entry.month === month)
    : allMonthlyTotals.filter(
        (entry) =>
          (includeCurrentMonth || entry.month !== currentMonth) &&
          (includePreviousMonth || entry.month !== previousMonth)
      );
  return { monthlyTotals, sixMonthHistory };
};

const netWorthFrom = (total: number, previousMonthTotal: number): NetWorth => {
  const change = total - previousMonthTotal;
  return {
    total,
    previousMonthTotal,
    change,
    changePercent: previousMonthTotal !== 0 ? (change / Math.abs(previousMonthTotal)) * 100 : null,
  };
};

/**
 * Dashboard for one currency, or All (every account converted into the home currency).
 *
 * All is never mixed without converting. One-currency views stay native. Transfers are skipped
 * entirely on All; on a one-currency view they follow the usual exchange rules.
 */
export const getDashboardData = async (
  userId: string,
  query?: DashboardQuery
): Promise<DashboardData> => {
  const {
    includeCurrentMonth = true,
    includePreviousMonth = true,
    month,
    currency: requestedCurrency,
    view: requestedView,
  } = query || {};

  const { currency: resolved, available } = await resolveCurrency(
    userId,
    requestedView === "all" ? undefined : requestedCurrency
  );
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const homeCurrency = available.includes(settings?.baseCurrency ?? "")
    ? settings!.baseCurrency
    : resolved;
  const canAll = available.length > 1;
  const landOnAll = canAll && settings?.openDashboardOn === "all";
  const wantAll = canAll && (requestedView === "all" || (!requestedCurrency && landOnAll));

  const allAccounts = sortAccountsByUserOrder(
    await prisma.account.findMany({
      where: { userId },
      select: { id: true, name: true, currency: true, initialBalance: true, sortOrder: true },
    })
  );

  const balances = await calculateBalances(allAccounts);

  const totals = new Map<string, number>();
  allAccounts.forEach((account) => {
    totals.set(account.currency, (totals.get(account.currency) ?? 0) + balances.get(account.id)!.current);
  });
  const currencyBalances: CurrencyBalance[] = available.map((code) => ({
    currency: code,
    balance: totals.get(code) ?? 0,
  }));

  const { months, monthsThroughLatest } = await monthsForDashboard(userId, month);
  const sliceQuery = { includeCurrentMonth, includePreviousMonth, month };

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

  if (wantAll && rates) {
    const accountBalances: AccountBalance[] = allAccounts.map((account) => {
      const native = balances.get(account.id)!.current;
      return {
        accountId: account.id,
        name: account.name,
        currency: account.currency,
        balance: native,
        convertedBalance: convertAmount(native, account.currency, homeCurrency, rates.rates, rates.base),
      };
    });
    const total = accountBalances.reduce((sum, account) => sum + (account.convertedBalance ?? 0), 0);
    const previousMonthTotal = allAccounts.reduce(
      (sum, account) =>
        sum +
        convertAmount(
          balances.get(account.id)!.previousMonthEnd,
          account.currency,
          homeCurrency,
          rates.rates,
          rates.base
        ),
      0
    );
    const allMonthlyTotals = await calculateMonthlyTotals(userId, months, {
      kind: "all",
      home: homeCurrency,
      rates,
    });
    const { monthlyTotals, sixMonthHistory } = pickMonthlySlice(allMonthlyTotals, monthsThroughLatest, sliceQuery);

    return {
      currency: homeCurrency,
      view: "all",
      homeCurrency,
      availableCurrencies: available,
      currencyBalances,
      totalBalance: total,
      netWorth: netWorthFrom(total, previousMonthTotal),
      accountBalances,
      monthlyTotals,
      sixMonthHistory,
      ratesAsOf: rates.asOf,
      ratesError: null,
    };
  }

  const currency = requestedView === "all" && !rates ? homeCurrency : resolved;
  const accounts = allAccounts.filter((account) => account.currency === currency);
  const accountBalances: AccountBalance[] = accounts.map((account) => ({
    accountId: account.id,
    name: account.name,
    currency: account.currency,
    balance: balances.get(account.id)!.current,
  }));
  const total = accounts.reduce((sum, account) => sum + balances.get(account.id)!.current, 0);
  const previousMonthTotal = accounts.reduce((sum, account) => sum + balances.get(account.id)!.previousMonthEnd, 0);
  const allMonthlyTotals = await calculateMonthlyTotals(userId, months, { kind: "currency", currency });
  const { monthlyTotals, sixMonthHistory } = pickMonthlySlice(allMonthlyTotals, monthsThroughLatest, sliceQuery);

  return {
    currency,
    view: "currency",
    homeCurrency,
    availableCurrencies: available,
    currencyBalances,
    totalBalance: total,
    netWorth: netWorthFrom(total, previousMonthTotal),
    accountBalances,
    monthlyTotals,
    sixMonthHistory,
    ratesAsOf: null,
    ratesError,
  };
};
