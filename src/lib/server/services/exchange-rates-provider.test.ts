import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchLatestRates } from "./exchange-rates-provider";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchLatestRates", () => {
  it("reads the public feed with the home currency as the base", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: "success",
        time_last_update_utc: "Thu, 29 Oct 2026 00:00:01 +0000",
        rates: { USD: 1.1, EUR: 1, BRL: 6.6 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchLatestRates("EUR");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://open.er-api.com/v6/latest/EUR",
      expect.objectContaining({ cache: "no-store" })
    );
    expect(result.asOf).toBe("2026-10-29");
    expect(result.rates).toMatchObject({ EUR: 1, USD: 1.1, BRL: 6.6 });
  });

  it("throws when the feed answers with an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ result: "error" }),
      })
    );
    await expect(fetchLatestRates("EUR")).rejects.toThrow(/error/i);
  });

  it("throws when the HTTP request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(fetchLatestRates("EUR")).rejects.toThrow(/503/);
  });
});
