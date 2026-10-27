import { IconType } from "@/components/ui";
import { AccountType } from "@prisma/client";

// Currencies a user can hold accounts in (and pick as their default).
export const accountCurrencies = [
  "USD", "EUR", "BRL", "GBP", "CAD", "AUD", "NZD", "CHF",
  "MXN", "COP", "ARS", "CLP", "PEN", "UYU",
  "THB", "IDR", "VND", "PHP", "MYR", "SGD", "JPY", "KRW", "INR", "CNY",
  "TRY", "AED", "ZAR", "MAD",
  "PLN", "CZK", "HUF", "RON", "SEK", "NOK", "DKK",
];

export const DEFAULT_BASE_CURRENCY = "USD";

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

// Matches the database column (VARCHAR(191)); longer text would be rejected by MySQL
export const DESCRIPTION_MAX_LENGTH = 191;
