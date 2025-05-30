"use client";

import { PageShell } from "@/components";
import { ComboboxOption, DeleteModal } from "@/components/ui";
import { transactionService } from "@/lib/client/services";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CategoryOption, TransactionWithDetails } from "../types";
import { TransactionFormModal } from "./TransactionFormModal";
import { TransactionsTable } from "./TransactionsTable";

interface Props {
  transactions: TransactionWithDetails[];
  totalCount: number;
  page: number;
  pageSize: number;
  categoryOptions: CategoryOption[];
  accountOptions: ComboboxOption[];
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

    await transactionService.deleteTransaction(selectedTransaction.id);
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
        categoryOptions={categoryOptions.map((c) => ({ label: c.name, value: c.id }))}
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

      <DeleteModal
        open={openDeleteModal}
        onClose={handleClose}
        itemDescription={selectedTransaction?.description ?? ""}
        onDelete={confirmDelete}
        modelName="Transaction"
      />
    </PageShell>
  );
};