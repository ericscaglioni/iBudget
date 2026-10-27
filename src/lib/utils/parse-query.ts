import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/pagination";

type SortOrder = "asc" | "desc";

export type QueryParams = {
  page: number;
  pageSize: number;
  sortField: string;
  sortOrder: SortOrder;
  filters: Record<string, string | undefined>;
};

export const parseQueryParams = async (searchParams: Record<string, string | string[] | undefined>): Promise<QueryParams> => {
  const {
    page: pageParam,
    pageSize: pageSizeParam,
    sortField: sortFieldParam,
    sortOrder: sortOrderParam,
    ...params
  } = await searchParams;

  // Anything that isn't a positive page number or one of the allowed page sizes falls back to the
  // default, so a hand-edited URL can't ask for page 0, "abc" or 100000 rows
  const requestedPage = typeof pageParam === "string" ? parseInt(pageParam, 10) : NaN;
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1;
  const requestedPageSize = typeof pageSizeParam === "string" ? parseInt(pageSizeParam, 10) : NaN;
  const pageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(requestedPageSize)
    ? requestedPageSize
    : DEFAULT_PAGE_SIZE;
  const sortField = (sortFieldParam as string) || "createdAt";
  const sortOrder = sortOrderParam === "asc" ? "asc" : "desc";

  const filters: Record<string, string | undefined> = {};
  Object.keys(params).forEach((key) => {
    filters[key] = params[key] as string;
  });

  return { page, pageSize, sortField, sortOrder, filters };
};