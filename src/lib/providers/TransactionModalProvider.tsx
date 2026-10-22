"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ComboboxOption } from "@/components/ui";
import { CategoryOption } from "@/app/transactions/types";
import { accountService, categoryService } from "@/lib/client/services";
import { showError } from "@/lib/utils/toast";

interface TransactionModalContextType {
  isOpen: boolean;
  /** Opens the transaction form. A user with no account is sent to create one first. */
  openModal: () => void;
  closeModal: () => void;
  accountOptions: ComboboxOption[];
  categoryOptions: CategoryOption[];
  transferCategoryId: string;
  /** True only until the first load finishes (the button shows a spinner meanwhile). */
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  /**
   * Re-fetches accounts and categories so the modal never works with a stale list.
   * Resolves to the number of accounts, or null if loading failed.
   */
  refreshOptions: (options?: { silent?: boolean }) => Promise<number | null>;
}

const TransactionModalContext = createContext<TransactionModalContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export const TransactionModalProvider = ({ children }: Props) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [accountOptions, setAccountOptions] = useState<ComboboxOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [transferCategoryId, setTransferCategoryId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const refreshOptions = useCallback(async ({ silent = false }: { silent?: boolean } = {}): Promise<number | null> => {
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
      return accounts.length;
    } catch (error) {
      console.error("Failed to load transaction modal data:", error);
      // Never fail silently: without this the + button just looks broken
      if (!silent) showError("Couldn't load your accounts and categories. Please refresh the page.");
      return null;
    }
  }, []);

  const openModal = async () => {
    // Wait for the first load so the lists aren't empty for a moment
    if (isLoading) return;

    if (accountOptions.length === 0) {
      // The list may be stale (e.g. the first account was just created), so check before redirecting
      const accountCount = await refreshOptions();
      if (accountCount === null) return;

      if (accountCount === 0) {
        // A transaction needs an account: send new users to create one instead of a dead end
        router.push("/accounts?new=1");
        return;
      }
      setIsOpen(true);
      return;
    }

    setIsOpen(true);
    // Pick up accounts/categories created since the last load
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
