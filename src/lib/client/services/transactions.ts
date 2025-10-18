import { del, get, patch, post } from "@/lib/api/client";
import { TransactionTypeEnum } from "@/lib/constants";
import type { Transaction } from "@prisma/client";

const transactionsPath = "/api/transactions";

type TransactionPayload = Omit<
  Transaction,
  "id" | "userId" | "createdAt" | "updatedAt" | "type" | "accountId" | "categoryId" | "transferId" | "isRecurring" | "frequency" | "endsAt" | "recurringId" | "amount"
> & {
  type: TransactionTypeEnum;
  amount: number; // Client-safe: Decimal converted to number
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  categoryId?: string;
  transferId?: string;
  isRecurring?: boolean;
  frequency?: string;
  endsAt?: string | Date;
  updateScope?: 'one' | 'future';
};

export const getTransactions = async () => {
  return get<Transaction[]>(transactionsPath);
};

export const createTransaction = async (data: TransactionPayload) => {
  return post<TransactionPayload, Transaction>(transactionsPath, data);
};

export const updateTransaction = async (id: string, data: TransactionPayload, updateScope?: 'one' | 'future') => {
  const payload = {
    ...data,
    updateScope: updateScope || data.updateScope,
  };
  return patch<TransactionPayload, Transaction>(`${transactionsPath}/${id}`, payload);
};

export const deleteTransaction = async (id: string, scope?: 'future') => {
  const url = scope === 'future' 
    ? `${transactionsPath}/${id}?scope=future` 
    : `${transactionsPath}/${id}`;
  return del<void>(url);
};

export const getTransferTransactionByTransferId = async (transferId: string) => {
  return get<Transaction>(`${transactionsPath}/transfer/${transferId}`);
};