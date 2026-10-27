import { del, get, patch, post, put } from "@/lib/api/client";
import type { Account } from "@prisma/client";

const accountsPath = "/api/accounts";

// Client-safe account payload (Decimal fields converted to numbers)
type AccountPayload = Omit<Account, "id" | "userId" | "createdAt" | "updatedAt" | "initialBalance" | "sortOrder"> & {
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

/** Saves the order of the accounts: the first id is shown first. */
export const reorderAccounts = async (accountIds: string[]) => {
  return put<{ accountIds: string[] }, { message: string }>(`${accountsPath}/order`, { accountIds });
};

export const deleteAccount = async (id: string) => {
  return del<void>(`${accountsPath}/${id}`);
};