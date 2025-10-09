import { get } from "@/lib/api/client";

const dashboardPath = "/api/dashboard";

interface AccountBalance {
  accountId: string;
  name: string;
  balance: number;
  currency: string;
}

interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  color: string;
}

interface MonthlyTotal {
  month: string;
  income: number;
  expenses: number;
  net: number;
  categoryBreakdown: CategoryBreakdown[];
}

export interface DashboardData {
  totalBalance: number;
  accountBalances: AccountBalance[];
  monthlyTotals: MonthlyTotal[];
}

interface GetDashboardOptions {
  includeCurrentMonth?: boolean;
  includePreviousMonth?: boolean;
  month?: string; // YYYY-MM format for filtering specific month
}

export const getDashboardData = async (options?: GetDashboardOptions) => {
  const params = new URLSearchParams();
  
  if (options?.includeCurrentMonth !== undefined) {
    params.append("includeCurrentMonth", String(options.includeCurrentMonth));
  }
  
  if (options?.includePreviousMonth !== undefined) {
    params.append("includePreviousMonth", String(options.includePreviousMonth));
  }

  if (options?.month) {
    params.append("month", options.month);
  }

  const url = params.toString() ? `${dashboardPath}?${params}` : dashboardPath;
  return get<DashboardData>(url);
};

