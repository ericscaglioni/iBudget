import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { CategoriesPageShell } from "./_components";

const CategoriesPage = async () =>{
  const { userId } = await auth();
  if (!userId) return notFound();

  const groups = await prisma.categoryGroup.findMany({
    where: { userId },
    include: {
      categories: {
        where: { userId },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <CategoriesPageShell groups={groups} />
  );
}

export default CategoriesPage;