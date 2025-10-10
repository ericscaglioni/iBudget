import { ClientOnlyCurrency } from "@/components/ui";

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
    <div className="space-y-4 sm:space-y-6">
      {/* Total Balance - Prominent with gradient background */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 sm:p-8">
        <h3 className="text-xs sm:text-sm font-medium text-white/90 mb-2 uppercase tracking-wide">
          Total Balance
        </h3>
        <div className="space-y-1 sm:space-y-2">
          {Object.entries(accountsByCurrency).map(([currency, accounts]) => {
            const currencyTotal = accounts.reduce((sum, acc) => sum + acc.balance, 0);
            return (
              <div key={currency} className="block">
                <ClientOnlyCurrency
                  value={currencyTotal}
                  currency={currency}
                  className="text-2xl sm:text-4xl font-bold text-white"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Account Cards Grid - Responsive: 1 col mobile, 2 cols tablet, 3 cols desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {accountBalances.map((account) => (
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
    </div>
  );
};

