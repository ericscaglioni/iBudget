"use client";

import { ComboboxOption } from "@/components/ui";
import { Table } from "@/components/ui/Table/Table";
import { getActionColumns } from "@/components/ui/Table/utils/actionColumns";
import { TransactionWithDetails } from "../types";
import { transactionsColumns } from "./columns";

interface Props {
  data: TransactionWithDetails[];
  totalCount: number;
  page: number;
  pageSize: number;
  accountOptions: ComboboxOption[];
  categoryOptions: ComboboxOption[];
  onEdit: (transaction: TransactionWithDetails) => void;
  onDelete: (transaction: TransactionWithDetails) => void;
}

export const TransactionsTable = ({
  data,
  totalCount,
  page,
  pageSize,
  accountOptions,
  categoryOptions,
  onEdit,
  onDelete,
}: Props) => {
  return (
    <Table
      data={data}
      columns={getActionColumns({
        columns: transactionsColumns,
        onEdit,
        onDelete,
      })}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      basePath="/transactions"
      enablePagination
      enableSorting
      filtersConfig={[
        {
          type: "combobox",
          label: "Account",
          name: "accountId",
          options: accountOptions,
        },
        {
          type: "combobox",
          label: "Category",
          name: "categoryId",
          options: categoryOptions,
        },
        {
          type: "text",
          label: "Description",
          name: "description",
        },
      ]}
    />
  );
};