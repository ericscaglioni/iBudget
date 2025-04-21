'use client';

import { useState } from 'react';
import { Account } from '@prisma/client';
import { Table } from '@/components/ui/Table';
import { accountColumns } from './columns';
import { AccountModal } from './AccountModal';

export const AccountsTable = ({ data }: { data: Account[] }) => {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  return (
    <>
      <Table data={data} columns={accountColumns({ onEdit: setSelectedAccount })} />

      {selectedAccount && (
        <AccountModal
          open={true}
          onClose={() => setSelectedAccount(null)}
          account={selectedAccount}
        />
      )}
    </>
  );
};