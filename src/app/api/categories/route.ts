import { authHandler } from "@/lib/middlewares";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const POST = authHandler(async ({ userId, request }) => {
  const body = await request.json();
  const { name, color, groupId } = body;

  const account = await prisma.category.create({
    data: {
      userId,
      name,
      color,
      groupId,
    },
  });

  return NextResponse.json(account, { status: 201 });
});