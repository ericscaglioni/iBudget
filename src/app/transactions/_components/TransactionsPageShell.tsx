"use client";

import { PageShell } from "@/components";
import { ComboboxOption, ConfirmationModal } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TransactionWithDetails } from "../types";
import { TransactionFormModal } from "./TransactionFormModal";
import { TransactionsTable } from "./TransactionsTable";

interface Props {
  transactions: TransactionWithDetails[];
  totalCount: number;
  page: number;
  pageSize: number;
  accountOptions: ComboboxOption[];
  categoryOptions: ComboboxOption[];
}

export const TransactionsPageShell = ({
  transactions,
  totalCount,
  page,
  pageSize,
  accountOptions,
  categoryOptions,
}: Props) => {
  const router = useRouter();
  
  const [openTransactionModal, setOpenTransactionModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null);

  const handleClose = () => {
    setOpenTransactionModal(false);
    setOpenDeleteModal(false);
    setSelectedTransaction(null);
  };

  const handleCreate = () => {
    setSelectedTransaction(null);
    setOpenTransactionModal(true);
  };

  const handleEdit = (transaction: TransactionWithDetails) => {
    setSelectedTransaction(transaction);
    setOpenTransactionModal(true);
  };

  const handleDelete = (transaction: TransactionWithDetails) => {
    setSelectedTransaction(transaction);
    setOpenDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedTransaction) return;

    // await transactionService.deleteTransaction(selectedTransaction.id);
    router.refresh();
    setSelectedTransaction(null);
  };

  return (
    <PageShell
      title="Transactions"
      subtitle="Manage your incomes, expenses, and transfers."
      actionButton={{
        text: "+ New Transaction",
        variant: "primary",
        size: "lg",
        onClick: handleCreate,
      }}
    >
      <TransactionsTable
        data={transactions}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        accountOptions={accountOptions}
        categoryOptions={categoryOptions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TransactionFormModal
        open={openTransactionModal}
        onClose={handleClose}
        accountOptions={accountOptions}
        categoryOptions={categoryOptions}
        transaction={selectedTransaction ?? undefined}
      />

      <ConfirmationModal
        open={openDeleteModal}
        onClose={handleClose}
        title="Delete Transaction"
        description={`Are you sure you want to delete this transaction: ${selectedTransaction?.description}? This action cannot be undone.`}
        onConfirm={confirmDelete}
      />
    </PageShell>
  );
};