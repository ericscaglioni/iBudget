"use client";

import { PageShell } from "@/components";
import { ComboboxOption, DeleteModal, EmptyState } from "@/components/ui";
import { transactionService } from "@/lib/client/services";
import { hasActiveFilters } from "@/lib/utils/has-active-filters";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { CategoryOption, TransactionWithDetails } from "../types";
import { RecurringDeleteModal } from "./RecurringDeleteModal";
import { TransactionFormModal } from "./TransactionFormModal";
import { TransactionsTable } from "./TransactionsTable";
import { TransactionFilters } from "./TransactionFilters";
import { TransactionTotals, type TransactionTotalsRow } from "./TransactionTotals";

interface Props {
  transactions: TransactionWithDetails[];
  totalCount: number;
  page: number;
  pageSize: number;
  categoryOptions: CategoryOption[];
  accountOptions: ComboboxOption[];
  transferCategoryId: string;
  totals: TransactionTotalsRow[];
  preferredCurrency?: string;
}

export const TransactionsPageShell = ({
  transactions,
  totalCount,
  page,
  pageSize,
  accountOptions,
  categoryOptions,
  transferCategoryId,
  totals,
  preferredCurrency,
}: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFiltering, startTransition] = useTransition();
  
  const [openTransactionModal, setOpenTransactionModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openRecurringDeleteModal, setOpenRecurringDeleteModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null);

  const hasNoTransactionsYet = totalCount === 0 && !hasActiveFilters(searchParams);

  const handleClose = () => {
    setOpenTransactionModal(false);
    setOpenDeleteModal(false);
    setOpenRecurringDeleteModal(false);
    setSelectedTransaction(null);
  };

  const handleCreate = () => {
    // A transaction needs an account: send new users to create one first
    if (accountOptions.length === 0) {
      router.push("/accounts?new=1");
      return;
    }

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
      {hasNoTransactionsYet ? (
        <EmptyState
          title="No transactions yet"
          description={
            accountOptions.length === 0
              ? "Transactions are recorded against an account, so create your first account to get started."
              : "Record your first expense, income or transfer. You can also use the + button at the bottom right, from any page."
          }
          action={{
            label: accountOptions.length === 0 ? "Create your first account" : "Add your first transaction",
            onClick: handleCreate,
          }}
        />
      ) : (
        <>
          <TransactionFilters
            categoryOptions={categoryOptions.map((c) => ({ label: c.name, value: c.id, type: c.type }))}
            accountOptions={accountOptions}
            searchParams={searchParams}
            basePath="/transactions"
            startTransition={startTransition}
          />

          <TransactionTotals
            totals={totals}
            isPending={isFiltering}
            preferredCurrency={preferredCurrency}
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
            isFiltering={isFiltering}
          />
        </>
      )}

      <TransactionFormModal
        open={openTransactionModal}
        onClose={handleClose}
        accountOptions={accountOptions}
        categoryOptions={categoryOptions}
        transaction={selectedTransaction ?? undefined}
        transferCategoryId={transferCategoryId}
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