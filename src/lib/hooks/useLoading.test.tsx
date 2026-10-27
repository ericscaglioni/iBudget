import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingProvider, useLoading } from "./useLoading";

describe("useLoading", () => {
  it("throws outside a provider", () => {
    expect(() => renderHook(() => useLoading())).toThrow("useLoading must be used inside a LoadingProvider");
  });

  it("starts and stops loading", () => {
    const { result } = renderHook(() => useLoading(), { wrapper: LoadingProvider });
    expect(result.current.isLoading).toBe(false);
    act(() => {
      result.current.startLoading();
    });
    expect(result.current.isLoading).toBe(true);
    act(() => {
      result.current.stopLoading();
    });
    expect(result.current.isLoading).toBe(false);
  });
});
