import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const getAccounts = async () => {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  return await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};