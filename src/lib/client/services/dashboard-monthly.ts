import { get } from "@/lib/api/client";

const monthlyPath = "/api/dashboard/monthly";

interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  color: string;
}

export interface MonthlySummaryData {
  income: number;
  expenses: number;
  net: number;
  categoryBreakdown: CategoryBreakdown[];
}

export const getMonthlySummary = async (month: string) => {
  const url = `${monthlyPath}?month=${month}`;
  return get<MonthlySummaryData>(url);
};

