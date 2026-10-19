"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useTransactionModal } from "@/lib/providers/TransactionModalProvider";
import { accountService, categoryService } from "@/lib/client/services";

export const TransactionModalDataInitializer = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const { setAccountOptions, setCategoryOptions, setTransferCategoryId, setIsLoading } = useTransactionModal();

  useEffect(() => {
    // The root layout also renders on /login, where the API routes redirect to HTML.
    // Wait for Clerk, and only fetch once there is a session (re-runs after sign in).
    if (!isLoaded || !isSignedIn) return;

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
          currency: account.currency,
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
  }, [isLoaded, isSignedIn, setAccountOptions, setCategoryOptions, setTransferCategoryId, setIsLoading]);

  return null;
};
