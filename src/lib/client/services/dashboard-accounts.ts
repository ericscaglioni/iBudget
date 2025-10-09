import { get } from "@/lib/api/client";

const accountsPath = "/api/dashboard/accounts";

interface AccountBalance {
  accountId: string;
  name: string;
  currency: string;
  balance: number;
}

export interface AccountBalancesData {
  totalBalanceByCurrency: Record<string, number>;
  accountBalances: AccountBalance[];
}

export const getAccountBalances = async () => {
  return get<AccountBalancesData>(accountsPath);
};

