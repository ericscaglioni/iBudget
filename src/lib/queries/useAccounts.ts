"use client";

import { useQuery } from "@tanstack/react-query";
import { getAccounts } from "@/lib/client/services/accounts";
import { Account } from "@prisma/client";

export const useAccounts = () => {
  return useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: getAccounts,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

