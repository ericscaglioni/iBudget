import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { dayjs } from "@/lib/utils/dayjs.js";

// Helper function to convert Decimal to number
const toNumber = (value: Decimal | number): number => {
  return typeof value === 'number' ? value : value.toNumber();
};

interface AccountBalance {
  accountId: string;
  name: string;
  balance: number;
  currency: string;
}

interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  color: string;
}

interface MonthlyTotal {
  month: string; // YYYY-MM format
  income: number;
  expenses: number;
  net: number;
  categoryBreakdown: CategoryBreakdown[];
}

interface SixMonthHistory {
  month: string; // YYYY-MM format
  income: number;
  expenses: number;
}

interface DashboardQuery {
  includeCurrentMonth?: boolean;
  includePreviousMonth?: boolean;
  month?: string; // YYYY-MM format for filtering specific month
}

interface DashboardData {
  totalBalance: number;
  accountBalances: AccountBalance[];
  monthlyTotals: MonthlyTotal[];
  sixMonthHistory: SixMonthHistory[];
}

/**
 * Calculate the current balance for an account
 * Balance = initialBalance + income - expense + incoming transfers - outgoing transfers
 * 
 * How transfers work:
 * - Outgoing transfer: expense transaction with transferId on fromAccount (subtract)
 * - Incoming transfer: income transaction with transferId on toAccount (add)
 * 
 * Excludes future transactions by filtering date <= now
 */
const calculateAccountBalance = async (
  account: { id: string; initialBalance: Decimal }
): Promise<number> => {
  // Get all transactions for this account (excluding future transactions)
  // This includes:
  // - Regular income transactions (add to balance)
  // - Regular expense transactions (subtract from balance)
  // - Transfer income transactions (incoming transfers - add to balance)
  // - Transfer expense transactions (outgoing transfers - subtract from balance)
  const transactions = await prisma.transaction.findMany({
    where: { 
      accountId: account.id,
      date: { lte: new Date() },
    },
    select: { 
      type: true, 
      amount: true,
      transferId: true,
    },
  });

  // Calculate net from all transactions
  // Income (including incoming transfers): +amount
  // Expense (including outgoing transfers): -amount
  const transactionNet = transactions.reduce((sum, tx) => {
    const amount = toNumber(tx.amount);
    return tx.type === TransactionType.income 
      ? sum + amount 
      : sum - amount;
  }, 0);

  const initialBalance = toNumber(account.initialBalance);
  return initialBalance + transactionNet;
};

/**
 * Get 6-month income and expense history
 */
const getSixMonthHistory = async (userId: string): Promise<SixMonthHistory[]> => {
  // Generate exactly 6 months: from 5 months ago to current month
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const month = dayjs().subtract(i, "month").format("YYYY-MM");
    months.push(month);
  }

  // Calculate date range for the 6 months
  const startDate = dayjs().subtract(5, "month").startOf("month").toDate();
  const endDate = dayjs().endOf("month").toDate();
  
  // Use Prisma raw query to group by month using DATE_FORMAT for MySQL
  const monthlyData = await prisma.$queryRaw<Array<{
    month_key: string;
    type: string;
    total_amount: number;
  }>>`
    SELECT 
      DATE_FORMAT(date, '%Y-%m') as month_key,
      type,
      SUM(amount) as total_amount
    FROM transactions
    WHERE 
      userId = ${userId}
      AND date >= ${startDate}
      AND date <= ${endDate}
      AND transferId IS NULL
      AND type IN ('income', 'expense')
    GROUP BY DATE_FORMAT(date, '%Y-%m'), type
    ORDER BY month_key ASC
  `;

  // Group by month and calculate totals
  const monthMap = new Map<string, { income: number; expenses: number }>();
  
  monthlyData.forEach((row) => {
    // Use the month_key directly from PostgreSQL (no timezone conversion issues)
    const monthKey = row.month_key;
    const existing = monthMap.get(monthKey) || { income: 0, expenses: 0 };
    
    if (row.type === "income") {
      existing.income += Number(row.total_amount);
    } else if (row.type === "expense") {
      existing.expenses += Number(row.total_amount);
    }
    
    monthMap.set(monthKey, existing);
  });

  // Return exactly 6 months with real zero values for months with no transactions
  return months.map(month => ({
    month,
    income: monthMap.get(month)?.income || 0,
    expenses: monthMap.get(month)?.expenses || 0,
  }));
};

/**
 * Get monthly totals for a specific month
 */
const getMonthlyTotals = async (
  userId: string, 
  month: string // YYYY-MM format
): Promise<MonthlyTotal> => {
  const startDate = dayjs(month, "YYYY-MM").startOf("month").toDate();
  const endDate = dayjs(month, "YYYY-MM").endOf("month").toDate();

  // Get all transactions for the month, excluding transfers entirely
  // Transfers are just movements between accounts and shouldn't affect income/expense totals
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      // Exclude all transfer transactions
      transferId: null,
    },
    include: {
      category: true,
    },
  });

  const filteredTransactions = transactions;

  // Calculate income and expenses
  const income = filteredTransactions
    .filter(tx => tx.type === TransactionType.income)
    .reduce((sum, tx) => sum + toNumber(tx.amount), 0);

  const expenses = filteredTransactions
    .filter(tx => tx.type === TransactionType.expense)
    .reduce((sum, tx) => sum + toNumber(tx.amount), 0);

  // Group by category for breakdown (expenses only)
  const categoryMap = new Map<string, CategoryBreakdown>();

  filteredTransactions
    .filter(tx => tx.type === TransactionType.expense)
    .forEach(tx => {
      if (tx.category) {
        const existing = categoryMap.get(tx.category.id);
        const amount = toNumber(tx.amount);
        if (existing) {
          existing.amount += amount;
        } else {
          categoryMap.set(tx.category.id, {
            categoryId: tx.category.id,
            categoryName: tx.category.name,
            amount: amount,
            color: tx.category.color,
          });
        }
      }
    });

  const categoryBreakdown = Array.from(categoryMap.values()).sort(
    (a, b) => b.amount - a.amount
  );

  return {
    month,
    income,
    expenses,
    net: income - expenses,
    categoryBreakdown,
  };
};

/**
 * Get monthly summary for a specific month
 */
export const getMonthlySummary = async (userId: string, month?: string) => {
  // Default to current month if not provided
  const targetMonth = month || dayjs().format("YYYY-MM");
  
  // Get monthly totals using existing function
  const monthlyData = await getMonthlyTotals(userId, targetMonth);

  return {
    income: monthlyData.income,
    expenses: monthlyData.expenses,
    net: monthlyData.net,
    categoryBreakdown: monthlyData.categoryBreakdown.map(cat => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      amount: cat.amount,
      color: cat.color,
    })),
  };
};

/**
 * Get account overview (balances + 6-month history)
 */
export const getAccountOverview = async (userId: string) => {
  // Get account balances
  const accountBalancesResult = await getAccountBalances(userId);
  
  // Get 6-month history
  const sixMonthSummary = await getSixMonthHistory(userId);

  return {
    accountBalances: accountBalancesResult.accountBalances,
    sixMonthSummary,
  };
};

/**
 * Get account balances for a user
 */
export const getAccountBalances = async (userId: string) => {
  // Get all accounts for the user with initialBalance
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true, name: true, currency: true, initialBalance: true },
    orderBy: { name: "asc" },
  });

  // Calculate balance for each account
  const accountBalances = await Promise.all(
    accounts.map(async (account) => ({
      accountId: account.id,
      name: account.name,
      currency: account.currency,
      balance: await calculateAccountBalance(account),
    }))
  );

  // Calculate total balance by currency
  const totalBalanceByCurrency: Record<string, number> = {};
  accountBalances.forEach(account => {
    if (!totalBalanceByCurrency[account.currency]) {
      totalBalanceByCurrency[account.currency] = 0;
    }
    totalBalanceByCurrency[account.currency] += account.balance;
  });

  return {
    totalBalanceByCurrency,
    accountBalances,
  };
};

/**
 * Get dashboard data for a user
 */
export const getDashboardData = async (
  userId: string,
  query?: DashboardQuery
): Promise<DashboardData> => {
  const { 
    includeCurrentMonth = true, 
    includePreviousMonth = true,
    month 
  } = query || {};

  // Get all accounts for the user with initialBalance
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true, name: true, currency: true, initialBalance: true },
    orderBy: { name: "asc" },
  });

  // Calculate balance for each account
  const accountBalances: AccountBalance[] = await Promise.all(
    accounts.map(async (account) => ({
      accountId: account.id,
      name: account.name,
      currency: account.currency,
      balance: await calculateAccountBalance(account),
    }))
  );

  // Calculate total balance across all accounts
  const totalBalance = accountBalances.reduce(
    (sum, account) => sum + account.balance,
    0
  );

  // Get monthly totals
  const monthlyTotals: MonthlyTotal[] = [];
  
  if (month) {
    // If specific month is requested, only return that month's data
    monthlyTotals.push(await getMonthlyTotals(userId, month));
  } else {
    // Default behavior: include current and/or previous month
    const currentMonth = dayjs().format("YYYY-MM");
    const previousMonth = dayjs().subtract(1, "month").format("YYYY-MM");

    if (includeCurrentMonth) {
      monthlyTotals.push(await getMonthlyTotals(userId, currentMonth));
    }

    if (includePreviousMonth) {
      monthlyTotals.push(await getMonthlyTotals(userId, previousMonth));
    }
  }

  // Get 6-month history (always included regardless of month filter)
  const sixMonthHistory = await getSixMonthHistory(userId);

  return {
    totalBalance,
    accountBalances,
    monthlyTotals,
    sixMonthHistory,
  };
};

