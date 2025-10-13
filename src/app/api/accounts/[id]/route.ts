import { prisma } from "@/lib/prisma";
import { authHandler } from "@/lib/middlewares";
import { NextResponse } from "next/server";

export const PATCH = authHandler(async ({ userId, request, params }) => {
  const resolvedParams = await params;
  const { id } = resolvedParams;
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

export const DELETE = authHandler(async ({ userId, params }) => {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Later: check for related transactions

  await prisma.account.delete({
    where: {
      id: id as string,
      userId,
    },
  });

  return NextResponse.json({ success: true });
});