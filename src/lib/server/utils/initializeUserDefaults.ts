import { prisma } from "@/lib/prisma";
import { ensureUserRow } from "./users";

export const initializeUserDefaults = async (userId: string) => {
  await ensureUserRow(userId);

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

/**
 * Permanently deletes everything that belongs to a user (used when their Clerk account is deleted).
 *
 * Order matters: transactions reference accounts and categories, so they go first.
 * Everything runs in one DB transaction so a failure can't leave half-deleted data.
 * Shared data (system categories with userId = null) is never touched.
 */
export const deleteUserData = async (userId: string) => {
  // Guard: an empty/undefined id must never turn into an unfiltered deleteMany
  if (typeof userId !== "string" || userId.trim() === "") {
    throw new Error("deleteUserData requires a non-empty userId");
  }

  const [transactions, accounts, categories, settings, guide, users] = await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.category.deleteMany({ where: { userId } }),
    prisma.userSettings.deleteMany({ where: { userId } }),
    prisma.userGuide.deleteMany({ where: { userId } }),
    prisma.user.deleteMany({ where: { id: userId } }),
  ]);

  return {
    transactions: transactions.count,
    accounts: accounts.count,
    categories: categories.count,
    settings: settings.count,
    guide: guide.count,
    users: users.count,
  };
};