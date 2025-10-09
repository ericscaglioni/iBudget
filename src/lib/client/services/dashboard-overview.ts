import { get } from "@/lib/api/client";

const overviewPath = "/api/dashboard/overview";

interface AccountBalance {
  accountId: string;
  name: string;
  currency: string;
  balance: number;
}

interface SixMonthSummary {
  month: string;
  income: number;
  expenses: number;
}

export interface AccountOverviewData {
  accountBalances: AccountBalance[];
  sixMonthSummary: SixMonthSummary[];
}

export const getAccountOverview = async () => {
  return get<AccountOverviewData>(overviewPath);
};

