"use client";

import { Button, Combobox, Icon } from "@/components/ui";
import { PAGE_SIZE_OPTIONS } from "@/lib/pagination";
import { useRouter } from "next/navigation";
import clsx from "clsx";

interface Props {
  page: number;
  pageCount: number;
  pageSize: number;
  searchParams: URLSearchParams
  basePath?: string;
}

const pageSizeOptions = PAGE_SIZE_OPTIONS.map((size) => ({ label: String(size), value: String(size) }));

export const Pagination = ({
  page,
  pageCount,
  pageSize,
  searchParams,
  basePath = "",
}: Props) => {
  const router = useRouter();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${basePath}?${params.toString()}`);
  };

  // The page size lives in the URL, like the filters and the sorting, so a link keeps it.
  // Rows move around when the size changes, so go back to the first page.
  const handlePageSizeChange = (newPageSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", String(newPageSize));
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-3 sm:gap-4 p-4">
      {/* Always shown, even for short lists, so it can be found (and the choice is visible) */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Rows per page</span>
        <div className="w-24">
          <Combobox
            options={pageSizeOptions}
            value={String(pageSize)}
            onChange={(value) => value && handlePageSizeChange(Number(value))}
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-center sm:justify-end gap-3 sm:gap-4 items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
          className={clsx(
            "text-sm text-gray-500 hover:text-primary disabled:opacity-50 px-0 py-0",
            page <= 1 && "cursor-not-allowed"
          )}
        >
          <Icon name="arrowLeft" className="size-4 inline"/> Previous
        </Button>
        <span className="text-sm text-gray-600">
          Page {page} of {Math.max(pageCount, 1)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= pageCount}
          className={clsx(
            "text-sm text-gray-500 hover:text-primary disabled:opacity-50 px-0 py-0",
            page >= pageCount && "cursor-not-allowed"
          )}
        >
          Next <Icon name="arrowRight" className="size-4 inline"/>
        </Button>
      </div>
    </div>
  );
};
