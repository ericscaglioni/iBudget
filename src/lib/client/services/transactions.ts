import { del, get, patch, post } from "@/lib/api/client";
import { TransactionTypeEnum } from "@/lib/constants";
import type { Transaction } from "@prisma/client";

const transactionsPath = "/api/transactions";

type TransactionPayload = Omit<
  Transaction,
  "id" | "userId" | "createdAt" | "updatedAt" | "type" | "accountId" | "categoryId" | "transferId" | "isRecurring" | "frequency" | "endsAt"
> & {
  type: TransactionTypeEnum;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  categoryId?: string;
  transferId?: string;
  isRecurring?: boolean;
  frequency?: string;
  endsAt?: string | Date;
};

export const getTransactions = async () => {
  return get<Transaction[]>(transactionsPath);
};

export const createTransaction = async (data: TransactionPayload) => {
  return post<TransactionPayload, Transaction>(transactionsPath, data);
};

export const updateTransaction = async (id: string, data: TransactionPayload) => {
  return patch<TransactionPayload, Transaction>(`${transactionsPath}/${id}`, data);
};

export const deleteTransaction = async (id: string) => {
  return del<void>(`${transactionsPath}/${id}`);
};

export const getTransferTransactionByTransferId = async (transferId: string) => {
  return get<Transaction>(`${transactionsPath}/transfer/${transferId}`);
};