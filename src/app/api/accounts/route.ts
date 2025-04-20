import { prisma } from "@/lib/prisma";
import { authHandler } from "@/lib/middlewares";
import { NextResponse } from "next/server";

export const GET = authHandler(async ({ userId }) => {
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(accounts);
});

export const POST = authHandler(async ({ userId, request }) => {
  const body = await request.json();
  const { name, type, currency, initialBalance } = body;

  const account = await prisma.account.create({
    data: {
      userId,
      name,
      type,
      currency,
      initialBalance,
    },
  });

  return NextResponse.json(account, { status: 201 });
});