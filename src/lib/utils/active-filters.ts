import { formatMonthYear } from "./format";

/** Query params that change how a list is shown, not what is in it. */
export const VIEW_PARAMS = new Set(["page", "pageSize", "sortField", "sortOrder", "new"]);

export type FilterSpec = {
  name: string;
  type: string;
  label: string;
  options?: { label: string; value: string }[];
};

export type ActiveFilterItem = {
  name: string;
  label: string;
  display: string;
};

export const getActiveFilterItems = (
  filters: FilterSpec[],
  params: URLSearchParams
): ActiveFilterItem[] =>
  filters.flatMap((filter) => {
    const value = params.get(filter.name)?.trim();
    if (!value) return [];

    let display = value;
    if (filter.type === "monthYear") {
      display = formatMonthYear(value, true);
    } else if (filter.options?.length) {
      display = filter.options.find((option) => option.value === value)?.label ?? value;
    }

    return [{ name: filter.name, label: filter.label, display }];
  });

/** Drop list-narrowing params. Keeps sort and page size; always returns to page 1. */
export const stripFilterParams = (params: URLSearchParams) => {
  const next = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (VIEW_PARAMS.has(key) && key !== "page") {
      next.set(key, value);
    }
  }
  return next;
};
