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
  startTransition?: (callback: () => void) => void;
}

const pageSizeOptions = PAGE_SIZE_OPTIONS.map((size) => ({ label: String(size), value: String(size) }));

export const Pagination = ({
  page,
  pageCount,
  pageSize,
  searchParams,
  basePath = "",
  startTransition = (callback) => callback(),
}: Props) => {
  const router = useRouter();

  const navigate = (href: string) => {
    startTransition(() => {
      router.push(href);
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    navigate(`${basePath}?${params.toString()}`);
  };

  // The page size lives in the URL, like the filters and the sorting, so a link keeps it.
  // Rows move around when the size changes, so go back to the first page.
  const handlePageSizeChange = (newPageSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", String(newPageSize));
    params.delete("page");
    navigate(`${basePath}?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
        <span className="whitespace-nowrap">Rows per page</span>
        <div className="w-16 sm:w-24">
          <Combobox
            options={pageSizeOptions}
            value={String(pageSize)}
            onChange={(value) => value && handlePageSizeChange(Number(value))}
            size="sm"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={clsx(
            "text-sm text-gray-500 hover:text-primary disabled:opacity-50 px-1 sm:px-0 py-0",
            page <= 1 && "cursor-not-allowed"
          )}
        >
          <Icon name="arrowLeft" className="size-4 inline"/>
          <span className="hidden sm:inline"> Previous</span>
        </Button>
        <span className="whitespace-nowrap text-xs sm:text-sm text-gray-600">
          Page {page} of {Math.max(pageCount, 1)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
          className={clsx(
            "text-sm text-gray-500 hover:text-primary disabled:opacity-50 px-1 sm:px-0 py-0",
            page >= pageCount && "cursor-not-allowed"
          )}
        >
          <span className="hidden sm:inline">Next </span>
          <Icon name="arrowRight" className="size-4 inline"/>
        </Button>
      </div>
    </div>
  );
};
