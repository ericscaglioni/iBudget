import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const listCategoryGroups = async () => {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  return prisma.categoryGroup.findMany({
    where: { userId, isSystem: false },
    include: {
      categories: {
        where: { userId },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
};

export const getUserCategories = async (userId: string) => {
  return prisma.category.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}