import { get, post, put } from "@/lib/api/client";
import type { BudgetData, CategoryBudgetStatus } from "@/lib/server/services/budget";

const budgetPath = "/api/budget";

export type {
  BudgetData,
  BudgetLine,
  CategoryBudgetStatus,
  ExchangeDirection,
  ExchangeLine,
} from "@/lib/server/services/budget";

export const getBudget = async (options: {
  yearMonth?: string;
  currency?: string;
  view?: "all";
} = {}) => {
  const params = new URLSearchParams();
  if (options.yearMonth) params.set("yearMonth", options.yearMonth);
  if (options.currency) params.set("currency", options.currency);
  if (options.view === "all") params.set("view", "all");
  const query = params.toString();
  return get<BudgetData>(query ? `${budgetPath}?${query}` : budgetPath);
};

export const upsertExpected = async (data: {
  yearMonth: string;
  currency: string;
  categoryId: string;
  expectedAmount: number;
}) => {
  return put<typeof data, BudgetData>(budgetPath, data);
};

export const copyPreviousMonth = async (data: {
  yearMonth: string;
  currency?: string;
  view?: "all";
  overwrite?: boolean;
}) => {
  return post<typeof data, BudgetData>(`${budgetPath}/copy`, data);
};

export const getCategoryStatus = async (query: {
  categoryId: string;
  yearMonth: string;
  currency: string;
}) => {
  const params = new URLSearchParams(query);
  return get<CategoryBudgetStatus>(`${budgetPath}/category?${params}`);
};

export const upsertExchangeExpected = async (data: {
  yearMonth: string;
  currency: string;
  direction: "in" | "out";
  expectedAmount: number;
}) => {
  return put<typeof data, BudgetData>(`${budgetPath}/exchange`, data);
};

export const getExchangeStatus = async (query: {
  yearMonth: string;
  currency: string;
  direction: "in" | "out";
}) => {
  const params = new URLSearchParams(query);
  return get<CategoryBudgetStatus>(`${budgetPath}/exchange?${params}`);
};
