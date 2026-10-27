import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { dayjs } from "@/lib/utils/dayjs.js";
import { resolveCurrency } from "./settings";
import { sortAccountsByUserOrder } from "@/lib/utils/sort-accounts";

// Helper function to convert Decimal to number
const toNumber = (value: Decimal | number): number => {
  return typeof value === 'number' ? value : value.toNumber();
};

export interface AccountBalance {
  accountId: string;
  name: string;
  balance: number;
  currency: string;
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
}

export interface DashboardData {
  /** The one currency everything below is expressed in. Money is never mixed across currencies. */
  currency: string;
  /** Currencies the user has accounts in (what they can switch between). */
  availableCurrencies: string[];
  /** Total held in each of those currencies, for the switcher. */
  currencyBalances: CurrencyBalance[];
  totalBalance: number;
  netWorth: NetWorth;
  /** Accounts in the shown currency. */
  accountBalances: AccountBalance[];
  monthlyTotals: MonthlyTotal[];
  sixMonthHistory: SixMonthHistory[];
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

/**
 * Income / expense totals and category breakdown for each given month, only counting accounts in
 * `currency`.
 *
 * Transfers:
 * - Between accounts in the same currency: excluded. It's the same money moving around.
 * - Between accounts in different currencies: the money received counts as income in the
 *   destination currency and the money sent counts as expense in the source currency, since each
 *   currency's dashboard is looked at on its own. They are left out of the category breakdown
 *   (the "Transfer" category isn't spending).
 */
const calculateMonthlyTotals = async (
  userId: string,
  months: string[],
  currency: string
): Promise<MonthlyTotal[]> => {
  const sorted = [...months].sort();
  const startDate = dayjs(sorted[0], "YYYY-MM").startOf("month").toDate();
  const endDate = dayjs(sorted[sorted.length - 1], "YYYY-MM").endOf("month").toDate();

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
      OR: [
        { transferId: null, account: { currency } },
        // Transfer sides in any currency: we need both to tell whether the currencies differ
        { transferId: { not: null } },
      ],
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

  transactions.forEach((tx) => {
    const entry = byMonth.get(dayjs(tx.date).format("YYYY-MM"));
    if (!entry) return;

    // Only the side of a currency exchange that is in the shown currency counts
    const isTransfer = !!tx.transferId;
    if (isTransfer) {
      const isCurrencyExchange = (transferCurrencies.get(tx.transferId!)?.size ?? 0) > 1;
      if (!isCurrencyExchange || tx.account.currency !== currency) return;
    }

    const amount = toNumber(tx.amount);

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

  const [monthlyData] = await calculateMonthlyTotals(userId, [targetMonth], currency);

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
  const monthlyTotals = await calculateMonthlyTotals(userId, lastMonths(6), currency);

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

/**
 * Get dashboard data for a user, for one currency at a time.
 *
 * The currency shown is the requested one if the user has an account in it, otherwise their saved
 * default. Amounts from different currencies are never added together.
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
  } = query || {};

  const { currency, available } = await resolveCurrency(userId, requestedCurrency);

  const allAccounts = sortAccountsByUserOrder(
    await prisma.account.findMany({
      where: { userId },
      select: { id: true, name: true, currency: true, initialBalance: true, sortOrder: true },
    })
  );

  const balances = await calculateBalances(allAccounts);

  // Totals per currency, for the switcher
  const totals = new Map<string, number>();
  allAccounts.forEach((account) => {
    totals.set(account.currency, (totals.get(account.currency) ?? 0) + balances.get(account.id)!.current);
  });
  const currencyBalances: CurrencyBalance[] = available.map((code) => ({
    currency: code,
    balance: totals.get(code) ?? 0,
  }));

  const accounts = allAccounts.filter((account) => account.currency === currency);
  const accountBalances: AccountBalance[] = accounts.map((account) => ({
    accountId: account.id,
    name: account.name,
    currency: account.currency,
    balance: balances.get(account.id)!.current,
  }));

  const total = accounts.reduce((sum, account) => sum + balances.get(account.id)!.current, 0);
  const previousMonthTotal = accounts.reduce((sum, account) => sum + balances.get(account.id)!.previousMonthEnd, 0);
  const change = total - previousMonthTotal;

  // Monthly totals for the last 6 months (plus the requested one, if it is older)
  const recentMonths = lastMonths(6);
  const months = month && !recentMonths.includes(month) ? [...recentMonths, month] : recentMonths;
  const allMonthlyTotals = await calculateMonthlyTotals(userId, months, currency);

  const sixMonthHistory = allMonthlyTotals
    .filter((entry) => recentMonths.includes(entry.month))
    .map(({ month: m, income, expenses }) => ({ month: m, income, expenses }));

  const currentMonth = dayjs().format("YYYY-MM");
  const previousMonth = dayjs().subtract(1, "month").format("YYYY-MM");

  const monthlyTotals = month
    ? allMonthlyTotals.filter((entry) => entry.month === month)
    : allMonthlyTotals.filter(
        (entry) =>
          (includeCurrentMonth || entry.month !== currentMonth) &&
          (includePreviousMonth || entry.month !== previousMonth)
      );

  return {
    currency,
    availableCurrencies: available,
    currencyBalances,
    totalBalance: total,
    netWorth: {
      total,
      previousMonthTotal,
      change,
      changePercent: previousMonthTotal !== 0 ? (change / Math.abs(previousMonthTotal)) * 100 : null,
    },
    accountBalances,
    monthlyTotals,
    sixMonthHistory,
  };
};
