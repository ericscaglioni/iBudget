'use client';

import { Table } from '@/components/ui/Table/Table';
import { getActionColumns } from '@/components/ui/Table/utils/actionColumns';
import { accountCurrencies, accountTypes } from '@/lib/constants';
import { Account } from '@prisma/client';
import { accountColumns } from './columns';

interface Props {
  data: Account[];
  totalCount: number;
  page: number;
  pageSize: number;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export const AccountsTable = ({ data, totalCount, page, pageSize, onEdit, onDelete }: Props) => {
  return (
    <Table
      data={data}
      columns={getActionColumns({
        columns: accountColumns,
        onEdit,
        onDelete,
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
  );
};