import { VIEW_PARAMS } from "./active-filters";

/** True when the URL narrows a list down, so an empty list means "no matches" rather than "nothing yet". */
export const hasActiveFilters = (params: { keys: () => Iterable<string> }) =>
  [...params.keys()].some((key) => !VIEW_PARAMS.has(key));
