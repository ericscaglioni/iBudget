import { prisma } from "@/lib/prisma";
import { QueryParams } from "@/lib/utils/parse-query";
import { Account, AccountType, TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { NotFoundError, ValidationError } from "@/lib/errors/AppError";
import { initializeUserDefaults } from "@/lib/server/utils/initializeUserDefaults";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Serialized account type for client-side usage (Decimal fields converted to numbers)
type SerializedAccount = Omit<Account, 'initialBalance'> & {
  initialBalance: number;
};

// Helper function to convert Decimal to number
const toNumber = (value: Decimal | number): number => {
  return typeof value === 'number' ? value : value.toNumber();
};

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
export const calculateAccountBalance = async (
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
 * Get account with calculated current balance
 */
export const getAccountWithBalance = async (userId: string, accountId: string) => {
  const account = await prisma.account.findUnique({
    where: { id: accountId, userId },
    select: {
      id: true,
      name: true,
      type: true,
      currency: true,
      initialBalance: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!account) {
    throw new NotFoundError('Account');
  }

  const currentBalance = await calculateAccountBalance(account);

  return {
    ...account,
    currentBalance,
  };
};

export const listAccounts = async (props: QueryParams): Promise<{ accounts: SerializedAccount[]; total: number }> => {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const { page, pageSize, sortField, sortOrder, filters } = props;
  const where = {
    userId,
    ...(filters.type && { type: filters.type as AccountType }),
    ...(filters.currency && { currency: filters.currency.toString() }),
  };

  const [accounts, total] = await prisma.$transaction([
    prisma.account.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.account.count({ where }),
  ]);

  // Convert Decimal values to numbers for client serialization
  const serializedAccounts = accounts.map(account => ({
    ...account,
    initialBalance: toNumber(account.initialBalance),
  }));

  return { accounts: serializedAccounts, total };
};

export const getAccountsByUser = async (userId: string, props: QueryParams) => {
  const { page, pageSize, sortField = "createdAt", sortOrder = "desc" } = props;

  const [accounts, total] = await prisma.$transaction([
    prisma.account.findMany({
      where: { userId },
      orderBy: {
        [sortField]: sortOrder,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.account.count({ where: { userId } }),
  ]);

  // Convert Decimal values to numbers for client serialization
  const serializedAccounts = accounts.map(account => ({
    ...account,
    initialBalance: toNumber(account.initialBalance),
  }));

  return { accounts: serializedAccounts, total };
};

const MAX_ACCOUNTS_TO_ORDER = 500;

/**
 * Saves the order the user chose: the first id gets position 0, and so on. Only accounts of the
 * same currency are ordered together, since reorder is per currency (including on All).
 */
export const reorderAccounts = async (userId: string, accountIds: unknown) => {
  if (
    !Array.isArray(accountIds) ||
    accountIds.length === 0 ||
    accountIds.length > MAX_ACCOUNTS_TO_ORDER ||
    accountIds.some((id) => typeof id !== "string")
  ) {
    throw new ValidationError("Send the accounts to order as a list of ids");
  }
  const ids = accountIds as string[];
  if (new Set(ids).size !== ids.length) {
    throw new ValidationError("An account can only appear once in the order");
  }

  // Only the user's own accounts can be ordered
  const accounts = await prisma.account.findMany({
    where: { userId, id: { in: ids } },
    select: { id: true, currency: true },
  });
  if (accounts.length !== ids.length) {
    throw new NotFoundError("Account");
  }
  if (new Set(accounts.map((account) => account.currency)).size > 1) {
    throw new ValidationError("Accounts in different currencies are ordered separately");
  }

  await prisma.$transaction(
    ids.map((id, index) => prisma.account.update({ where: { id, userId }, data: { sortOrder: index } }))
  );

  return { message: "Accounts reordered successfully" };
};

export const getUserAccounts = async (userId: string) => {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true, name: true, currency: true, initialBalance: true },
    orderBy: { name: "asc" },
  });

  // Calculate current balance for each account
  const accountsWithBalances = await Promise.all(
    accounts.map(async (account) => ({
      ...account,
      initialBalance: toNumber(account.initialBalance),
      balance: await calculateAccountBalance(account),
    }))
  );

  return accountsWithBalances;
};

/**
 * Get all accounts for a user with their current balances for dashboard
 */
export const getUserAccountsWithBalances = async (userId: string) => {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true, name: true, currency: true, initialBalance: true },
    orderBy: { name: "asc" },
  });

  // Calculate current balance for each account
  const accountBalances = await Promise.all(
    accounts.map(async (account) => ({
      accountId: account.id,
      name: account.name,
      currency: account.currency,
      balance: await calculateAccountBalance(account),
    }))
  );

  // Group balances by currency
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

export const createAccount = async (userId: string, data: Omit<Account, "id" | "userId" | "createdAt" | "updatedAt">) => {
  const { name, type, currency, initialBalance } = data;

  if (!name || !type || !currency) {
    throw new ValidationError('Missing required account data');
  }

  // Webhook may not have run yet (typical locally). The users row must exist before the FK insert.
  await initializeUserDefaults(userId);

  const created = await prisma.account.create({
    data: {
      userId,
      name,
      type,
      currency,
      initialBalance,
    },
  });

  return created;
};

export const updateAccount = async (userId: string, id: string, data: Partial<Account>) => {
  const { name, type, currency, initialBalance } = data;

  const existing = await prisma.account.findUnique({
    where: { id, userId },
  });

  if (!existing) {
    throw new NotFoundError('Account');
  }

  const updated = await prisma.account.update({
    where: { id },
    data: {
      name,
      type,
      currency,
      initialBalance,
    },
  });

  return updated;
};

export const deleteAccount = async (userId: string, id: string) => {
  const account = await prisma.account.findUnique({
    where: { id, userId },
  });

  if (!account) {
    throw new NotFoundError('Account');
  }

  // Check if account has any transactions
  const transactionCount = await prisma.transaction.count({
    where: { accountId: id },
  });

  if (transactionCount > 0) {
    throw new ValidationError('Cannot delete account with existing transactions');
  }

  await prisma.account.delete({
    where: { id },
  });

  return { message: 'Account deleted successfully' };
};