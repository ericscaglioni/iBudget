import { ColumnDef } from "@tanstack/react-table";
import { Account } from "@prisma/client";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const accountColumns: ColumnDef<Account>[] = [
  {
    header: "Name",
    accessorKey: "name",
  },
  {
    header: "Type",
    accessorKey: "type",
  },
  {
    header: "Currency",
    accessorKey: "currency",
  },
  {
    header: "Initial Balance",
    accessorKey: "initialBalance",
    cell: ({ getValue, row }) => {
      const value = getValue<number>();
      return formatCurrency(value, row.original.currency);
    },
  },
  {
    header: "Created",
    accessorKey: "createdAt",
    cell: ({ getValue }) => {
      return formatDate(getValue<string>());
    },
  },
];