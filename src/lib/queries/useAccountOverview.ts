"use client";

import { useQuery } from "@tanstack/react-query";
import { getAccountOverview, AccountOverviewData } from "@/lib/client/services/dashboard-overview";

export const useAccountOverview = () => {
  return useQuery<AccountOverviewData>({
    queryKey: ["accountOverview"],
    queryFn: getAccountOverview,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

