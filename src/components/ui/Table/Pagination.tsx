"use client";

import { Button, Icon } from "@/components/ui";
import { useRouter } from "next/navigation";
import clsx from "clsx";

interface Props {
  page: number;
  pageCount: number;
  searchParams: URLSearchParams
  basePath?: string;
}

export const Pagination = ({
  page,
  pageCount,
  searchParams,
  basePath = "",
}: Props) => {
  const router = useRouter();
  
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <div className="flex justify-end gap-4 items-center p-4">
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
        Page {page} of {pageCount}
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
  );
};