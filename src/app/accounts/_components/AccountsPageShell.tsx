"use client";

import { PageShell } from "@/components";
import { Account } from "@prisma/client";
import { useState } from "react";
import { AccountsTable } from "./";
import { AccountModal } from "./AccountModal";

interface Props {
  accounts: Account[];
};

export const AccountsPageShell = ({ accounts }: Props) => {
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
      <AccountsTable data={accounts} />
      <AccountModal open={openModal} onClose={() => setOpenModal(false)} />
    </PageShell>
  );
};