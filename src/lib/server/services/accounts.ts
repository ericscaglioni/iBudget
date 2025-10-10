import { prisma } from "@/lib/prisma";
import { QueryParams } from "@/lib/utils/parse-query";
import { Account, AccountType, TransactionType } from "@prisma/client";
import { NotFoundError, ValidationError } from "@/lib/errors/AppError";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Calculate the current balance for an account
 * Balance = initialBalance + income transactions - expense transactions
 * Excludes future transactions by filtering date <= now
 */
export const calculateAccountBalance = async (
  account: { id: string; initialBalance: number }
): Promise<number> => {
  // Get all transactions for this account (excluding future transactions)
  const transactions = await prisma.transaction.findMany({
    where: { 
      accountId: account.id,
      date: { lte: new Date() },
    },
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

export const listAccounts = async (props: QueryParams) => {
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

  return { accounts, total };
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

  return { accounts, total };
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