"use client";

import { ClientOnlyCurrency, Tooltip } from "@/components/ui";
import type { CurrencyBalance, NetWorth } from "@/lib/server/services/dashboard";
import Link from "next/link";

interface Props {
  netWorth: NetWorth;
  currency: string;
  view: "currency" | "all";
  homeCurrency: string;
  currencyBalances: CurrencyBalance[];
  ratesAsOf: string | null;
  allDisabled: boolean;
  onCurrencyChange: (currency: string) => void;
  onViewAll: () => void;
  disabled?: boolean;
}

const chipClass = (active: boolean) =>
  `flex items-center gap-2 rounded-full px-3 py-1.5 text-xs sm:text-sm border transition-colors disabled:opacity-60 ${
    active
      ? "bg-brand text-on-brand border-brand cursor-default"
      : "bg-surface text-ink border-line hover:bg-paper"
  }`;

export const NetWorthHero = ({
  netWorth,
  currency,
  view,
  homeCurrency,
  currencyBalances,
  ratesAsOf,
  allDisabled,
  onCurrencyChange,
  onViewAll,
  disabled = false,
}: Props) => {
  const { change, changePercent } = netWorth;
  const changeIsPositive = change >= 0;
  const showSwitcher = currencyBalances.length > 1;
  const allActive = view === "all";

  return (
    <div className="rounded-lg border border-line bg-surface p-5 sm:p-8">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted sm:text-sm">
        Net worth · {currency}
        {allActive && " · All"}
      </h3>

      <ClientOnlyCurrency
        value={netWorth.total}
        currency={currency}
        className="block text-3xl font-semibold tracking-tight text-ink sm:text-5xl"
      />

      {allActive && ratesAsOf && (
        <p className="mt-1 text-xs text-muted sm:text-sm">
          Converted to {homeCurrency} · rates as of {ratesAsOf}
        </p>
      )}

      <div className="mt-2 text-xs text-muted sm:text-sm">
        <Tooltip content="This compares today's balance with the end of last month. It is not a target. Green means the balance went up.">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
              changeIsPositive ? "bg-income/15 text-income" : "bg-expense/15 text-expense"
            }`}
          >
            {changeIsPositive ? "▲" : "▼"}
            <ClientOnlyCurrency value={Math.abs(change)} currency={currency} />
            {changePercent !== null && <span>({Math.abs(changePercent).toFixed(1)}%)</span>}
          </span>
          <span className="ml-2 text-muted">vs. end of last month</span>
        </Tooltip>
      </div>

      {showSwitcher && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {currencyBalances.map((item) => {
            const active = !allActive && item.currency === currency;
            return (
              <button
                key={item.currency}
                type="button"
                disabled={disabled}
                onClick={() => !active && onCurrencyChange(item.currency)}
                aria-pressed={active}
                className={chipClass(active)}
              >
                <span className="font-medium">{item.currency}</span>
                <ClientOnlyCurrency value={item.balance} currency={item.currency} />
              </button>
            );
          })}
          <button
            type="button"
            disabled={disabled || allDisabled}
            onClick={() => !allActive && !allDisabled && onViewAll()}
            aria-pressed={allActive}
            title={allDisabled ? "Exchange rates are unavailable right now." : undefined}
            className={`${chipClass(allActive)} font-medium`}
          >
            All
          </button>
          <Tooltip
            content={
              <>
                All converts every currency into {homeCurrency}, your home currency. Switch these
                chips any time. Change the home currency or what the dashboard opens on in{" "}
                <Link href="/settings" className="font-medium text-brand underline">
                  Settings
                </Link>
                .
              </>
            }
          >
            <span className="text-xs text-muted sm:text-sm">Home currency</span>
          </Tooltip>
        </div>
      )}
    </div>
  );
};
