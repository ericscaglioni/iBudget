import { prisma } from "@/lib/prisma";
import { authHandler } from "@/lib/middlewares";
import { NextResponse } from "next/server";

export const PATCH = authHandler(async ({ userId, request, params }) => {
  const { id } = await params ?? {};
  const body = await request.json();
  const { name, type, currency, initialBalance } = body;

  const updated = await prisma.account.update({
    where: {
      id: id as string,
      userId,
    },
    data: {
      name,
      type,
      currency,
      initialBalance,
    },
  });

  return NextResponse.json(updated);
});