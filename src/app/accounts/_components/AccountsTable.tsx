'use client';

import { ConfirmationModal } from '@/components/ui';
import { Table } from '@/components/ui/Table/Table';
import { accountService } from '@/lib/client/services';
import { accountCurrencies, accountTypes } from '@/lib/constants';
import { Account } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AccountFormModal } from './AccountFormModal';
import { accountColumns } from './columns';

interface Props {
  data: Account[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export const AccountsTable = ({ data, totalCount, page, pageSize }: Props) => {
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
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        basePath='/accounts'
        enablePagination
        enableSorting
        filtersConfig={[
          {
            type: "combobox",
            label: "Type",
            name: "type",
            options: accountTypes.map((type) => ({
              label: type.charAt(0).toUpperCase() + type.slice(1),
              value: type,
            })),
          },
          {
            type: "combobox",
            label: "Currency",
            name: "currency",
            options: accountCurrencies.map((currency) => ({
              label: currency.toUpperCase(),
              value: currency,
            })),
          },
        ]}
      />

      {selectedAccount && (
        <AccountFormModal
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