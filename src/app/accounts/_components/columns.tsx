import { ColumnDef } from "@tanstack/react-table";
import { Account } from "@prisma/client";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Button } from "@/components/ui";
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid';
import { CurrencyCell, DateCell } from "@/components/utils/components";

type ActionsProps = {
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
};

export const accountColumns = ({ onEdit, onDelete }: ActionsProps): ColumnDef<Account>[] => [
  {
    header: () => <div className="text-center">Actions</div>,
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-around">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(row.original)}
        >
          <PencilSquareIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(row.original)}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
    ),
    size: 20,
  },
  {
    header: "Name",
    accessorKey: "name",
    size: 200,
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
    header: "Created",
    accessorKey: "createdAt",
    cell: ({ getValue }) => <DateCell value={getValue<string>()} />,
    size: 80
  },
  {
    header: () => <div className="text-center">Initial Balance</div>,
    accessorKey: "initialBalance",
    cell: ({ getValue, row }) =>
      <div className="text-end">
        <CurrencyCell value={getValue<number>()} currency={row.original.currency} />
      </div>,
  }
];