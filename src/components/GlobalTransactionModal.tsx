"use client";

import { TransactionFormModal } from "@/app/transactions/_components/TransactionFormModal";
import { useTransactionModal } from "@/lib/providers/TransactionModalProvider";

export const GlobalTransactionModal = () => {
  const { isOpen, closeModal, accountOptions, categoryOptions, transferCategoryId } = useTransactionModal();

  return (
    <TransactionFormModal
      open={isOpen}
      onClose={closeModal}
      accountOptions={accountOptions}
      categoryOptions={categoryOptions}
      transferCategoryId={transferCategoryId}
    />
  );
};
