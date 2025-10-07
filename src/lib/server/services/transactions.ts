import { prisma } from "@/lib/prisma";
import { QueryParams } from "@/lib/utils/parse-query";
import { sanitizeFilterInput } from "@/lib/utils/sanitize";
import { Prisma, Transaction, TransactionType } from "@prisma/client";
import { NotFoundError, ValidationError } from "@/lib/errors/AppError";
import { v4 as uuid } from "uuid";

export const getTransactionsByUser = async (userId: string, props: QueryParams) => {
  const { page, pageSize, sortField = "createdAt", sortOrder = "desc", filters } = props;
  const sanitizedDescription = filters.description ? sanitizeFilterInput(filters.description) : undefined;

  const where = {
    userId,
    ...(filters.accountId ? { accountId: filters.accountId } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(sanitizedDescription ? { description: { contains: sanitizedDescription, mode: "insensitive" as Prisma.QueryMode } } : {}),
    OR: [
      { transferId: null },
      {
        AND: [
          { transferId: { not: null } },
          { type: TransactionType.expense },
          { category: { isSystem: true } },
        ],
      },
    ],
  };

  const [transactions, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where,
      include: {
        account: true,
        category: true,
      },
      orderBy: {
        [sortField]: sortOrder,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total };
}

interface GetTransferTransactionByTransferIdProps {
  transferId: string;
  userId: string;
}

export const getTransferTransactionByTransferId = async (props: GetTransferTransactionByTransferIdProps) => {
  const { transferId, userId } = props;

  const transferTransaction = await prisma.transaction.findFirst({
    where: { transferId, userId, type: TransactionType.income },
    include: {
      account: true,
    },
    orderBy: { createdAt: "desc" }
  });

  if (!transferTransaction) {
    throw new NotFoundError('Transfer transaction');
  }

  return transferTransaction;
}

interface TransferTransactionProps {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  date: string;
};

export const createTransferTransaction = async (userId: string, props: TransferTransactionProps) => {
  const { fromAccountId, toAccountId, amount, description, date } = props;

  const transferCategory = await prisma.category.findFirst({
    where: { userId: null, name: "Transfer", isSystem: true },
  });

  if (!transferCategory) {
    throw new Error("Transfer category not found");
  }

  if (!fromAccountId || !toAccountId || !amount) {
    throw new ValidationError("Missing transfer data");
  }

  const transferId = uuid(); // Shared between both transactions

  await prisma.transaction.createMany({
    data: [
      {
        type: TransactionType.expense,
        userId,
        transferId,
        accountId: fromAccountId,
        categoryId: transferCategory.id,
        amount: Math.abs(amount), // outgoing
        description: description ?? "Transfer to another account",
        date: new Date(date),
      },
      {
        type: TransactionType.income,
        userId,
        transferId,
        accountId: toAccountId,
        categoryId: transferCategory.id,
        amount: Math.abs(amount), // incoming
        description: description ?? "Transfer from another account",
        date: new Date(date),
      },
    ],
  });

  return { message: "Transfer created successfully" };
};

type CreateTransactionProps = Pick<Transaction, "type" | "amount" | "accountId" | "categoryId" | "description" | "date"> & {
  isRecurring?: boolean;
};

export const createTransaction = async (userId: string, props: CreateTransactionProps) => {
  const { type, amount, accountId, categoryId, description, date, isRecurring } = props;

  if (!accountId || !categoryId) {
    throw new ValidationError('Missing required transaction data');
  }

  const created = await prisma.transaction.create({
    data: {
      userId,
      type,
      amount: Math.abs(amount),
      accountId,
      categoryId,
      description,
      date,
      isRecurring: isRecurring || false,
    },
  });

  return created;
};

interface CreateRecurringTransactionProps {
  type: TransactionType;
  amount: number;
  accountId: string;
  categoryId: string;
  description: string;
  date: Date;
  frequency: string;
  endsAt?: Date;
}

export const createRecurringTransaction = async (
  userId: string,
  props: CreateRecurringTransactionProps
) => {
  const { type, amount, accountId, categoryId, description, date, frequency, endsAt } = props;

  if (!accountId || !categoryId) {
    throw new ValidationError('Missing required transaction data');
  }

  // Generate a unique recurringId for all occurrences
  const recurringId = uuid();

  // Helper function to calculate next date based on frequency
  const getNextDate = (currentDate: Date, freq: string): Date => {
    const nextDate = new Date(currentDate);
    switch (freq) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        throw new ValidationError(`Invalid frequency: ${freq}`);
    }
    return nextDate;
  };

  // Generate initial transaction + future occurrences
  const transactions = [];
  let currentDate = new Date(date);
  const maxFutureInstances = 12; // Up to 12 future instances (plus the initial one)

  // First, add the initial transaction
  transactions.push({
    userId,
    type,
    amount: Math.abs(amount),
    accountId,
    categoryId,
    description,
    date: new Date(currentDate),
    isRecurring: true,
    frequency,
    endsAt: endsAt || null,
    recurringId,
  });

  // Then generate up to 12 future instances
  for (let i = 0; i < maxFutureInstances; i++) {
    // Calculate next occurrence date
    currentDate = getNextDate(currentDate, frequency);
    
    // Check if we've reached the end date
    if (endsAt && currentDate > endsAt) {
      break;
    }

    transactions.push({
      userId,
      type,
      amount: Math.abs(amount),
      accountId,
      categoryId,
      description,
      date: new Date(currentDate),
      isRecurring: true,
      frequency,
      endsAt: endsAt || null,
      recurringId,
    });
  }

  // Create all transactions at once
  await prisma.transaction.createMany({
    data: transactions,
  });

  return {
    message: `Created ${transactions.length} recurring transaction(s)`,
    count: transactions.length,
    recurringId,
  };
};

type UpdateTransactionProps = CreateTransactionProps & { id: string };

export const updateTransaction = async (userId: string, props: UpdateTransactionProps) => {
  const { id, type, amount, accountId, categoryId, description, date } = props;

  const existing = await prisma.transaction.findUnique({
    where: {
      id,
      userId,
    },
  });

  if (!existing) {
    throw new NotFoundError('Transaction');
  }

  const updated = await prisma.transaction.update({
    where: {
      id: existing.id,
    },
    data: {
      type,
      amount: Math.abs(amount),
      accountId,
      categoryId,
      description,
      date,
    },
  });

  return updated;
};

type UpdateTransferTransactionProps = UpdateTransactionProps & { transferId: string };

export const updateTransferTransaction = async (userId: string, props: UpdateTransferTransactionProps) => {
  const { transferId, amount, description, date } = props;

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      transferId,
    },
  });

  if (transactions.length !== 2) {
    throw new NotFoundError('Transfer transaction');
  }

  const expenseTx = transactions.find(tx => tx.type === TransactionType.expense);
  const incomeTx = transactions.find(tx => tx.type === TransactionType.income);

  if (!expenseTx || !incomeTx) {
    throw new ValidationError('Invalid transfer transaction data');
  }

  await prisma.$transaction([
    prisma.transaction.update({
      where: { id: expenseTx.id },
      data: {
        amount: Math.abs(amount),
        accountId: expenseTx.accountId,
        description,
        date,
      },
    }),
    prisma.transaction.update({
      where: { id: incomeTx.id },
      data: {
        amount: Math.abs(amount),
        accountId: incomeTx.accountId,
        description,
        date,
      },
    }),
  ]);

  return { message: 'Transaction updated successfully' };
};

export const deleteTransaction = async (userId: string, id: string) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id, userId },
  });

  if (!transaction) {
    throw new NotFoundError('Transaction');
  }

  if (transaction.transferId) {
    await prisma.transaction.deleteMany({
      where: { transferId: transaction.transferId },
    });
  } else {
    await prisma.transaction.delete({
      where: { id, userId },
    });
  }

  return { message: 'Transaction deleted successfully' };
};