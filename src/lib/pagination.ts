/** Rows per page a list can show. The page size lives in the URL (?pageSize=), so only these are accepted. */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const DEFAULT_PAGE_SIZE = 20;
