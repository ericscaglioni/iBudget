import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { dayjs } from "@/lib/utils/dayjs";

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

interface DashboardQuery {
  includeCurrentMonth?: boolean;
  includePreviousMonth?: boolean;
  month?: string; // YYYY-MM format for filtering specific month
}

interface DashboardData {
  totalBalance: number;
  accountBalances: AccountBalance[];
  monthlyTotals: MonthlyTotal[];
}

/**
 * Calculate the current balance for an account
 * Balance = initialBalance + income transactions - expense transactions
 */
const calculateAccountBalance = async (accountId: string): Promise<number> => {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { initialBalance: true },
  });

  if (!account) {
    return 0;
  }

  // Get all transactions for this account
  const transactions = await prisma.transaction.findMany({
    where: { accountId },
    select: { type: true, amount: true },
  });

  // Calculate net from transactions
  const transactionNet = transactions.reduce((sum, tx) => {
    return tx.type === TransactionType.income 
      ? sum + tx.amount 
      : sum - tx.amount;
  }, 0);

  return account.initialBalance + transactionNet;
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
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expenses = filteredTransactions
    .filter(tx => tx.type === TransactionType.expense)
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Group by category for breakdown
  const categoryMap = new Map<string, CategoryBreakdown>();

  filteredTransactions.forEach(tx => {
    if (tx.category) {
      const existing = categoryMap.get(tx.category.id);
      if (existing) {
        existing.amount += tx.amount;
      } else {
        categoryMap.set(tx.category.id, {
          categoryId: tx.category.id,
          categoryName: tx.category.name,
          amount: tx.amount,
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

  // Get all accounts for the user
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true, name: true, currency: true },
    orderBy: { name: "asc" },
  });

  // Calculate balance for each account
  const accountBalances: AccountBalance[] = await Promise.all(
    accounts.map(async (account) => ({
      accountId: account.id,
      name: account.name,
      currency: account.currency,
      balance: await calculateAccountBalance(account.id),
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

  return {
    totalBalance,
    accountBalances,
    monthlyTotals,
  };
};

