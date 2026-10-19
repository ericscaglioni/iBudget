"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { ComboboxOption } from "@/components/ui";
import { CategoryOption } from "@/app/transactions/types";

interface TransactionModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  accountOptions: ComboboxOption[];
  categoryOptions: CategoryOption[];
  transferCategoryId: string;
  isLoading: boolean;
  setAccountOptions: (options: ComboboxOption[]) => void;
  setCategoryOptions: (options: CategoryOption[]) => void;
  setTransferCategoryId: (id: string) => void;
  setIsLoading: (loading: boolean) => void;
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

  const openModal = () => {
    // Only open modal if data is loaded
    if (!isLoading && accountOptions.length > 0 && categoryOptions.length > 0) {
      setIsOpen(true);
    }
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
        setAccountOptions,
        setCategoryOptions,
        setTransferCategoryId,
        setIsLoading,
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
