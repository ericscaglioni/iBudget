// Query params that change how a list is shown, not what is in it
const NON_FILTER_PARAMS = new Set(["page", "pageSize", "sortField", "sortOrder", "new"]);

/** True when the URL narrows a list down, so an empty list means "no matches" rather than "nothing yet". */
export const hasActiveFilters = (params: { keys: () => Iterable<string> }) =>
  [...params.keys()].some((key) => !NON_FILTER_PARAMS.has(key));
