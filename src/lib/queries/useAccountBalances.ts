"use client";

import { useQuery } from "@tanstack/react-query";
import { getAccountBalances, AccountBalancesData } from "@/lib/client/services/dashboard-accounts";

export const useAccountBalances = () => {
  return useQuery<AccountBalancesData>({
    queryKey: ["accountBalances"],
    queryFn: getAccountBalances,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

