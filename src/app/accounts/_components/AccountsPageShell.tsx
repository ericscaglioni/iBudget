"use client";

import { PageShell } from "@/components";
import { Account } from "@prisma/client";
import { useState } from "react";
import { AccountsTable } from "./";
import { AccountFormModal } from "./AccountFormModal";

interface Props {
  accounts: Account[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export const AccountsPageShell = ({ accounts, totalCount, page, pageSize }: Props) => {
  const [openModal, setOpenModal] = useState(false);

  return (
    <PageShell
      title="Your Accounts"
      subtitle="See and manage all your accounts in one place."
      actionButton={{
        text: "+ New Account",
        variant: "primary",
        size: "lg",
        onClick: () => setOpenModal(true),
      }} 
    >
      <AccountsTable
        data={accounts}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
      />
      <AccountFormModal open={openModal} onClose={() => setOpenModal(false)} />
    </PageShell>
  );
};