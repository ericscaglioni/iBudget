import { authHandler } from "@/lib/middlewares";
import { prisma } from "@/lib/prisma";
import { transactionService } from "@/lib/server/services";
import { NextResponse } from "next/server";

export const PATCH = authHandler(async ({ userId, request, params }) => {
  const { id } = await params ?? {};
  const body = await request.json();
  const {
    type,
    amount,
    accountId,
    categoryId,
    description,
    date,
  } = body;

  return await transactionService.updateTransaction(userId, {
    id,
    type,
    amount,
    accountId,
    categoryId,
    description,
    date
  });
});

export const DELETE = authHandler(async ({ userId, params }) => {
  const { id } = await params ?? {};

  // Later: check for related transactions

  await prisma.account.delete({
    where: {
      id: id as string,
      userId,
    },
  });

  return NextResponse.json({ success: true });
});