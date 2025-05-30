import { prisma } from "@/lib/prisma";
import { QueryParams } from "@/lib/utils/parse-query";
import { sanitizeFilterInput } from "@/lib/utils/sanitize";
import { Prisma, Transaction, TransactionType } from "@prisma/client";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export const getTransactionsByUser = async (userId: string, props: QueryParams) => {
  const { page, pageSize, sortField = "createdAt", sortOrder = "desc", filters } = props;

  const sanitizedDescription = filters.description ? sanitizeFilterInput(filters.description) : undefined;

  const where = {
    userId,
    ...(filters.accountId ? { accountId: filters.accountId } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(sanitizedDescription ? { description: { contains: sanitizedDescription, mode: "insensitive" as Prisma.QueryMode } } : {}),
    // Only list non-transfer transactions or the 'expense' side of transfers
    OR: [
      { transferId: null }, // Regular transaction
      {
        AND: [
          { transferId: { not: null } },        // Is a transfer
          { type: TransactionType.expense },                  // Only show expense side
          { category: { isSystem: true } },     // Must be system "Transfer" category
        ],
      },
    ],
  };

  return await prisma.$transaction([
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
}

interface GetTransferTransactionByTransferIdProps {
  transferId: string;
  userId: string;
}

export const getTransferTransactionByTransferId = async (props: GetTransferTransactionByTransferIdProps) => {
  const { transferId, userId } = props;

  // Get the income transaction
  // The expense is being listed
  const transferTransaction = await prisma.transaction.findFirst({
    where: { transferId, userId, type: TransactionType.income },
    include: {
      account: true,
    },
    orderBy: { createdAt: "desc" }
  });

  if (!transferTransaction) {
    return NextResponse.json({ error: "Transfer transaction not found" }, { status: 404 });
  }

  return NextResponse.json(transferTransaction);
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

  try {
    const transferCategory = await prisma.category.findFirst({
      where: { userId: null, name: "Transfer", isSystem: true },
    });
  
    if (!transferCategory) {
      return new NextResponse("Error trying to create transfer", { status: 500 });
    }
  
    if (!fromAccountId || !toAccountId || !amount) {
      return NextResponse.json({ error: "Missing transfer data" }, { status: 400 });
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
  
    return NextResponse.json({ status: 201 });
  } catch (error) {
    console.error("Transfer creation failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};

type CreateTransactionProps = Pick<Transaction, "type" | "amount" | "accountId" | "categoryId" | "description" | "date">;

export const createTransaction = async (userId: string, props: CreateTransactionProps) => {
  const { type, amount, accountId, categoryId, description, date } = props;

  try {
    if (!accountId || !categoryId) {
      return NextResponse.json({ error: "Missing transaction data" }, { status: 400 });
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
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Transaction creation failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};

type UpdateTransactionProps = CreateTransactionProps & { id: string };

export const updateTransaction = async (userId: string, props: UpdateTransactionProps) => {
  const { id, type, amount, accountId, categoryId, description, date } = props;

  try {
    const existing = await prisma.transaction.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Transaction update failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};

type UpdateTransferTransactionProps = UpdateTransactionProps & { transferId: string };

export const updateTransferTransaction = async (userId: string, props: UpdateTransferTransactionProps) => {
  const { transferId, amount, description, date } = props;

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        transferId,
      },
    });

    if (transactions.length !== 2) {
      return NextResponse.json({ error: "Transfer transaction not found or invalid" }, { status: 404 });
    }

    const expenseTx = transactions.find(tx => tx.type === TransactionType.expense);
    const incomeTx = transactions.find(tx => tx.type === TransactionType.income);

    if (!expenseTx || !incomeTx) {
      return NextResponse.json({ error: "Invalid transfer transaction data" }, { status: 400 });
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

    return NextResponse.json({ message: "Transaction updated successfully" });
  } catch (error) {
    console.error("Transfer update failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const deleteTransaction = async (userId: string, id: string) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id, userId },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
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

    return NextResponse.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Transaction deletion failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}