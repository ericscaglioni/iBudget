"use client";

import { ClientOnlyCurrency, Tooltip } from "@/components/ui";
import type { CurrencyBalance, NetWorth } from "@/lib/server/services/dashboard";

interface Props {
  netWorth: NetWorth;
  currency: string;
  currencyBalances: CurrencyBalance[];
  onCurrencyChange: (currency: string) => void;
  disabled?: boolean;
}

export const NetWorthHero = ({ netWorth, currency, currencyBalances, onCurrencyChange, disabled = false }: Props) => {
  const { change, changePercent } = netWorth;
  const changeIsPositive = change >= 0;

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 sm:p-8 text-white">
      <h3 className="text-xs sm:text-sm font-medium text-white/90 mb-2 uppercase tracking-wide">
        Net worth · {currency}
      </h3>

      <ClientOnlyCurrency
        value={netWorth.total}
        currency={currency}
        className="block text-3xl sm:text-5xl font-bold"
      />

      {/* Change since the end of last month */}
      <div className="mt-2 text-xs sm:text-sm text-white/90">
        <Tooltip content="This compares today's balance with the end of last month. It is not a target. Green means the balance went up.">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
              changeIsPositive ? "bg-green-400/25" : "bg-red-400/30"
            }`}
          >
            {changeIsPositive ? "▲" : "▼"}
            <ClientOnlyCurrency value={Math.abs(change)} currency={currency} />
            {changePercent !== null && <span>({Math.abs(changePercent).toFixed(1)}%)</span>}
          </span>
          <span className="ml-2 text-white/70">vs. end of last month</span>
        </Tooltip>
      </div>

      {/* Only the currencies the user has accounts in. Click one to switch the whole dashboard to it. */}
      {currencyBalances.length > 1 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {currencyBalances.map((item) => {
            const active = item.currency === currency;
            return (
              <button
                key={item.currency}
                type="button"
                disabled={disabled}
                onClick={() => !active && onCurrencyChange(item.currency)}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs sm:text-sm border transition-colors disabled:opacity-60 ${
                  active
                    ? "bg-white text-blue-700 border-white cursor-default"
                    : "bg-white/10 text-white border-white/30 hover:bg-white/20"
                }`}
              >
                <span className="font-semibold">{item.currency}</span>
                <ClientOnlyCurrency value={item.balance} currency={item.currency} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
