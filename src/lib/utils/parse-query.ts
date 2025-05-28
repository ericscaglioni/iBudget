type SortOrder = "asc" | "desc";

export type QueryParams = {
  page: number;
  pageSize: number;
  sortField: string;
  sortOrder: SortOrder;
  filters: Record<string, string | undefined>;
};

export const DEFAULT_PAGE_SIZE = 15;

export const parseQueryParams = async (searchParams: Record<string, string | string[] | undefined>): Promise<QueryParams> => {
  const {
    page: pageParam,
    pageSize: pageSizeParam,
    sortField: sortFieldParam,
    sortOrder: sortOrderParam,
    ...params
  } = await searchParams;

  const page = parseInt(pageParam as string || "1", 10);
  const pageSize = parseInt(pageSizeParam as string || `${DEFAULT_PAGE_SIZE}`, 10);
  const sortField = (sortFieldParam as string) || "createdAt";
  const sortOrder = sortOrderParam === "asc" ? "asc" : "desc";

  const filters: Record<string, string | undefined> = {};
  Object.keys(params).forEach((key) => {
    filters[key] = params[key] as string;
  });

  return { page, pageSize, sortField, sortOrder, filters };
};