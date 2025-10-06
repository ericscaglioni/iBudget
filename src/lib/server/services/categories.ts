import { prisma } from "@/lib/prisma";
import { QueryParams } from "@/lib/utils/parse-query";
import { Category } from "@prisma/client";
import { NotFoundError, ValidationError } from "@/lib/errors/AppError";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const listCategoryGroups = async () => {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const groups = await prisma.categoryGroup.findMany({
    where: { userId, isSystem: false },
    include: {
      categories: {
        where: { userId },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return { groups };
};

export const getCategoriesByUser = async (userId: string, props: QueryParams) => {
  const { page, pageSize, sortField = "createdAt", sortOrder = "desc" } = props;

  const [categories, total] = await prisma.$transaction([
    prisma.category.findMany({
      where: { userId },
      include: {
        group: true,
      },
      orderBy: {
        [sortField]: sortOrder,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.category.count({ where: { userId } }),
  ]);

  return { categories, total };
};

export const getUserCategories = async (userId: string) => {
  const categories = await prisma.category.findMany({
    where: { userId, isSystem: false },
    select: { id: true, name: true, type: true },
    orderBy: { name: "asc" },
  });

  return categories;
};

export const createCategory = async (userId: string, data: Omit<Category, "id" | "userId" | "createdAt" | "updatedAt" | "isSystem">) => {
  const { name, color, groupId } = data;

  if (!name || !color || !groupId) {
    throw new ValidationError('Missing required category data');
  }

  // Verify group exists
  const group = await prisma.categoryGroup.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw new NotFoundError('Category group');
  }

  const created = await prisma.category.create({
    data: {
      userId,
      name,
      color,
      groupId,
      isSystem: false,
    },
  });

  return created;
};

export const updateCategory = async (userId: string, id: string, data: Partial<Category>) => {
  const { name, color, groupId } = data;

  const existing = await prisma.category.findUnique({
    where: { id, userId },
  });

  if (!existing) {
    throw new NotFoundError('Category');
  }

  if (existing.isSystem) {
    throw new ValidationError('Cannot modify system categories');
  }

  // If groupId is being updated, verify the new group exists
  if (groupId && groupId !== existing.groupId) {
    const group = await prisma.categoryGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundError('Category group');
    }
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      name,
      color,
      groupId,
    },
  });

  return updated;
};

export const deleteCategory = async (userId: string, id: string) => {
  const category = await prisma.category.findUnique({
    where: { id, userId },
  });

  if (!category) {
    throw new NotFoundError('Category');
  }

  if (category.isSystem) {
    throw new ValidationError('Cannot delete system categories');
  }

  // Check if category has any transactions
  const transactionCount = await prisma.transaction.count({
    where: { categoryId: id },
  });

  if (transactionCount > 0) {
    throw new ValidationError('Cannot delete category with existing transactions');
  }

  await prisma.category.delete({
    where: { id },
  });

  return { message: 'Category deleted successfully' };
};