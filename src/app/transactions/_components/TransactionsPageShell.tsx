"use client";

import { PageShell } from "@/components";
import { useState } from "react";
import { TransactionWithDetails } from "../types";
import { TransactionsTable } from "./TransactionsTable";
import { ComboboxOption } from "@/components/ui";

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
  const [openModal, setOpenModal] = useState(false);

  const handleCreate = () => {
    setOpenModal(true);
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
      />

      {/* <TransactionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
      /> */}
    </PageShell>
  );
};