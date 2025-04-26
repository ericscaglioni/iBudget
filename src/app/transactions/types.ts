import { Account, Category, Transaction } from "@prisma/client";

export interface TransactionWithDetails extends Transaction {
  account: Pick<Account, "id" | "name">;
  category: Pick<Category, "id" | "name" | "color"> | null;
}