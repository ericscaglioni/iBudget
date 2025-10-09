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
    <div className="space-y-6">
      {/* Total Balance Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
        <h3 className="text-sm font-medium opacity-90 mb-1">Total Balance</h3>
        <div className="space-y-2">
          {Object.entries(accountsByCurrency).map(([currency, accounts]) => {
            const currencyTotal = accounts.reduce((sum, acc) => sum + acc.balance, 0);
            return (
              <div key={currency} className="text-3xl font-bold">
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
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col">
              <h4 className="text-sm font-medium text-gray-600 mb-1">{account.name}</h4>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(account.balance, account.currency)}
                </span>
                <span className="text-xs text-gray-400 uppercase">{account.currency}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

