export type SpendingCategory = {
  categoryId: string;
  categoryName: string;
  amount: number;
  color: string;
};

export type SpendingSlice = {
  id: string;
  name: string;
  amount: number;
  color: string;
};

/** Tailwind gray-300 — Other is leftover spending, not a brand colour. */
export const OTHER_SLICE_COLOR = "#D1D5DB";

/**
 * Top `limit` categories, then Other if anything remains, so slices always add up
 * to this month's spending (transfers are already excluded by the caller).
 */
export const toSpendingSlices = (
  categories: SpendingCategory[],
  limit = 5
): { slices: SpendingSlice[]; total: number } => {
  const ranked = [...categories]
    .filter((category) => category.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const top = ranked.slice(0, limit);
  const rest = ranked.slice(limit);
  const otherAmount = rest.reduce((sum, category) => sum + category.amount, 0);

  const slices: SpendingSlice[] = top.map((category) => ({
    id: category.categoryId,
    name: category.categoryName,
    amount: category.amount,
    color: category.color,
  }));

  if (otherAmount > 0) {
    slices.push({
      id: "other",
      name: "Other",
      amount: otherAmount,
      color: OTHER_SLICE_COLOR,
    });
  }

  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  return { slices, total };
};

export const sliceShare = (amount: number, total: number) =>
  total > 0 ? Math.round((amount / total) * 100) : 0;
