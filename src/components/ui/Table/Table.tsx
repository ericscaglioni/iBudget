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
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { cycleSortParams } from "@/lib/utils/cycle-sort";
import { useTransition } from "react";
import clsx from "clsx";

type Props<TData> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  basePath?: string;
  enablePagination?: boolean;
  enableSorting?: boolean;
  filtersConfig?: TableFilter[];
  /** Extra pending from a parent that owns the filter row (transactions). */
  isFiltering?: boolean;
  /** Opens the row's edit modal. Shared lists pass this; Budget and totals do not. */
  onRowClick?: (row: TData) => void;
};

export function Table<TData>({
  data,
  columns,
  totalCount = 0,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  basePath = "",
  enablePagination = false,
  enableSorting = false,
  filtersConfig,
  isFiltering = false,
  onRowClick,
}: Props<TData>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const showLoading = isPending || isFiltering;

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
    const params = cycleSortParams(searchParams, columnId);

    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-4">
      {filtersConfig && (
        <Filters
          filtersConfig={filtersConfig}
          basePath={basePath}
          searchParams={searchParams}
          startTransition={startTransition}
        />
      )}
      <div className="overflow-x-auto overflow-y-visible rounded-md border border-line">
        <div className="relative" aria-busy={showLoading || undefined}>
          {showLoading && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-surface/50"
              role="status"
              aria-label="Loading"
            >
              <Spinner />
            </div>
          )}
        {/* 🚀 TABLE */}
        <table className="table-auto w-full min-w-[600px] sm:min-w-full bg-surface text-sm text-left">
          <thead className="bg-muted/15">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = enableSorting && header.column.getCanSort();
                  const isSorted = searchParams.get("sortField") === header.column.id;
                  const sortOrder = searchParams.get("sortOrder");
                  const sortIcon = !isSorted
                    ? "reorder"
                    : sortOrder === "asc"
                      ? "chevronUp"
                      : "chevronDown";

                  return (
                  <th
                    key={header.id}
                    aria-sort={
                      canSort && isSorted
                        ? sortOrder === "asc"
                          ? "ascending"
                          : "descending"
                        : canSort
                          ? "none"
                          : undefined
                    }
                    className={clsx(
                      "px-2 sm:px-4 py-2 font-medium text-ink text-xs sm:text-sm",
                      header.column.columnDef.meta?.className
                    )}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={() => handleSortChange(header.column.id)}
                        className={clsx(
                          "inline-flex items-center gap-1 rounded-sm text-left font-medium hover:text-ink cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/50",
                          header.column.columnDef.meta?.className?.includes("text-center") && "justify-center w-full"
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <Icon
                          name={sortIcon}
                          className={clsx("w-3.5 h-3.5", isSorted ? "text-ink" : "text-muted")}
                        />
                      </button>
                    ) : (
                      <div className={clsx(
                        "flex items-center gap-1",
                        header.column.columnDef.meta?.className?.includes("text-center") && "justify-center"
                      )}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
                    )}
                  </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-line">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={clsx(
                  "hover:bg-paper",
                  onRowClick && "cursor-pointer select-none"
                )}
                onClick={
                  onRowClick
                    ? (event) => {
                        if ((event.target as HTMLElement).closest("button, a")) return;
                        onRowClick(row.original);
                      }
                    : undefined
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={clsx(
                    "px-2 sm:px-4 py-2 text-ink text-xs sm:text-sm",
                    cell.column.columnDef.meta?.className,
                  )}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="p-4 text-center text-sm text-muted">No data available.</div>
        )}
        </div>

        {enablePagination && (
          <Pagination
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            searchParams={searchParams}
            basePath={basePath}
            startTransition={startTransition}
          />
        )}
      </div>
    </div>
  );
}