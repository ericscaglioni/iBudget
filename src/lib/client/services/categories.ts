import { del, get, patch, post } from "@/lib/api/client";
import { Category } from "@prisma/client";

const categoriesPath = "/api/categories";

type CategoryPayload = Omit<Category, "id" | "userId" | "createdAt" | "updatedAt" | "isSystem">;

export const getCategories = async () => {
  return get<Category[]>(categoriesPath);
};

export const createCategory = async (data: CategoryPayload) => {
  return post<CategoryPayload, Category>(categoriesPath, data);
};

export const updateCategory = async (id: string, data: CategoryPayload) => {
  return patch<CategoryPayload, Category>(`${categoriesPath}/${id}`, data);
};

export const deleteCategory = async (id: string) => {
  return del<void>(`${categoriesPath}/${id}`);
};