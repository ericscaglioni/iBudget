import { del, patch, post } from "@/lib/api/client";

export const createCategory = async (data: {
  name: string;
  color: string;
  groupId: string;
}) => {
  return post("/api/categories", data);
}

export const updateCategory = async (
  id: string,
  data: {
    name: string;
    color: string;
    groupId: string;
  }
) => {
  return patch(`/api/categories/${id}`, data);
};

export const deleteCategory = async (id: string) => {
  return del(`/api/categories/${id}`);
};