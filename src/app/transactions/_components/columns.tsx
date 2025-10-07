import { Chip, Icon } from "@/components/ui";
import { CurrencyCell, DateCell } from "@/components/utils/components";
import { TRANSACTION_TYPE_CONFIG, TransactionTypeEnum } from "@/lib/constants";
import { ColumnDef } from "@tanstack/react-table";
import { TransactionWithDetails } from "../types";

export const transactionsColumns: ColumnDef<TransactionWithDetails>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ getValue }) => <DateCell value={getValue<string>()} />,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const { type, transferId } = row.original;
      
      const config = transferId
        ? TRANSACTION_TYPE_CONFIG[TransactionTypeEnum.transfer]
        : TRANSACTION_TYPE_CONFIG[type];

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
    cell: ({ row }) => {
      const { description, isRecurring, currentInstallment, totalInstallments } = row.original;
      
      if (isRecurring && currentInstallment && totalInstallments) {
        const paddedCurrent = String(currentInstallment).padStart(2, '0');
        const paddedTotal = String(totalInstallments).padStart(2, '0');
        return (
          <span>
            {description} ({paddedCurrent}/{paddedTotal})
          </span>
        );
      }
      
      return description;
    },
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
    cell: ({ getValue, row }) => {
      const type = row.original.type;
      const sign = type === TransactionTypeEnum.expense ? -1 : 1;
      const amount = getValue<number>() * sign;
      return (
        <div className="text-end">
          <CurrencyCell
            value={amount}
            currency={row.original.account.currency}
          />
        </div>
      );
    },
  },
];