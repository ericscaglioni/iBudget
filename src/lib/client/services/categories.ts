import { del, patch, post } from "@/lib/api/client";
import { Category } from "@prisma/client";

const categoriesPath = "/api/categories";

type CategoryPayload = Omit<Category, "id" | "userId" | "createdAt" | "updatedAt" | "isSystem">;

export const createCategory = async (data: CategoryPayload) => {
  return post(categoriesPath, data);
}

export const updateCategory = async (id: string, data: CategoryPayload) => {
  return patch(`${categoriesPath}/${id}`, data);
};

export const deleteCategory = async (id: string) => {
  return del(`${categoriesPath}/${id}`);
};