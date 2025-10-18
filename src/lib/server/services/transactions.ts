import { prisma } from "@/lib/prisma";
import { QueryParams } from "@/lib/utils/parse-query";
import { sanitizeFilterInput } from "@/lib/utils/sanitize";
import { getMonthDateRange } from "@/lib/utils/format";
import { dayjs } from "@/lib/utils/dayjs";
import { Prisma, Transaction, TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { NotFoundError, ValidationError } from "@/lib/errors/AppError";
import { v4 as uuid } from "uuid";

// Helper function to convert Decimal to number
const toNumber = (value: Decimal | number): number => {
  return typeof value === 'number' ? value : value.toNumber();
};

// Helper function to calculate installment info for recurring transactions
interface TransactionWithRecurring {
  isRecurring?: boolean;
  recurringId?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const calculateInstallmentInfo = async (transactions: any[]): Promise<any[]> => {
  const recurringTransactions = transactions.filter((t) => {
    const transaction = t as TransactionWithRecurring;
    return transaction.isRecurring && transaction.recurringId;
  });
  
  if (recurringTransactions.length === 0) {
    return transactions;
  }

  // Get all recurring IDs
  const recurringIds = [...new Set(recurringTransactions.map((t) => {
    const transaction = t as TransactionWithRecurring;
    return transaction.recurringId;
  }))];
  
  // Fetch all transactions for each recurring group
  const recurringGroups = await Promise.all(
    recurringIds.map(async (recurringId) => {
      const allRecurring = await prisma.transaction.findMany({
        where: { recurringId: recurringId! },
        orderBy: { date: 'asc' },
        select: { id: true, date: true },
      });
      
      return {
        recurringId,
        transactions: allRecurring,
        total: allRecurring.length,
      };
    })
  );

  // Create a map for quick lookup
  const recurringMap = new Map();
  recurringGroups.forEach(group => {
    group.transactions.forEach((t, index) => {
      recurringMap.set(t.id, {
        currentInstallment: index + 1,
        totalInstallments: group.total,
      });
    });
  });

  // Add installment info to transactions
  return transactions.map((t) => {
    const transaction = t as TransactionWithRecurring & { id: string };
    if (transaction.isRecurring && transaction.recurringId && recurringMap.has(transaction.id)) {
      const info = recurringMap.get(transaction.id);
      return {
        ...t,
        currentInstallment: info?.currentInstallment,
        totalInstallments: info?.totalInstallments,
      };
    }
    return t;
  });
};

export const getTransactionsByUser = async (userId: string, props: QueryParams) => {
  const { page, pageSize, sortField = "createdAt", sortOrder = "desc", filters } = props;
  const sanitizedDescription = filters.description ? sanitizeFilterInput(filters.description) : undefined;

  // Parse month filter if provided (format: YYYY-MM)
  let dateFilter = {};
  if (filters.month) {
    const dateRange = getMonthDateRange(filters.month);
    if (dateRange) {
      dateFilter = {
        date: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      };
    }
  }

  const where = {
    userId,
    ...(filters.accountId ? { accountId: filters.accountId } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.type ? { type: filters.type as TransactionType } : {}),
    ...(sanitizedDescription ? { description: { contains: sanitizedDescription } } : {}),
    ...dateFilter,
    OR: [
      { transferId: null },
      {
        AND: [
          { transferId: { not: null } },
          { type: TransactionType.expense },
          { category: { userId: null } },
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

  // Add installment info for recurring transactions
  const transactionsWithInstallments = await calculateInstallmentInfo(transactions);

  // Convert Decimal values to numbers for client serialization
  const serializedTransactions = transactionsWithInstallments.map(transaction => ({
    ...transaction,
    amount: toNumber(transaction.amount),
    // Also serialize account initialBalance if it exists
    account: transaction.account.initialBalance ? {
      ...transaction.account,
      initialBalance: toNumber(transaction.account.initialBalance),
    } : transaction.account,
  }));

  return { transactions: serializedTransactions, total };
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

  // Convert Decimal values to numbers for client serialization
  return {
    ...transferTransaction,
    amount: toNumber(transferTransaction.amount),
    account: transferTransaction.account.initialBalance ? {
      ...transferTransaction.account,
      initialBalance: toNumber(transferTransaction.account.initialBalance),
    } : transferTransaction.account,
  };
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
    where: { userId: null, name: "Transfer" },
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

type CreateTransactionProps = Pick<Transaction, "type" | "accountId" | "categoryId" | "description" | "date"> & {
  amount: number;
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

  // Convert Decimal values to numbers for client serialization
  return {
    ...created,
    amount: toNumber(created.amount),
  };
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

  // Generate initial transaction + future occurrences using dayjs for reliable date math
  const transactions = [];
  const startDate = dayjs(date); // Original transaction date
  let currentDate = startDate;

  // Determine how many occurrences to generate
  const defaultOccurrences = 12; // Default if no end date provided
  const finalDate = endsAt ? dayjs(endsAt) : null;

  // Calculate the interval unit based on frequency
  const getIntervalConfig = (freq: string): { amount: number; unit: string } => {
    switch (freq) {
      case 'daily':
        return { amount: 1, unit: 'day' };
      case 'weekly':
        return { amount: 1, unit: 'week' };
      case 'monthly':
        return { amount: 1, unit: 'month' };
      case 'yearly':
        return { amount: 1, unit: 'year' };
      default:
        throw new ValidationError(`Invalid frequency: ${freq}`);
    }
  };

  const interval = getIntervalConfig(frequency);

  // Generate occurrences
  let occurrenceCount = 0;
  const maxOccurrences = finalDate ? 1000 : defaultOccurrences; // Safety limit when finalDate is provided

  while (occurrenceCount < maxOccurrences) {
    // Check if current date exceeds final date (if provided)
    if (finalDate && currentDate.isAfter(finalDate, 'day')) {
      break;
    }

    // Add the transaction
    transactions.push({
      userId,
      type,
      amount: Math.abs(amount),
      accountId,
      categoryId,
      description,
      date: currentDate.toDate(), // Convert dayjs to native Date for Prisma
      isRecurring: true,
      frequency,
      endsAt: endsAt || null,
      recurringId,
    });

    occurrenceCount++;

    // Calculate next occurrence date
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentDate = currentDate.add(interval.amount, interval.unit as any);
  }

  // Edge case: If no transactions were generated, create at least the original one
  if (transactions.length === 0) {
    transactions.push({
      userId,
      type,
      amount: Math.abs(amount),
      accountId,
      categoryId,
      description,
      date: startDate.toDate(),
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

interface UpdateTransactionOptions {
  updateScope?: 'one' | 'future';
}

export const updateTransaction = async (
  userId: string, 
  props: UpdateTransactionProps, 
  options?: UpdateTransactionOptions
) => {
  const { id, amount, accountId, categoryId, description, date } = props;
  const updateScope = options?.updateScope || 'one';

  const existing = await prisma.transaction.findUnique({
    where: {
      id,
      userId,
    },
  });

  if (!existing) {
    throw new NotFoundError('Transaction');
  }

  // Handle updateScope=future: update this transaction and all future recurring transactions
  if (updateScope === 'future') {
    if (!existing.recurringId) {
      throw new ValidationError('Cannot update future transactions: transaction is not recurring');
    }

    if (!existing.date) {
      throw new ValidationError('Cannot update future transactions: transaction date is missing');
    }

    // Update all transactions with the same recurringId and date >= current date
    const updateResult = await prisma.transaction.updateMany({
      where: {
        userId,
        recurringId: existing.recurringId,
        date: {
          gte: existing.date,
        },
      },
      data: {
        type: existing.type,
        amount: Math.abs(amount),
        accountId,
        categoryId,
        description,
        // Note: We don't update the date for bulk updates to maintain the recurring schedule
      },
    });

    console.log(`Updated ${updateResult.count} recurring transaction(s) with recurringId: ${existing.recurringId}`);
    
    return { 
      message: `Updated ${updateResult.count} transaction(s) successfully`,
      count: updateResult.count,
    };
  }

  // Handle default updateScope=one: update only this single transaction
  const updated = await prisma.transaction.update({
    where: {
      id: existing.id,
    },
    data: {
      type: existing.type,
      amount: Math.abs(amount),
      accountId,
      categoryId,
      description,
      date,
    },
  });

  // Convert Decimal values to numbers for client serialization
  return {
    ...updated,
    amount: toNumber(updated.amount),
  };
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

interface DeleteTransactionOptions {
  scope?: 'single' | 'future';
}

export const deleteTransaction = async (userId: string, id: string, options?: DeleteTransactionOptions) => {
  const scope = options?.scope || 'single';
  
  const transaction = await prisma.transaction.findUnique({
    where: { id, userId },
  });

  if (!transaction) {
    throw new NotFoundError('Transaction');
  }

  // Handle scope=future: delete this transaction and all future recurring transactions
  if (scope === 'future') {
    if (!transaction.recurringId) {
      throw new ValidationError('Cannot delete future transactions: transaction is not recurring');
    }

    await prisma.transaction.deleteMany({
      where: {
        userId,
        recurringId: transaction.recurringId,
        date: {
          gte: transaction.date,
        },
      },
    });

    return { message: 'Transaction and future occurrences deleted successfully' };
  }

  // Handle default scope=single or transfers
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