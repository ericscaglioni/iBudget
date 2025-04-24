import { post } from "@/lib/api/server";

export const initUser = async (userId: string) => {
  return post(`/api/users/${userId}`, { type: "init" });
}

export const deleteUser = async (userId: string) => {
  return post(`/api/users/${userId}`, { type: "delete" });
}