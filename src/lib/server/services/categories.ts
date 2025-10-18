import { NotFoundError, ValidationError } from "@/lib/errors/AppError";
import { prisma } from "@/lib/prisma";
import { QueryParams } from "@/lib/utils/parse-query";
import { sanitizeFilterInput } from "@/lib/utils/sanitize";
import { Category, CategoryType, Prisma } from "@prisma/client";

export const getCategoriesByUser = async (userId: string, props: QueryParams) => {
  const { page, pageSize, sortField = "name", sortOrder = "asc", filters } = props;
  const sanitizedName = filters.name ? sanitizeFilterInput(filters.name) : undefined;

  const where = {
    userId,
    ...(filters.type && { type: filters.type as CategoryType }),
    ...(sanitizedName && {
      name: {
        contains: sanitizedName,
      },
    }),
  };

  const [categories, total] = await prisma.$transaction([
    prisma.category.findMany({
      where,
      orderBy: {
        [sortField]: sortOrder,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.category.count({ where }),
  ]);

  return { categories, total };
};

export const getUserCategories = async (userId: string) => {
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return categories;
};

export const getSystemTransferCategory = async () => {
  const category = await prisma.category.findFirst({
    where: {
      userId: null,
      name: "Transfer"
    }
  });

  if (!category) {
    throw new Error("Transfer category not found");
  }

  return category;
};

export const createCategory = async (userId: string, data: Omit<Category, "id" | "userId" | "createdAt" | "updatedAt">) => {
  const { name, color, type } = data;

  if (!name || !color || !type) {
    throw new ValidationError('Missing required category data');
  }

  const created = await prisma.category.create({
    data: {
      userId,
      name,
      color,
      type,
    },
  });

  return created;
};

export const updateCategory = async (userId: string, id: string, data: Partial<Category>) => {
  const { name, color, type } = data;

  const existing = await prisma.category.findUnique({
    where: { id, userId },
  });

  if (!existing) {
    throw new NotFoundError('Category');
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      name,
      color,
      type,
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