"use client";

interface Props {
  income: number;
  expenses: number;
  net: number;
  currency?: string;
}

export const MonthlySummary = ({ income, expenses, net, currency = "USD" }: Props) => {
  // Format as currency
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
      {/* Income Card */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 shadow-sm">
        <h3 className="text-xs sm:text-sm font-medium text-green-700 mb-1.5 sm:mb-2 uppercase tracking-wide">
          Income
        </h3>
        <p className="text-2xl sm:text-3xl font-bold text-green-900">
          {formatAmount(income)}
        </p>
      </div>

      {/* Expenses Card */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 shadow-sm">
        <h3 className="text-xs sm:text-sm font-medium text-red-700 mb-1.5 sm:mb-2 uppercase tracking-wide">
          Expenses
        </h3>
        <p className="text-2xl sm:text-3xl font-bold text-red-900">
          {formatAmount(expenses)}
        </p>
      </div>

      {/* Net Card - Color changes based on positive/negative */}
      <div
        className={`border rounded-lg p-4 sm:p-6 shadow-sm ${
          net >= 0
            ? "bg-blue-50 border-blue-200"
            : "bg-orange-50 border-orange-200"
        }`}
      >
        <h3
          className={`text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 uppercase tracking-wide ${
            net >= 0 ? "text-blue-700" : "text-orange-700"
          }`}
        >
          Net
        </h3>
        <p
          className={`text-2xl sm:text-3xl font-bold ${
            net >= 0 ? "text-blue-900" : "text-orange-900"
          }`}
        >
          {formatAmount(net)}
        </p>
      </div>
    </div>
  );
};

