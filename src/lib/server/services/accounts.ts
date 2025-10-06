import { prisma } from "@/lib/prisma";
import { QueryParams } from "@/lib/utils/parse-query";
import { Account, AccountType } from "@prisma/client";
import { NotFoundError, ValidationError } from "@/lib/errors/AppError";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

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
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return accounts;
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