import { del, get, patch, post } from "@/lib/api/client";
import type { Account } from "@prisma/client";

const accountsPath = "/api/accounts";

type AccountPayload = Omit<Account, "id" | "userId" | "createdAt" | "updatedAt">;

export const getAccounts = async () => {
  return get<Account[]>(accountsPath);
};

export const createAccount = async (data: AccountPayload) => {
  return post<AccountPayload, Account>(accountsPath, data);
};

export const updateAccount = async (id: string, data: AccountPayload) => {
  return patch<AccountPayload, Account>(`${accountsPath}/${id}`, data);
};

export const deleteAccount = async (id: string) => {
  return del<void>(`${accountsPath}/${id}`);
};