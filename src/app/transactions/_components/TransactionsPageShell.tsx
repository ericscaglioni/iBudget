"use client";

import { PageShell } from "@/components";
import { useState } from "react";
import { TransactionWithDetails } from "../types";

interface Props {
  transactions: TransactionWithDetails[];
}

export const TransactionsPageShell = ({ transactions }: Props) => {
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
      <h1>test</h1>
      {/* <TransactionsTable data={transactions} />

      <TransactionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
      /> */}
    </PageShell>
  );
};