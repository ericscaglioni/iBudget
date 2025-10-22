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
  setAccountOptions: (options: ComboboxOption[]) => void;
  setCategoryOptions: (options: CategoryOption[]) => void;
  setTransferCategoryId: (id: string) => void;
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

  const openModal = () => setIsOpen(true);
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
        setAccountOptions,
        setCategoryOptions,
        setTransferCategoryId,
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
