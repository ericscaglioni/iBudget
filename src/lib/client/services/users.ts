import { post } from "@/lib/api/client";

type InitUserResponse = {
  message: string;
};

export const initUser = async (userId: string) => {
  return post<{ type: "init" }, InitUserResponse>(`/api/users/${userId}`, { type: "init" });
};

export const deleteUser = async (userId: string) => {
  return post<{ type: "delete" }, void>(`/api/users/${userId}`, { type: "delete" });
};