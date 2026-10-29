import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors/AppError";
import type { PrismaMock } from "@/test/mock-prisma";

vi.mock("@/lib/prisma", async () => {
  const { createPrismaMock } = await import("@/test/mock-prisma");
  return { prisma: createPrismaMock() };
});

import { prisma } from "@/lib/prisma";
import * as settings from "./settings";

const db = prisma as unknown as PrismaMock;
const accountsIn = (...currencies: string[]) => db.account.findMany.mockResolvedValue(currencies.map((currency) => ({ currency })));

describe("getAvailableCurrencies", () => {
  it("lists the currencies the user has accounts in, most used first", async () => {
    accountsIn("EUR", "USD", "USD", "BRL", "USD", "EUR");
    await expect(settings.getAvailableCurrencies("u1")).resolves.toEqual(["USD", "EUR", "BRL"]);
  });

  it("orders currencies used equally often alphabetically", async () => {
    accountsIn("USD", "BRL", "EUR");
    await expect(settings.getAvailableCurrencies("u1")).resolves.toEqual(["BRL", "EUR", "USD"]);
  });

  it("is empty without accounts", async () => {
    accountsIn();
    await expect(settings.getAvailableCurrencies("u1")).resolves.toEqual([]);
  });
});

describe("resolveCurrency", () => {
  it("uses the requested currency when the user has an account in it", async () => {
    accountsIn("USD", "EUR");
    const result = await settings.resolveCurrency("u1", "EUR");
    expect(result).toEqual({ currency: "EUR", available: ["EUR", "USD"] });
    expect(db.userSettings.findUnique).not.toHaveBeenCalled();
  });

  it("uses the saved default when the requested one is not available", async () => {
    accountsIn("USD", "USD", "EUR");
    db.userSettings.findUnique.mockResolvedValue({ baseCurrency: "EUR" });
    const result = await settings.resolveCurrency("u1", "JPY");
    expect(result.currency).toBe("EUR");
  });

  it("uses the most used currency when the saved default no longer has accounts", async () => {
    accountsIn("USD", "USD", "EUR");
    db.userSettings.findUnique.mockResolvedValue({ baseCurrency: "BRL" });
    const result = await settings.resolveCurrency("u1");
    expect(result.currency).toBe("USD");
  });

  it("uses the most used currency when nothing is saved", async () => {
    accountsIn("EUR");
    db.userSettings.findUnique.mockResolvedValue(null);
    const result = await settings.resolveCurrency("u1");
    expect(result.currency).toBe("EUR");
  });

  it("falls back to the default base currency for a user without accounts", async () => {
    accountsIn();
    db.userSettings.findUnique.mockResolvedValue(null);
    const result = await settings.resolveCurrency("u1");
    expect(result).toEqual({ currency: "USD", available: [] });
  });
});

describe("getSettings", () => {
  it("returns the default and the available currencies", async () => {
    accountsIn("EUR", "USD", "EUR");
    db.userSettings.findUnique.mockResolvedValue(null);
    await expect(settings.getSettings("u1")).resolves.toEqual({
      defaultCurrency: "EUR",
      availableCurrencies: ["EUR", "USD"],
      openDashboardOn: "home",
    });
  });
});

describe("updateSettings", () => {
  it("saves a default currency the user has an account in", async () => {
    accountsIn("USD", "EUR");
    db.userSettings.findUnique.mockResolvedValue({ baseCurrency: "EUR" });

    const result = await settings.updateSettings("u1", { defaultCurrency: "EUR" });

    expect(db.user.upsert).toHaveBeenCalledWith({
      where: { id: "u1" },
      create: { id: "u1" },
      update: {},
    });
    expect(db.userSettings.upsert).toHaveBeenCalledWith({
      where: { userId: "u1" },
      create: { userId: "u1", baseCurrency: "EUR", openDashboardOn: "home" },
      update: { baseCurrency: "EUR" },
    });
    expect(result.defaultCurrency).toBe("EUR");
  });

  it("refuses a currency the user has no account in", async () => {
    accountsIn("USD");
    await expect(settings.updateSettings("u1", { defaultCurrency: "JPY" })).rejects.toThrow(ValidationError);
    expect(db.userSettings.upsert).not.toHaveBeenCalled();
  });

  it("changes nothing when no default currency is sent", async () => {
    accountsIn("USD");
    db.userSettings.findUnique.mockResolvedValue(null);
    await settings.updateSettings("u1", {});
    expect(db.userSettings.upsert).not.toHaveBeenCalled();
  });

  it("saves All as the dashboard landing when the user holds more than one currency", async () => {
    accountsIn("USD", "EUR");
    db.userSettings.findUnique.mockResolvedValue({ baseCurrency: "EUR", openDashboardOn: "home" });

    await settings.updateSettings("u1", { openDashboardOn: "all" });

    expect(db.userSettings.upsert).toHaveBeenCalledWith({
      where: { userId: "u1" },
      create: { userId: "u1", baseCurrency: "EUR", openDashboardOn: "all" },
      update: { openDashboardOn: "all" },
    });
  });

  it("refuses All when the user only holds one currency", async () => {
    accountsIn("USD");
    await expect(settings.updateSettings("u1", { openDashboardOn: "all" })).rejects.toThrow(ValidationError);
    expect(db.userSettings.upsert).not.toHaveBeenCalled();
  });

  it("refuses an unknown landing choice", async () => {
    accountsIn("USD", "EUR");
    await expect(settings.updateSettings("u1", { openDashboardOn: "banana" })).rejects.toThrow(ValidationError);
  });
});
