import { prisma } from "@/lib/prisma";

export const initializeUserDefaults = async (userId: string) => {
  // Skip if user already has categories
  const existing = await prisma.category.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (existing) return;

  // 1. Clone default groups
  const defaultGroups = await prisma.categoryGroup.findMany({
    where: { userId: null },
    include: { categories: true },
  });

  for (const group of defaultGroups) {
    // Create a copy of the group for the user
    const userGroup = await prisma.categoryGroup.create({
      data: {
        name: group.name,
        userId,
      },
    });

    // Copy each category under this group
    await Promise.all(
      group.categories.map((cat) =>
        prisma.category.create({
          data: {
            name: cat.name,
            color: cat.color,
            groupId: userGroup.id,
            userId,
          },
        })
      )
    );
  }
};

export const deleteUserCategories = async (userId: string) => {
  // Delete all user-specific categories and groups
  await prisma.category.deleteMany({ where: { userId } });
  await prisma.categoryGroup.deleteMany({ where: { userId } });
}