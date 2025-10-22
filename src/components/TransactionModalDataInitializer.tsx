"use client";

import { useEffect } from "react";
import { useTransactionModal } from "@/lib/providers/TransactionModalProvider";
import { accountService, categoryService } from "@/lib/client/services";

export const TransactionModalDataInitializer = () => {
  const { setAccountOptions, setCategoryOptions, setTransferCategoryId, setIsLoading } = useTransactionModal();

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch accounts and categories
        const [accounts, categories, transferCategory] = await Promise.all([
          accountService.getAccounts(),
          categoryService.getCategories(),
          categoryService.getSystemTransferCategory(),
        ]);

        // Transform data for the modal
        const accountOptions = accounts.map((account) => ({
          label: account.name,
          value: account.id,
        }));

        setAccountOptions(accountOptions);
        setCategoryOptions(categories);
        setTransferCategoryId(transferCategory.id);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize transaction modal data:", error);
        setIsLoading(false);
      }
    };

    initializeData();
  }, [setAccountOptions, setCategoryOptions, setTransferCategoryId, setIsLoading]);

  return null;
};
