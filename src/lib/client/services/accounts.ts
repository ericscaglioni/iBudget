import { del, get, patch, post } from "@/lib/api/client";
import type { Account } from "@prisma/client";

const accountsPath = "/api/accounts";

// Client-safe account payload (Decimal fields converted to numbers)
type AccountPayload = Omit<Account, "id" | "userId" | "createdAt" | "updatedAt" | "initialBalance"> & {
  initialBalance: number;
};

export const getAccounts = async () => {
  const response = await get<{ accounts: Account[]; total: number }>(accountsPath);
  return response.accounts;
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