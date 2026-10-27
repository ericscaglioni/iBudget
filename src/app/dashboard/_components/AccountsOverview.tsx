"use client";

import { Button, ClientOnlyCurrency, Collapsible, Icon } from "@/components/ui";
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

// How many accounts show before "Show all": one row per screen size (5 across on large screens,
// 3 across on medium ones) and 3 stacked on mobile, where one card alone would be too little.
const VISIBLE_BELOW_XL = 3;
const VISIBLE_FROM_XL = 5;

const GRID_CLASSES = "grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4";

const AccountCard = ({ account, className = "" }: { account: AccountBalance; className?: string }) => (
  <div
    className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200 ${className}`}
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
          className="text-xl xl:text-lg font-bold text-gray-900 truncate"
        />
        <span className="text-xs font-semibold text-gray-400 uppercase shrink-0">{account.currency}</span>
      </div>
    </div>
  </div>
);

export const AccountsOverview = ({ accountBalances }: Props) => {
  // Collapsing a currency, and showing all of its accounts, are per visit: neither is remembered
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});

  if (accountBalances.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500 text-sm">No accounts found. Create an account to get started.</p>
      </div>
    );
  }

  // Group accounts by currency (keeping the order they came in)
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
        // The subtotal always counts every account, not only the ones on show
        const currencyTotal = accounts.reduce((sum, acc) => sum + acc.balance, 0);
        const isCollapsed = collapsed[currency] ?? false;
        const isShowingAll = showAll[currency] ?? false;
        const extrasId = `accounts-extra-${currency}`;

        // The first row is always there; the rest waits behind "Show all". The cards between the two
        // limits (4th and 5th) belong to the first row on large screens and to the rest below that,
        // so they are rendered in both places and each place shows them at the right size only.
        const firstRow = accounts.slice(0, VISIBLE_FROM_XL);
        const rest = accounts.slice(VISIBLE_BELOW_XL);
        const hasMore = accounts.length > VISIBLE_BELOW_XL;
        const hasMoreOnLargeScreens = accounts.length > VISIBLE_FROM_XL;

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
                <span className={`inline-block text-xs text-gray-400 transition-transform duration-300 ${isCollapsed ? "" : "rotate-90"}`}>▶</span>
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

            <Collapsible open={!isCollapsed}>
              <div>
                <div className={GRID_CLASSES}>
                  {firstRow.map((account, index) => (
                    <AccountCard
                      key={account.accountId}
                      account={account}
                      className={index >= VISIBLE_BELOW_XL ? "hidden xl:block" : ""}
                    />
                  ))}
                </div>

                {hasMore && (
                  <>
                    <Collapsible open={isShowingAll} id={extrasId}>
                      {/* The gap is inside, so a collapsed region leaves no gap behind */}
                      <div className={`${GRID_CLASSES} pt-3 sm:pt-4`}>
                        {rest.map((account, index) => (
                          <AccountCard
                            key={account.accountId}
                            account={account}
                            // 4th and 5th are already in the first row on large screens
                            className={index < VISIBLE_FROM_XL - VISIBLE_BELOW_XL ? "xl:hidden" : ""}
                          />
                        ))}
                      </div>
                    </Collapsible>

                    <div className={`mt-3 sm:mt-4 flex justify-center ${hasMoreOnLargeScreens ? "" : "xl:hidden"}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAll((prev) => ({ ...prev, [currency]: !isShowingAll }))}
                        aria-expanded={isShowingAll}
                        aria-controls={extrasId}
                      >
                        {isShowingAll ? "Show fewer" : `Show all ${accounts.length} accounts`}
                        <Icon
                          name="chevronDown"
                          className={`ml-1.5 size-4 transition-transform duration-300 ${isShowingAll ? "rotate-180" : ""}`}
                        />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Collapsible>
          </div>
        );
      })}
    </div>
  );
};
