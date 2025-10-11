"use client";

import { Table } from "@/components/ui/Table/Table";
import { getActionColumns } from "@/components/ui/Table/utils/actionColumns";
import { Category } from "@prisma/client";
import { categoryColumns } from "./columns";

interface Props {
  data: Category[];
  totalCount: number;
  page: number;
  pageSize: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export const CategoriesTable = ({
  data,
  totalCount,
  page,
  pageSize,
  onEdit,
  onDelete,
}: Props) => {
  return (
    <Table
      data={data}
      columns={getActionColumns({
        columns: categoryColumns,
        onEdit,
        onDelete,
      })}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      basePath="/categories"
      enablePagination
      enableSorting
      filtersConfig={[
        {
          type: "segmentedControl",
          label: "Type",
          name: "type",
          options: [
            { label: "All", value: "" },
            { label: "Expense", value: "expense" },
            { label: "Income", value: "income" },
          ],
        },
        {
          type: "text",
          label: "Search",
          name: "name",
        },
      ]}
    />
  );
};

