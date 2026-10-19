import { accountCurrencies } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { dayjs } from "@/lib/utils/dayjs.js";

/**
 * Exchange rates, cached per day in the `exchange_rates` table.
 *
 * Every rate is stored as "units of <currency> per 1 USD" so that any pair can be derived:
 *   amount_in_to = amount_in_from / ratePerUsd[from] * ratePerUsd[to]
 *
 * Source: https://github.com/fawazahmed0/exchange-api (free, no API key, ~340 currencies,
 * daily history). Past days are immutable, so once a day is cached it is never fetched again.
 */

const FETCH_TIMEOUT_MS = 8000;
const FETCH_CONCURRENCY = 6;

const DATE_FORMAT = "YYYY-MM-DD";

/** "YYYY-MM-DD" key used to look rates up for a given date. */
export const toDateKey = (date: Date | string): string => dayjs(date).format(DATE_FORMAT);

const toDbDate = (key: string) => new Date(`${key}T00:00:00.000Z`);
const fromDbDate = (date: Date) => date.toISOString().slice(0, 10);

const ratesUrls = (version: string) => [
  `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${version}/v1/currencies/usd.json`,
  `https://${version}.currency-api.pages.dev/v1/currencies/usd.json`,
];

const SUPPORTED = new Set(accountCurrencies);

/** Fetch every supported rate for one day. `version` is a "YYYY-MM-DD" date or "latest". */
const fetchDayRates = async (version: string): Promise<Record<string, number> | null> => {
  for (const url of ratesUrls(version)) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!response.ok) continue;

      const body = (await response.json()) as { usd?: Record<string, number> };
      if (!body.usd) continue;

      const rates: Record<string, number> = {};
      for (const [code, rate] of Object.entries(body.usd)) {
        const currency = code.toUpperCase();
        if (SUPPORTED.has(currency) && typeof rate === "number" && rate > 0) {
          rates[currency] = rate;
        }
      }
      rates.USD = 1;
      return rates;
    } catch {
      // try the next mirror
    }
  }
  return null;
};

const runWithConcurrency = async <T>(items: T[], limit: number, worker: (item: T) => Promise<void>) => {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      while (queue.length > 0) {
        await worker(queue.shift() as T);
      }
    })
  );
};

/** Make sure the given days are cached in the database, fetching the missing ones. */
const ensureRates = async (dateKeys: string[]) => {
  if (dateKeys.length === 0) return;

  const cached = await prisma.exchangeRate.findMany({
    where: { date: { in: dateKeys.map(toDbDate) } },
    select: { date: true },
    distinct: ["date"],
  });
  const cachedKeys = new Set(cached.map((row) => fromDbDate(row.date)));
  const missing = dateKeys.filter((key) => !cachedKeys.has(key));
  if (missing.length === 0) return;

  const today = toDateKey(new Date());

  await runWithConcurrency(missing, FETCH_CONCURRENCY, async (key) => {
    const rates = await fetchDayRates(key === today ? "latest" : key);
    if (!rates) {
      console.warn(`[exchange-rates] could not fetch rates for ${key}`);
      return;
    }

    await prisma.exchangeRate.createMany({
      data: Object.entries(rates).map(([currency, ratePerUsd]) => ({
        date: toDbDate(key),
        currency,
        ratePerUsd,
      })),
      skipDuplicates: true,
    });
  });
};

export type RateBook = {
  /**
   * Convert `amount` between currencies using the rate of `dateKey`
   * (or the closest day we have if that exact day is unavailable).
   * Returns null when no rate exists for one of the currencies.
   */
  convert: (amount: number, from: string, to: string, dateKey: string) => number | null;
  /** Currencies that could not be converted so far (so the UI can warn about it). */
  missingCurrencies: () => string[];
};

/**
 * Load the rates needed to convert values on the given days, fetching and caching any that are
 * missing. Days in the future are valued at today's rate.
 */
export const loadRateBook = async (dateKeys: string[]): Promise<RateBook> => {
  const today = toDateKey(new Date());
  const keys = Array.from(new Set(dateKeys.map((key) => (key > today ? today : key)).concat(today)));

  await ensureRates(keys);

  const rows = await prisma.exchangeRate.findMany({
    where: { date: { in: keys.map(toDbDate) } },
  });

  const byDate = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const key = fromDbDate(row.date);
    if (!byDate.has(key)) byDate.set(key, new Map());
    byDate.get(key)!.set(row.currency, row.ratePerUsd.toNumber());
  }

  // Last resort when a day failed to download: the most recent day we have stored at all.
  let latestStored: Map<string, number> | undefined;
  if (byDate.size === 0) {
    const latest = await prisma.exchangeRate.findFirst({ orderBy: { date: "desc" }, select: { date: true } });
    if (latest) {
      const latestRows = await prisma.exchangeRate.findMany({ where: { date: latest.date } });
      latestStored = new Map(latestRows.map((row) => [row.currency, row.ratePerUsd.toNumber()]));
    }
  }

  const availableKeys = Array.from(byDate.keys()).sort();
  const missing = new Set<string>();

  const ratesFor = (dateKey: string): Map<string, number> | undefined => {
    const key = dateKey > today ? today : dateKey;
    const exact = byDate.get(key);
    if (exact) return exact;

    // Closest earlier day, otherwise the closest later one.
    const earlier = [...availableKeys].reverse().find((k) => k <= key);
    const closest = earlier ?? availableKeys.find((k) => k >= key);
    return closest ? byDate.get(closest) : latestStored;
  };

  return {
    convert: (amount, from, to, dateKey) => {
      if (from === to) return amount;

      const rates = ratesFor(dateKey);
      const fromRate = rates?.get(from);
      const toRate = rates?.get(to);

      if (!fromRate || !toRate) {
        if (!fromRate) missing.add(from);
        if (!toRate) missing.add(to);
        return null;
      }

      return (amount / fromRate) * toRate;
    },
    missingCurrencies: () => Array.from(missing),
  };
};
