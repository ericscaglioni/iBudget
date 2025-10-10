"use client";

import { PageShell } from "@/components";
import { ComboboxOption, DeleteModal } from "@/components/ui";
import { transactionService } from "@/lib/client/services";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { CategoryOption, TransactionWithDetails } from "../types";
import { RecurringDeleteModal } from "./RecurringDeleteModal";
import { TransactionFormModal } from "./TransactionFormModal";
import { TransactionsTable } from "./TransactionsTable";
import { TransactionFilters } from "./TransactionFilters";

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
  const searchParams = useSearchParams();
  const [_, startTransition] = useTransition();
  
  const [openTransactionModal, setOpenTransactionModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openRecurringDeleteModal, setOpenRecurringDeleteModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null);

  const handleClose = () => {
    setOpenTransactionModal(false);
    setOpenDeleteModal(false);
    setOpenRecurringDeleteModal(false);
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
    
    // Check if transaction is recurring
    if (transaction.isRecurring && transaction.recurringId) {
      setOpenRecurringDeleteModal(true);
    } else {
      setOpenDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    if (!selectedTransaction) return;

    await transactionService.deleteTransaction(selectedTransaction.id);
    router.refresh();
    setSelectedTransaction(null);
  };

  const confirmRecurringDelete = async (scope: 'one' | 'future') => {
    if (!selectedTransaction) return;

    // Only pass 'future' scope when deleting future transactions
    // For 'one', don't pass any scope parameter (normal single delete)
    if (scope === 'future') {
      await transactionService.deleteTransaction(selectedTransaction.id, 'future');
    } else {
      await transactionService.deleteTransaction(selectedTransaction.id);
    }
    
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
      <TransactionFilters
        categoryOptions={categoryOptions.map((c) => ({ label: c.name, value: c.id, type: c.type }))}
        accountOptions={accountOptions}
        searchParams={searchParams}
        basePath="/transactions"
        startTransition={startTransition}
      />

      <TransactionsTable
        data={transactions}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        accountOptions={accountOptions}
        categoryOptions={categoryOptions.map((c) => ({ label: c.name, value: c.id, type: c.type }))}
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

      <RecurringDeleteModal
        open={openRecurringDeleteModal}
        onClose={handleClose}
        itemDescription={selectedTransaction?.description ?? ""}
        onDelete={confirmRecurringDelete}
      />
    </PageShell>
  );
};