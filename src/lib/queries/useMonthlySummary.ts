"use client";

import { useQuery } from "@tanstack/react-query";
import { getMonthlySummary, MonthlySummaryData } from "@/lib/client/services/dashboard-monthly";

export const useMonthlySummary = (month: string) => {
  return useQuery<MonthlySummaryData>({
    queryKey: ["monthlySummary", month],
    queryFn: () => getMonthlySummary(month),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!month, // Only fetch if month is provided
  });
};

