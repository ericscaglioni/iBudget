import { prisma } from "@/lib/prisma";
import { authHandler } from "@/lib/middlewares";
import { NextResponse } from "next/server";
import { TransactionTypeEnum } from "@/lib/constants";

export const POST = authHandler(async ({ userId, request }) => {
  const body = await request.json();

  const {
    type,
    amount,
    accountId,
    fromAccountId,
    toAccountId,
    categoryId,
    description,
    date,
  } = body;

  try {
    if (type === TransactionTypeEnum.transfer) {
      if (!fromAccountId || !toAccountId || !amount) {
        return NextResponse.json({ error: "Missing transfer data" }, { status: 400 });
      }

      // Fetch system category for transfers
      const transferCategory = await prisma.category.findFirst({
        where: {
          userId,
          isSystem: true,
        },
      });

      if (!transferCategory) {
        return NextResponse.json({ error: "Transfer category not found" }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            userId,
            type: TransactionTypeEnum.expense,
            accountId: fromAccountId,
            categoryId: transferCategory.id,
            amount: Math.abs(amount),
            description: description || "Transfer to another account",
            date,
          },
        }),
        prisma.transaction.create({
          data: {
            userId,
            type: TransactionTypeEnum.income,
            accountId: toAccountId,
            categoryId: transferCategory.id,
            amount: Math.abs(amount),
            description: description || "Transfer from another account",
            date,
          },
        }),
      ]);

      return NextResponse.json({ status: 201 });
    }

    if (!accountId || !categoryId) {
      return NextResponse.json({ error: "Missing account or category" }, { status: 400 });
    }

    const created = await prisma.transaction.create({
      data: {
        userId,
        type,
        amount,
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
});