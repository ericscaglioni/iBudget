"use client";

import { PageShell } from "@/components";
import { dayjs } from "@/lib/utils/dayjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AccountsOverview } from "./AccountsOverview";
import { MonthlySummary } from "./MonthlySummary";
import { TopSpendingCategories } from "./TopSpendingCategories";
import { Icon } from "@/components/ui";
import { SixMonthBarChart } from "./SixMonthBarChart";
import { TransactionFormModal } from "../../transactions/_components";
import { ComboboxOption } from "@/components/ui";
import { Category } from "@prisma/client";

interface AccountBalance {
  accountId: string;
  name: string;
  currency: string;
  balance: number;
}

interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  color: string;
}

interface MonthlyTotal {
  month: string;
  income: number;
  expenses: number;
  net: number;
  categoryBreakdown: CategoryBreakdown[];
}

interface SixMonthHistory {
  month: string;
  income: number;
  expenses: number;
}

type CategoryOption = Pick<Category, "id" | "name" | "type">;

interface Props {
  accountBalances: AccountBalance[];
  monthlyTotals: MonthlyTotal[];
  sixMonthHistory: SixMonthHistory[];
  accountOptions: ComboboxOption[];
  categoryOptions: CategoryOption[];
  transferCategoryId: string;
}

export const DashboardPageShell = ({
  accountBalances,
  monthlyTotals,
  sixMonthHistory,
  accountOptions,
  categoryOptions,
  transferCategoryId,
}: Props) => {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [openTransactionModal, setOpenTransactionModal] = useState(false);

  const handleOpenTransactionModal = () => {
    setOpenTransactionModal(true);
  };

  const handleCloseTransactionModal = () => {
    setOpenTransactionModal(false);
    router.refresh();
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
  };

  // Find the monthly data for the selected month
  const selectedMonthData = monthlyTotals.find((m) => m.month === selectedMonth);

  // Format the selected month for display
  const formattedMonth = dayjs(selectedMonth, "YYYY-MM").format("MMMM YYYY");

  return (
    <>
      <PageShell
      title="Dashboard"
      subtitle="Overview of your financial accounts and monthly totals"
      actionButton={{
        text: "+ New Transaction",
        variant: "primary",
        size: "lg",
        onClick: handleOpenTransactionModal,
      }}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Section 1: Accounts */}
        <section>
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4">
            Accounts
          </h2>
          <AccountsOverview accountBalances={accountBalances} />
        </section>

        {/* Section 2: Financial Trends */}
        {sixMonthHistory && sixMonthHistory.length > 0 && (
          <section>
            <div className="mb-2 sm:mb-3 md:mb-4">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
                Financial Trends (Last 6 Months)
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Compare your income and expenses over time to identify spending patterns
              </p>
            </div>
            <SixMonthBarChart data={sixMonthHistory} />
          </section>
        )}

        {/* Section 3: Monthly Summary with Month Selector */}
        <section className="space-y-3 sm:space-y-4 md:space-y-6">
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
              Current Month Summary
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 md:mb-4">
              Select a month to view detailed income, expenses, and spending breakdown
            </p>
          </div>

          {/* Month Selector */}
          <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {/* Month Navigation */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    const newMonth = dayjs(selectedMonth, "YYYY-MM").subtract(1, "month").format("YYYY-MM");
                    handleMonthChange(newMonth);
                  }}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Previous month"
                >
                  <Icon name="chevronLeft" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>

                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 text-center px-2">
                  {formattedMonth}
                </h3>

                <button
                  onClick={() => {
                    const newMonth = dayjs(selectedMonth, "YYYY-MM").add(1, "month").format("YYYY-MM");
                    handleMonthChange(newMonth);
                  }}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Next month"
                >
                  <Icon name="chevronRight" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
              </div>

              {/* Current Month Button */}
              {selectedMonth !== dayjs().format("YYYY-MM") && (
                <button
                  onClick={() => handleMonthChange(dayjs().format("YYYY-MM"))}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">Current Month</span>
                  <span className="sm:hidden">Today</span>
                </button>
              )}
            </div>
          </div>

          {selectedMonthData ? (
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <MonthlySummary
                income={selectedMonthData.income}
                expenses={selectedMonthData.expenses}
                net={selectedMonthData.net}
              />

              {/* Category Breakdown */}
              {selectedMonthData.categoryBreakdown.length > 0 && (
                <TopSpendingCategories
                  categories={selectedMonthData.categoryBreakdown}
                />
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-gray-500 text-sm">
                No data available for {formattedMonth}
              </p>
            </div>
          )}
        </section>
      </div>
    </PageShell>

      <TransactionFormModal
        open={openTransactionModal}
        onClose={handleCloseTransactionModal}
        accountOptions={accountOptions}
        categoryOptions={categoryOptions}
        transferCategoryId={transferCategoryId}
      />
    </>
  );
};

