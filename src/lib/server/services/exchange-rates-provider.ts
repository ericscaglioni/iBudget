import { dayjs } from "@/lib/utils/dayjs.js";

export type FetchedRates = {
  /** Calendar day the feed says these rates belong to (UTC). */
  asOf: string;
  /** Units of each quote currency per 1 unit of `base`. */
  rates: Record<string, number>;
};

/**
 * Public daily FX feed. Kept in its own module so the rest of the app never talks to the network
 * (and so tests can stub this without mocking `fetch`).
 */
export const fetchLatestRates = async (base: string): Promise<FetchedRates> => {
  const url = `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`;
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) {
    throw new Error(`Exchange rate feed responded ${response.status}`);
  }

  const body = (await response.json()) as {
    result?: string;
    time_last_update_utc?: string;
    rates?: Record<string, number>;
  };

  if (body.result !== "success" || !body.rates || typeof body.rates !== "object") {
    throw new Error("Exchange rate feed returned an error");
  }

  const asOf = body.time_last_update_utc
    ? dayjs.utc(body.time_last_update_utc).format("YYYY-MM-DD")
    : dayjs.utc().format("YYYY-MM-DD");

  return {
    asOf,
    rates: { ...body.rates, [base]: body.rates[base] ?? 1 },
  };
};
