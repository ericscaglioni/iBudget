"use client";

import { Table } from "@/components/ui/Table/Table";
import { TransactionWithDetails } from "../types";
import { columns } from "./columns";
import { ComboboxOption } from "@/components/ui";

interface Props {
  data: TransactionWithDetails[];
  totalCount: number;
  page: number;
  pageSize: number;
  accountOptions: ComboboxOption[];
  categoryOptions: ComboboxOption[];
}

export const TransactionsTable = ({
  data,
  totalCount,
  page,
  pageSize,
  accountOptions,
  categoryOptions,
}: Props) => {
  return (
    <Table
      data={data}
      columns={columns}
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