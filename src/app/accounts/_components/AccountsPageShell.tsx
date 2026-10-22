"use client";

import { PageShell } from "@/components";
import { DeleteModal, EmptyState } from "@/components/ui";
import { accountService } from "@/lib/client/services";
import { useTransactionModal } from "@/lib/providers/TransactionModalProvider";
import { hasActiveFilters } from "@/lib/utils/has-active-filters";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SerializedAccount } from "../types";
import { AccountsTable } from "./";
import { AccountFormModal } from "./AccountFormModal";

interface Props {
  accounts: SerializedAccount[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export const AccountsPageShell = ({ accounts, totalCount, page, pageSize }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openModal: openTransactionModal } = useTransactionModal();

  // Opened from the "create your first account" guide (/accounts?new=1)
  const [isGuidedFirstAccount, setIsGuidedFirstAccount] = useState(false);
  // Set once the guided account is saved, so the transaction form opens after the account form closes
  const shouldContinueToTransaction = useRef(false);

  const [openAccountModal, setOpenAccountModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SerializedAccount | null>(null);

  const hasNoAccountsYet = totalCount === 0 && !hasActiveFilters(searchParams);

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;

    setSelectedAccount(null);
    setIsGuidedFirstAccount(hasNoAccountsYet);
    setOpenAccountModal(true);
    // Drop the param so a refresh doesn't reopen the form
    router.replace("/accounts");
  }, [searchParams, hasNoAccountsYet, router]);

  const handleClose = () => {
    setOpenAccountModal(false);
    setOpenDeleteModal(false);
    setSelectedAccount(null);
    setIsGuidedFirstAccount(false);

    if (shouldContinueToTransaction.current) {
      shouldContinueToTransaction.current = false;
      // Straight on to the next step: the first transaction
      openTransactionModal();
    }
  };

  const handleCreated = () => {
    if (isGuidedFirstAccount) shouldContinueToTransaction.current = true;
  };

  const handleCreate = () => {
    setOpenAccountModal(true);
  }

  const handleEdit = (account: SerializedAccount) => {
    setSelectedAccount(account);
    setOpenAccountModal(true);
  };

  const handleDelete = (account: SerializedAccount) => {
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
      {hasNoAccountsYet ? (
        <EmptyState
          title="No accounts yet"
          description="An account is where your money lives: a wallet, a bank account or a card. Create one, then you can start adding transactions."
          action={{ label: "Create your first account", onClick: handleCreate }}
        />
      ) : (
        <AccountsTable
          data={accounts}
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <AccountFormModal
        open={openAccountModal}
        onClose={handleClose}
        account={selectedAccount ?? undefined}
        description={
          isGuidedFirstAccount
            ? "Let's start with your first account. Next, you'll add a transaction to it."
            : undefined
        }
        onCreate={handleCreated}
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