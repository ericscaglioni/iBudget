"use client";

import { PageShell } from "@/components";
import { accountService } from "@/lib/client/services";
import { DeleteModal } from "@/components/ui";
import { Account } from "@prisma/client";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const [openAccountModal, setOpenAccountModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const handleClose = () => {
    setOpenAccountModal(false);
    setOpenDeleteModal(false);
    setSelectedAccount(null);
  };

  const handleCreate = () => {
    setOpenAccountModal(true);
  }

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setOpenAccountModal(true);
  };

  const handleDelete = (account: Account) => {
    setSelectedAccount(account);
    setOpenDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedAccount) return;

    await accountService.deleteAccount(selectedAccount.id);
    router.refresh();
    setSelectedAccount(null);
  };

  return (
    <PageShell
      title="Your Accounts"
      subtitle="See and manage all your accounts in one place."
      actionButton={{
        text: "+ New Account",
        variant: "primary",
        size: "lg",
        onClick: handleCreate,
      }} 
    >
      <AccountsTable
        data={accounts}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AccountFormModal
        open={openAccountModal}
        onClose={handleClose}
        account={selectedAccount ?? undefined}
      />

      <DeleteModal
        open={openDeleteModal}
        onClose={handleClose}
        onDelete={confirmDelete}
        itemDescription={selectedAccount?.name ?? ""}
        modelName="Account"
      />

    </PageShell>
  );
};