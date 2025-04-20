import { AccountType } from "@prisma/client";

export const accountCurrencies = ["USD", "EUR", "BRL"];

export type AccountCurrency = (typeof accountCurrencies)[keyof typeof accountCurrencies];

export const accountTypes: AccountType[] = [
  "cash",
  "card",
  "current",
  "savings",
  "investment",
  "wallet",
  "other",
];