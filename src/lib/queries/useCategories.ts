"use client";

import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/lib/client/services/categories";
import { Category } from "@prisma/client";

export const useCategories = () => {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

