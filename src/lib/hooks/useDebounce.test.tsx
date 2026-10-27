import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  it("returns the latest value after the delay", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "a" },
    });
    expect(result.current).toBe("a");
    rerender({ value: "ab" });
    expect(result.current).toBe("a");
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("ab");
    vi.useRealTimers();
  });
});
