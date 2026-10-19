"use client";

import { ClientOnlyCurrency } from "@/components/ui";
import { useState } from "react";

interface AccountBalance {
  accountId: string;
  name: string;
  balance: number;
  currency: string;
}

interface Props {
  accountBalances: AccountBalance[];
}

export const AccountsOverview = ({ accountBalances }: Props) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (accountBalances.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500 text-sm">No accounts found. Create an account to get started.</p>
      </div>
    );
  }

  // Group accounts by currency
  const accountsByCurrency = accountBalances.reduce((acc, account) => {
    if (!acc[account.currency]) {
      acc[account.currency] = [];
    }
    acc[account.currency].push(account);
    return acc;
  }, {} as Record<string, AccountBalance[]>);

  return (
    <div className="space-y-4 sm:space-y-5">
      {Object.entries(accountsByCurrency).map(([currency, accounts]) => {
        const currencyTotal = accounts.reduce((sum, acc) => sum + acc.balance, 0);
        const isCollapsed = collapsed[currency] ?? false;

        return (
          <div key={currency}>
            {/* Currency header with subtotal, click to collapse */}
            <button
              type="button"
              onClick={() => setCollapsed((prev) => ({ ...prev, [currency]: !isCollapsed }))}
              aria-expanded={!isCollapsed}
              className="w-full flex items-center justify-between gap-3 mb-2 sm:mb-3 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className={`inline-block text-xs text-gray-400 transition-transform ${isCollapsed ? "" : "rotate-90"}`}>▶</span>
                {currency}
                <span className="text-xs font-normal text-gray-400">
                  {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
                </span>
              </span>
              <ClientOnlyCurrency
                value={currencyTotal}
                currency={currency}
                className="text-sm font-semibold text-gray-900"
              />
            </button>

            {!isCollapsed && (
              /* Account Cards Grid - Responsive: 1 col mobile, 2 cols tablet, 3 cols desktop */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {accounts.map((account) => (
                  <div
                    key={account.accountId}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200"
                  >
                    <div className="flex flex-col space-y-1.5 sm:space-y-2">
                      {/* Account Name */}
                      <h4 className="text-xs sm:text-sm font-medium text-gray-600 truncate" title={account.name}>
                        {account.name}
                      </h4>

                      {/* Balance and Currency */}
                      <div className="flex items-baseline justify-between gap-2">
                        <ClientOnlyCurrency
                          value={account.balance}
                          currency={account.currency}
                          className="text-xl sm:text-2xl font-bold text-gray-900 truncate"
                        />
                        <span className="text-xs font-semibold text-gray-400 uppercase shrink-0">
                          {account.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
