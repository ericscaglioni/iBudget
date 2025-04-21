import { ColumnDef } from "@tanstack/react-table";
import { Account } from "@prisma/client";
import { formatCurrency, formatDate } from "@/lib/utils/format";

type ActionsProps = {
  onEdit: (account: Account) => void;
};

export const accountColumns = ({ onEdit }: ActionsProps): ColumnDef<Account>[] => [
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
  {
    header: "Actions",
    id: "actions",
    cell: ({ row }) => (
      <button
        onClick={() => onEdit(row.original)}
        className="text-sm text-primary hover:underline"
      >
        Edit
      </button>
    ),
  },
];