import { Button, Icon } from "@/components/ui";
import { ColumnDef } from "@tanstack/react-table";

type ActionColumnsProps<TData> = {
  columns: ColumnDef<TData>[];
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
}

export const getActionColumns = <TData,>({ columns, onEdit, onDelete }: ActionColumnsProps<TData>): ColumnDef<TData>[] => [
  {
    header: "Actions",
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-center gap-2">
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(row.original)}
          >
            <Icon name="edit" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(row.original)}
          >
            <Icon name="delete" />
          </Button>
        )}
      </div>
    ),
    meta: {
      className: "w-[100px] text-center",
    },
  },
  ...columns,
];