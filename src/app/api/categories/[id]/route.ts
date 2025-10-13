import { prisma } from "@/lib/prisma";
import { authHandler } from "@/lib/middlewares";
import { NextResponse } from "next/server";

export const PATCH = authHandler(async ({ userId, request, params }) => {
  const { id } = await params ?? {};
  const body = await request.json();
  const { name, color, type } = body;

  const updated = await prisma.category.update({
    where: {
      id: id as string,
      userId,
    },
    data: {
      name,
      color,
      type,
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = authHandler(async ({ userId, params }) => {
  const { id } = await params ?? {};

  // TODO check for related transactions

  await prisma.category.delete({
    where: {
      id: id as string,
      userId,
    },
  });

  return NextResponse.json({ success: true });
});