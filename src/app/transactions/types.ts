import { Account, Category, Transaction } from "@prisma/client";

export interface TransactionWithDetails extends Transaction {
  account: Pick<Account, "id" | "name" | "currency">;
  category: Pick<Category, "id" | "name" | "color"> | null;
}

export type CategoryOption = Pick<Category, "id" | "name" | "type">;