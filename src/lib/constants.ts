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

/** What the dashboard opens on when the user holds more than one currency. */
export const OPEN_DASHBOARD_ON = ["home", "all"] as const;
export type OpenDashboardOn = (typeof OPEN_DASHBOARD_ON)[number];

/** Appearance. New users start on light; system follows the OS after they pick it. */
export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

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
    color: "#2F9E6B", // income token
    icon: "arrowUp",
  },
  [TransactionTypeEnum.expense]: {
    label: "Expense",
    color: "#C2413B", // expense token
    icon: "arrowDown",
  },
  [TransactionTypeEnum.transfer]: {
    label: "Transfer",
    color: "#6B726E", // muted — transfers are not a third money colour
    icon: "arrowLoop",
  },
};

// Matches the database column (VARCHAR(191)); longer text would be rejected by MySQL
export const DESCRIPTION_MAX_LENGTH = 191;
