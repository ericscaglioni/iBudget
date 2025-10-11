import { ColumnDef } from "@tanstack/react-table";
import { Category } from "@prisma/client";
import { Chip } from "@/components/ui";

export const categoryColumns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const category = row.original;
      return (
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <span className="font-medium">{category.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <Chip
          label={type.charAt(0).toUpperCase() + type.slice(1)}
          color={type === "income" ? "green" : "red"}
        />
      );
    },
  },
  {
    accessorKey: "color",
    header: "Color",
    cell: ({ row }) => {
      const color = row.getValue("color") as string;
      return (
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-6 h-6 rounded border border-gray-300"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm text-gray-600">{color}</span>
        </div>
      );
    },
  },
];

