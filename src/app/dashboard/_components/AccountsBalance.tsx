"use client";

import { formatCurrency } from "@/lib/utils/format";

interface AccountBalance {
  accountId: string;
  name: string;
  balance: number;
  currency: string;
}

interface Props {
  accountBalances: AccountBalance[];
}

export const AccountsBalance = ({ accountBalances }: Props) => {
  if (accountBalances.length === 0) {
    return (
      <div className="bg-surface rounded-lg  border border-line p-8 text-center">
        <p className="text-muted text-sm">No accounts found. Create an account to get started.</p>
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
    <div className="space-y-6">
      {/* Total Balance Card */}
      <div className="rounded-lg border border-line bg-surface p-6">
        <h3 className="mb-1 text-sm font-medium text-muted">Total Balance</h3>
        <div className="space-y-2">
          {Object.entries(accountsByCurrency).map(([currency, accounts]) => {
            const currencyTotal = accounts.reduce((sum, acc) => sum + acc.balance, 0);
            return (
              <div key={currency} className="text-3xl font-semibold tabular-nums text-ink">
                {formatCurrency(currencyTotal, currency)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accountBalances.map((account) => (
          <div
            key={account.accountId}
            className="bg-surface rounded-lg  border border-line p-5 hover: transition-shadow"
          >
            <div className="flex flex-col">
              <h4 className="text-sm font-medium text-muted mb-1">{account.name}</h4>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-ink">
                  {formatCurrency(account.balance, account.currency)}
                </span>
                <span className="text-xs text-muted uppercase">{account.currency}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

