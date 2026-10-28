/**
 * Click 1: sort this column ascending. Click 2: descending. Click 3: back to the list's default order.
 */
export const cycleSortParams = (search: { toString(): string }, columnId: string): URLSearchParams => {
  const params = new URLSearchParams(search.toString());
  const currentField = params.get("sortField");
  const currentOrder = params.get("sortOrder");

  if (currentField === columnId && currentOrder === "asc") {
    params.set("sortOrder", "desc");
  } else if (currentField === columnId) {
    params.delete("sortField");
    params.delete("sortOrder");
  } else {
    params.set("sortField", columnId);
    params.set("sortOrder", "asc");
  }

  params.delete("page");
  return params;
};
