import { del, patch, post } from "@/lib/api/client";
import type { Account } from "@prisma/client";

const accountsPath = "/api/accounts";

type AccountPayload = Omit<Account, "id" | "userId" | "createdAt" | "updatedAt">;

export const createAccount = async (data: AccountPayload) => {
  return post(accountsPath, data);
};

export const updateAccount = async (id: string, data: AccountPayload) => {
  return patch(`${accountsPath}/${id}`, data);
};

export const deleteAccount = async (id: string) => {
  return del(`${accountsPath}/${id}`);
};