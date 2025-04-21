'use client';

import { useState } from 'react';
import { Account } from '@prisma/client';
import { Table } from '@/components/ui/Table';
import { accountColumns } from './columns';
import { AccountModal } from './AccountModal';
import { accountService } from '@/lib/client/services';
import { useRouter } from 'next/navigation';
import { ConfirmationModal } from '@/components/ui';

export const AccountsTable = ({ data }: { data: Account[] }) => {
  const router = useRouter();
  
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Account | null>(null);

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
  
    await accountService.deleteAccount(confirmDelete.id);
    router.refresh();
    setConfirmDelete(null);
  };

  return (
    <>
      <Table
        data={data}
        columns={accountColumns({
          onEdit: setSelectedAccount,
          onDelete: (account) => setConfirmDelete(account),
        })}
      />

      {selectedAccount && (
        <AccountModal
          open={true}
          onClose={() => setSelectedAccount(null)}
          account={selectedAccount}
        />
      )}

      {confirmDelete && (
        <ConfirmationModal
          open={true}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDeleteConfirmed}
          title="Delete Account"
          description={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        />
      )}
    </>
  );
};