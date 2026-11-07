"use client";

import { Tooltip } from "@/components/ui";

interface Props {
  income: number;
  expenses: number;
  net: number;
  /** Part of income that arrived from another currency (a currency exchange), not earned. */
  incomeFromExchange?: number;
  /** Part of expenses that was sent to another currency (a currency exchange), not spent. */
  expensesFromExchange?: number;
  currency?: string;
  /** Expenses of the month before, to show how spending moved. */
  previousExpenses?: number;
  previousLabel?: string;
  expectedIncome?: number | null;
  expectedExpenses?: number | null;
}

export const MonthlySummary = ({
  income,
  expenses,
  net,
  incomeFromExchange = 0,
  expensesFromExchange = 0,
  currency = "USD",
  previousExpenses,
  previousLabel = "last month",
  expectedIncome = null,
  expectedExpenses = null,
}: Props) => {
  // Spending vs. the previous month (lower spending is good, so down = green)
  const expenseChange =
    previousExpenses !== undefined && previousExpenses > 0
      ? ((expenses - previousExpenses) / previousExpenses) * 100
      : null;
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
      <div className="rounded-lg border border-line bg-surface p-4 sm:p-6">
        <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted sm:mb-2 sm:text-sm">
          Income
        </h3>
        <p className="text-2xl font-semibold tabular-nums text-income sm:text-3xl">
          {formatAmount(income)}
        </p>
        {incomeFromExchange > 0 && (
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Includes {formatAmount(incomeFromExchange)} received from currency exchange
          </p>
        )}
        {expectedIncome != null && (
          <p className="mt-1 text-xs text-muted sm:text-sm">
            of {formatAmount(expectedIncome)} expected
          </p>
        )}
      </div>

      <div className="rounded-lg border border-line bg-surface p-4 sm:p-6">
        <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted sm:mb-2 sm:text-sm">
          Expenses
        </h3>
        <p className="text-2xl font-semibold tabular-nums text-expense sm:text-3xl">
          {formatAmount(expenses)}
        </p>
        {expensesFromExchange > 0 && (
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Includes {formatAmount(expensesFromExchange)} sent in currency exchange
          </p>
        )}
        {expectedExpenses != null ? (
          <p className={`mt-1 text-xs sm:text-sm ${expenses > expectedExpenses ? "font-medium text-expense" : "text-muted"}`}>
            of {formatAmount(expectedExpenses)} expected
            {expenses > expectedExpenses ? " · over" : ""}
          </p>
        ) : (
          expenseChange !== null && (
          <Tooltip
            className="mt-1"
            content={`This compares what is already booked this month with ${previousLabel}. It is not a target or a forecast. Green means this month is lower so far — a month that is still ahead, or only just started, often looks much lower.`}
          >
            <span className={`text-xs font-medium sm:text-sm ${expenseChange > 0 ? "text-expense" : "text-income"}`}>
              {expenseChange > 0 ? "▲" : "▼"} {Math.abs(expenseChange).toFixed(0)}% vs. {previousLabel}
            </span>
          </Tooltip>
          )
        )}
      </div>

      <div className="rounded-lg border border-line bg-surface p-4 sm:p-6">
        <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted sm:mb-2 sm:text-sm">
          Net
        </h3>
        <p className={`text-2xl font-semibold tabular-nums sm:text-3xl ${net >= 0 ? "text-ink" : "text-expense"}`}>
          {formatAmount(net)}
        </p>
        {expectedIncome != null && expectedExpenses != null && (
          <p className="mt-1 text-xs text-muted sm:text-sm">
            of {formatAmount(expectedIncome - expectedExpenses)} expected
          </p>
        )}
      </div>
    </div>
  );
};

