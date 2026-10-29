import { prisma } from "@/lib/prisma";
import { dayjs } from "@/lib/utils/dayjs.js";
import { fetchLatestRates } from "./exchange-rates-provider";

export class RatesUnavailableError extends Error {
  constructor(message = "Exchange rates are unavailable right now.") {
    super(message);
    this.name = "RatesUnavailableError";
  }
}

export type RateTable = {
  base: string;
  asOf: string;
  rates: Record<string, number>;
};

const utcDate = (yyyyMmDd: string) => new Date(`${yyyyMmDd}T00:00:00.000Z`);

const asRecord = (value: unknown): Record<string, number> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const rates: Record<string, number> = {};
  for (const [code, amount] of Object.entries(value)) {
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return null;
    rates[code] = amount;
  }
  return rates;
};

const hasQuotes = (rates: Record<string, number>, base: string, quotes: string[]) =>
  quotes.every((code) => code === base || rates[code] != null);

export const roundMoney = (amount: number) => Math.round(amount * 100) / 100;

/**
 * Convert `amount` from `from` into `to` using a table quoted as units of each currency per 1 `base`.
 */
export const convertAmount = (
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
  base: string
) => {
  if (from === to) return roundMoney(amount);
  const fromPerBase = from === base ? 1 : rates[from];
  const toPerBase = to === base ? 1 : rates[to];
  if (fromPerBase == null || toPerBase == null || fromPerBase === 0) {
    throw new RatesUnavailableError(`No exchange rate for ${from} or ${to}.`);
  }
  return roundMoney((amount / fromPerBase) * toPerBase);
};

/**
 * Today's rates for `base`, with a quote for every currency in `quotes`. Cached per UTC day.
 * Throws RatesUnavailableError when the public feed fails and there is no cache for today.
 */
export const getRateTable = async (base: string, quotes: string[]): Promise<RateTable> => {
  const needed = [...new Set(quotes.filter(Boolean))];
  const fetchedOn = dayjs.utc().format("YYYY-MM-DD");
  const cached = await prisma.exchangeRateSnapshot.findUnique({
    where: { base_fetchedOn: { base, fetchedOn: utcDate(fetchedOn) } },
  });
  const cachedRates = cached ? asRecord(cached.rates) : null;

  if (cached && cachedRates && hasQuotes(cachedRates, base, needed)) {
    return {
      base,
      asOf: dayjs.utc(cached.asOf).format("YYYY-MM-DD"),
      rates: cachedRates,
    };
  }

  let fetched;
  try {
    fetched = await fetchLatestRates(base);
  } catch {
    throw new RatesUnavailableError(
      "Couldn't load exchange rates. Showing your home currency instead."
    );
  }

  const rates = { ...fetched.rates, [base]: fetched.rates[base] ?? 1 };
  if (!hasQuotes(rates, base, needed)) {
    throw new RatesUnavailableError(
      "Couldn't load exchange rates. Showing your home currency instead."
    );
  }

  await prisma.exchangeRateSnapshot.upsert({
    where: { base_fetchedOn: { base, fetchedOn: utcDate(fetchedOn) } },
    create: {
      base,
      fetchedOn: utcDate(fetchedOn),
      asOf: utcDate(fetched.asOf),
      rates,
    },
    update: {
      asOf: utcDate(fetched.asOf),
      rates,
      fetchedAt: new Date(),
    },
  });

  return { base, asOf: fetched.asOf, rates };
};
