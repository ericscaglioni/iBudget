import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaMock } from "@/test/mock-prisma";

vi.mock("@/lib/prisma", async () => {
  const { createPrismaMock } = await import("@/test/mock-prisma");
  return { prisma: createPrismaMock() };
});

const fetchLatestRates = vi.fn();
vi.mock("./exchange-rates-provider", () => ({
  fetchLatestRates: (...args: unknown[]) => fetchLatestRates(...args),
}));

import { prisma } from "@/lib/prisma";
import { convertAmount, getRateTable, RatesUnavailableError } from "./exchange-rates";

const db = prisma as unknown as PrismaMock;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-29T12:00:00.000Z"));
  fetchLatestRates.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("convertAmount", () => {
  const rates = { USD: 1.1, BRL: 6.6, EUR: 1 };

  it("leaves an amount already in the target currency alone", () => {
    expect(convertAmount(10, "EUR", "EUR", rates, "EUR")).toBe(10);
  });

  it("converts into the table base", () => {
    expect(convertAmount(220, "USD", "EUR", rates, "EUR")).toBe(200);
  });

  it("converts between two quotes via the base", () => {
    expect(convertAmount(220, "USD", "BRL", rates, "EUR")).toBe(1320);
  });

  it("refuses a currency the table does not have", () => {
    expect(() => convertAmount(10, "JPY", "EUR", rates, "EUR")).toThrow(RatesUnavailableError);
  });
});

describe("getRateTable", () => {
  it("uses today's cache when it already has every quote", async () => {
    db.exchangeRateSnapshot.findUnique.mockResolvedValue({
      base: "EUR",
      asOf: new Date("2026-10-29T00:00:00.000Z"),
      rates: { USD: 1.1, BRL: 6.6, EUR: 1 },
    });

    const table = await getRateTable("EUR", ["USD", "BRL"]);

    expect(table).toEqual({ base: "EUR", asOf: "2026-10-29", rates: { USD: 1.1, BRL: 6.6, EUR: 1 } });
    expect(fetchLatestRates).not.toHaveBeenCalled();
  });

  it("fetches and stores a snapshot when the cache is empty", async () => {
    db.exchangeRateSnapshot.findUnique.mockResolvedValue(null);
    fetchLatestRates.mockResolvedValue({ asOf: "2026-10-28", rates: { USD: 1.2, EUR: 1 } });

    const table = await getRateTable("EUR", ["USD"]);

    expect(table.asOf).toBe("2026-10-28");
    expect(table.rates.USD).toBe(1.2);
    expect(db.exchangeRateSnapshot.upsert).toHaveBeenCalled();
  });

  it("throws when the feed fails and there is no cache", async () => {
    db.exchangeRateSnapshot.findUnique.mockResolvedValue(null);
    fetchLatestRates.mockRejectedValue(new Error("network"));

    await expect(getRateTable("EUR", ["USD"])).rejects.toThrow(RatesUnavailableError);
  });

  it("throws when the feed is missing a quote we need", async () => {
    db.exchangeRateSnapshot.findUnique.mockResolvedValue(null);
    fetchLatestRates.mockResolvedValue({ asOf: "2026-10-29", rates: { USD: 1.1 } });

    await expect(getRateTable("EUR", ["BRL"])).rejects.toThrow(RatesUnavailableError);
  });
});
