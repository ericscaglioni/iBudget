import { del, patch, post } from "@/lib/api/client";
import { TransactionTypeEnum } from "@/lib/constants";
import type { Transaction } from "@prisma/client";

const transactionsPath = "/api/transactions";

type TransactionPayload = Omit<
  Transaction,
  "id" | "userId" | "createdAt" | "updatedAt" | "type" | "accountId" | "categoryId"
> & {
  type: TransactionTypeEnum;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  categoryId?: string;
};

export const createTransaction = async (data: TransactionPayload) => {
  return post(transactionsPath, data);
};

export const updateTransaction = async (id: string, data: TransactionPayload) => {
  return patch(`${transactionsPath}/${id}`, data);
};

export const deleteTransaction = async (id: string) => {
  return del(`${transactionsPath}/${id}`);
};