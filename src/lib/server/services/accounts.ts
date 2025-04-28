import { prisma } from "@/lib/prisma";
import { QueryParams } from "@/lib/utils/parse-query";
import { auth } from "@clerk/nextjs/server";
import { AccountType } from "@prisma/client";
import { redirect } from "next/navigation";

export const listAccounts = async (props: QueryParams) => {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const { page, pageSize, sortField, sortOrder, filters } = props;
  const where = {
    userId,
    ...(filters.type && { type: filters.type as AccountType }),
    ...(filters.currency && { currency: filters.currency.toString() }),
  };

  return await prisma.$transaction([
    prisma.account.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.account.count({ where }),
  ])
};

export const getUserAccounts = async (userId: string) => {
  return prisma.account.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}