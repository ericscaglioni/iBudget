import { ColumnDef } from "@tanstack/react-table";
import { TransactionWithDetails } from "../types";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const columns: ColumnDef<TransactionWithDetails>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ getValue }) => formatDate(getValue<string>()),
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "account.name",
    header: "Account",
    cell: ({ row }) => row.original.account.name,
  },
  {
    accessorKey: "category.name",
    header: "Category",
    cell: ({ row }) => row.original.category?.name ?? "-",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ getValue, row }) => (
      <div className="text-end">
        {formatCurrency(getValue<number>(), row.original.account.currency)}
      </div>
    ),
  },
];