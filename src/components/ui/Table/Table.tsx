"use client";

import { Icon, Spinner } from "@/components/ui";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { Filters, TableFilter } from "./Filters";
import { Pagination } from "./Pagination";
import { useTransition } from "react";

type Props<TData> = {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  basePath?: string;
  enablePagination?: boolean;
  enableSorting?: boolean;
  filtersConfig?: TableFilter[];
};

export function Table<TData>({
  data,
  columns,
  totalCount = 0,
  page = 1,
  pageSize = 10,
  basePath = "",
  enablePagination = false,
  enableSorting = false,
  filtersConfig,
}: Props<TData>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: enablePagination,
    manualSorting: enableSorting,
    pageCount: enablePagination ? Math.ceil(totalCount / pageSize) : undefined,
  });

  const pageCount = Math.ceil(totalCount / pageSize);

  const handleSortChange = (columnId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSortField = params.get("sortField");
    const currentSortOrder = params.get("sortOrder") || "desc";

    const isSameColumn = currentSortField === columnId;
    const nextOrder = isSameColumn && currentSortOrder === "asc" ? "desc" : "asc";

    params.set("sortField", columnId);
    params.set("sortOrder", nextOrder);

    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-4">
      {/* 🚀 DYNAMIC FILTERS */}
      {filtersConfig && (
        <Filters
          filtersConfig={filtersConfig}
          basePath={basePath}
          searchParams={searchParams}
          startTransition={startTransition}
        />
      )}
      <div className="relative overflow-x-auto overflow-y-visible rounded-md border border-gray-200">
        {isPending && (
          <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center">
            <Spinner />
          </div>
        )}
        {/* 🚀 TABLE */}
        <table className="table-auto w-full min-w-full bg-white text-sm text-left">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2 font-medium text-gray-700 cursor-pointer"
                    onClick={() => enableSorting && header.column.getCanSort() && handleSortChange(header.column.id)}
                  >
                    {header.isPlaceholder ? null : (
                      // flexRender(header.column.columnDef.header, header.getContext())
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {enableSorting && header.column.getCanSort() && (
                          <>
                            {searchParams.get("sortField") === header.column.id && (
                              <span className="text-xs">
                                <Icon
                                  name={searchParams.get("sortOrder") === "asc" ? "chevronUp" : "chevronDown"}
                                  className="w-3 h-3"
                                />
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 text-gray-800">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-500">No data available.</div>
        )}

        {enablePagination && (
          <Pagination
            page={page}
            pageCount={pageCount}
            searchParams={searchParams}
            basePath={basePath}
          />
        )}
      </div>
    </div>
  );
}