"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { ComboboxOption } from "@/components/ui";
import { CategoryOption } from "@/app/transactions/types";
import { accountService, categoryService } from "@/lib/client/services";
import { showError } from "@/lib/utils/toast";

interface TransactionModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  accountOptions: ComboboxOption[];
  categoryOptions: CategoryOption[];
  transferCategoryId: string;
  /** True only until the first load finishes (the button shows a spinner meanwhile). */
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  /** Re-fetches accounts and categories so the modal never works with a stale list. */
  refreshOptions: (options?: { silent?: boolean }) => Promise<void>;
}

const TransactionModalContext = createContext<TransactionModalContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export const TransactionModalProvider = ({ children }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [accountOptions, setAccountOptions] = useState<ComboboxOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [transferCategoryId, setTransferCategoryId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const refreshOptions = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      const [accounts, categories, transferCategory] = await Promise.all([
        accountService.getAccounts(),
        categoryService.getCategories(),
        categoryService.getSystemTransferCategory(),
      ]);

      setAccountOptions(
        accounts.map((account) => ({
          label: account.name,
          value: account.id,
          currency: account.currency,
        }))
      );
      setCategoryOptions(categories);
      setTransferCategoryId(transferCategory.id);
    } catch (error) {
      console.error("Failed to load transaction modal data:", error);
      // Never fail silently: without this the + button just looks broken
      if (!silent) showError("Couldn't load your accounts and categories. Please refresh the page.");
    }
  }, []);

  const openModal = () => {
    // Wait for the first load so the lists aren't empty for a moment, but don't require existing
    // accounts or categories: a new user can create them from inside the modal.
    if (isLoading) return;
    setIsOpen(true);
    // Pick up accounts/categories created since the last load (e.g. the user's first account)
    void refreshOptions({ silent: true });
  };
  const closeModal = () => setIsOpen(false);

  return (
    <TransactionModalContext.Provider
      value={{
        isOpen,
        openModal,
        closeModal,
        accountOptions,
        categoryOptions,
        transferCategoryId,
        isLoading,
        setIsLoading,
        refreshOptions,
      }}
    >
      {children}
    </TransactionModalContext.Provider>
  );
};

export const useTransactionModal = () => {
  const context = useContext(TransactionModalContext);
  if (context === undefined) {
    throw new Error("useTransactionModal must be used within a TransactionModalProvider");
  }
  return context;
};
