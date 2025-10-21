import { IconType } from "@/components/ui";
import { AccountType } from "@prisma/client";

export const accountCurrencies = ["USD", "EUR", "BRL"];

export type AccountCurrency = (typeof accountCurrencies)[keyof typeof accountCurrencies];

export const accountTypes: AccountType[] = [
  "cash",
  "card",
  "checking",
  "savings",
  "investment",
  "wallet",
  "other",
];

export enum TransactionTypeEnum {
  expense = "expense",
  income = "income",
  transfer = "transfer",
};

type TransactionConfigType = Record<TransactionTypeEnum, { label: string; color: string, icon: IconType }>

export const TRANSACTION_TYPE_CONFIG: TransactionConfigType = {
  [TransactionTypeEnum.income]: {
    label: "Income",
    color: "#10B981", // green
    icon: "arrowUp",
  },
  [TransactionTypeEnum.expense]: {
    label: "Expense",
    color: "#EF4444", // red
    icon: "arrowDown",
  },
  [TransactionTypeEnum.transfer]: {
    label: "Transfer",
    color: "#3B82F6", // blue
    icon: "arrowLoop",
  },
};