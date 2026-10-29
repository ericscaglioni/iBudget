import { describe, expect, it } from "vitest";
import { OTHER_SLICE_COLOR, sliceShare, toSpendingSlices } from "./spending-slices";

const cat = (id: string, amount: number): Parameters<typeof toSpendingSlices>[0][number] => ({
  categoryId: id,
  categoryName: id,
  amount,
  color: "#111",
});

describe("toSpendingSlices", () => {
  it("keeps five or fewer categories without Other", () => {
    const { slices, total } = toSpendingSlices([cat("a", 10), cat("b", 5)]);
    expect(slices.map((s) => s.id)).toEqual(["a", "b"]);
    expect(total).toBe(15);
  });

  it("folds the rest into Other so the ring is the whole month", () => {
    const { slices, total } = toSpendingSlices(
      [cat("a", 50), cat("b", 40), cat("c", 30), cat("d", 20), cat("e", 10), cat("f", 7), cat("g", 3)],
      5
    );
    expect(slices.map((s) => [s.name, s.amount])).toEqual([
      ["a", 50],
      ["b", 40],
      ["c", 30],
      ["d", 20],
      ["e", 10],
      ["Other", 10],
    ]);
    expect(slices[5].color).toBe(OTHER_SLICE_COLOR);
    expect(total).toBe(160);
  });

  it("drops zero amounts", () => {
    const { slices, total } = toSpendingSlices([cat("a", 8), cat("b", 0)]);
    expect(slices).toHaveLength(1);
    expect(total).toBe(8);
  });
});

describe("sliceShare", () => {
  it("rounds a slice to a percent of the total", () => {
    expect(sliceShare(1, 3)).toBe(33);
    expect(sliceShare(10, 0)).toBe(0);
  });
});
