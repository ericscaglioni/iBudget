import { del, get, patch, post } from "@/lib/api/client";
import { TransactionTypeEnum } from "@/lib/constants";
import type { Transaction } from "@prisma/client";

const transactionsPath = "/api/transactions";

type TransactionPayload = Omit<
  Transaction,
  "id" | "userId" | "createdAt" | "updatedAt" | "type" | "accountId" | "categoryId" | "transferId"
> & {
  type: TransactionTypeEnum;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  categoryId?: string;
  transferId?: string;
};

export const createTransaction = async (data: TransactionPayload) => {
  return post(transactionsPath, data);
};

export const updateTransaction = async (id: string, data: TransactionPayload) => {
  if (data.type === TransactionTypeEnum.transfer) {
    return patch(`${transactionsPath}/transfer/${id}`, data);
  } else {
    return patch(`${transactionsPath}/${id}`, data);
  }
};

export const deleteTransaction = async (id: string) => {
  return del(`${transactionsPath}/${id}`);
};

export const getTransferTransactionByTransferId = async (transferId: string) => {
  return get<Transaction>(`${transactionsPath}/transfer/${transferId}`);
};