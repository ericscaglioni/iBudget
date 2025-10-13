import { prisma } from "@/lib/prisma";

export const initializeUserDefaults = async (userId: string) => {
  // Skip if user already has categories
  const existing = await prisma.category.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (existing) return;

  // Clone default categories
  const defaultCategories = await prisma.category.findMany({
    where: { userId: null, name: { not: "Transfer" } }, // Exclude Transfer category
  });

  // Copy each category for the user
  await Promise.all(
    defaultCategories.map(({ id: _id, ...cat }) => // eslint-disable-line @typescript-eslint/no-unused-vars
      prisma.category.create({
        data: {
          ...cat,
          userId,
        },
      })
    )
  );
};

export const deleteUserCategories = async (userId: string) => {
  // Delete all user-specific categories
  await prisma.category.deleteMany({ where: { userId } });
}