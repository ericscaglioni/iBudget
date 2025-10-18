import { CurrencyCell, DateCell } from "@/components/utils/components";
import { ColumnDef } from "@tanstack/react-table";
import { SerializedAccount } from "../types";

export const accountColumns: ColumnDef<SerializedAccount>[] = [
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