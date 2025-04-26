import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { TransactionsPageShell } from "./_components";

const TransactionsPage = async () => {
  const { userId } = await auth();
  if (!userId) return notFound();

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    include: {
      account: true,
      category: true,
    },
    orderBy: { date: "desc" },
  });

  return (
    <TransactionsPageShell transactions={transactions} />
  );
}

export default TransactionsPage;