import { Chip, Icon } from "@/components/ui";
import { CurrencyCell, DateCell } from "@/components/utils/components";
import { TRANSACTION_TYPE_CONFIG } from "@/lib/constants";
import { ColumnDef } from "@tanstack/react-table";
import { TransactionWithDetails } from "../types";

export const columns: ColumnDef<TransactionWithDetails>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ getValue }) => <DateCell value={getValue<string>()} />,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type;
      const config = TRANSACTION_TYPE_CONFIG[type];
      return (
        <Chip
          label={config.label}
          color={config.color}
          icon={<Icon name={config.icon} className="w-3.5 h-3.5" />}
        />
      );
    },
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
    cell: ({ row }) => {
      const category = row.original.category;
      return category
        ? (
          <Chip
            label={category.name}
            color={category.color}
          />
        )
        : "-";
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ getValue, row }) => (
      <div className="text-end">
        <CurrencyCell
          value={getValue<number>()}
          currency={row.original.account.currency}
        />
      </div>
    ),
  },
];