"use client";

import { PageShell } from "@/components";
import { Icon, Spinner } from "@/components/ui";
import { useAccountOverview, useMonthlySummary } from "@/lib/queries";
import { dayjs } from "@/lib/utils/dayjs";
import { useState } from "react";
import { AccountsOverview, MonthlySummary, SixMonthBarChart, TopSpendingCategories } from "./_components";

const DashboardPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));

  // Fetch account overview (balances + 6-month history) using React Query
  const { 
    data: overviewData, 
    isLoading: isLoadingOverview, 
    error: overviewError 
  } = useAccountOverview();

  // Fetch monthly summary separately using React Query
  const {
    data: monthlySummaryData,
    isLoading: isLoadingMonthlySummary,
    error: monthlySummaryError
  } = useMonthlySummary(selectedMonth);

  return (
    <PageShell
      title="Dashboard"
      subtitle="Overview of your financial accounts and monthly totals"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Overview Loading State (Accounts + Chart) */}
        {isLoadingOverview && (
          <div className="flex items-center justify-center py-16">
            <div className="scale-[2.5]">
              <Spinner />
            </div>
          </div>
        )}

        {/* Overview Error State */}
        {overviewError && !isLoadingOverview && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600 text-sm">Failed to load account overview. Please try again.</p>
          </div>
        )}

        {/* Overview Content */}
        {!isLoadingOverview && !overviewError && overviewData && (
          <div className="space-y-6 sm:space-y-8">
            {/* 1. Accounts Overview Section */}
            <section>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4">Accounts</h2>
              <AccountsOverview
                accountBalances={overviewData.accountBalances}
              />
            </section>

            {/* 2. Financial Trends Section */}
            {overviewData.sixMonthSummary && overviewData.sixMonthSummary.length > 0 && (
              <section>
                <div className="mb-2 sm:mb-3 md:mb-4">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
                    Financial Trends (Last 6 Months)
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Compare your income and expenses over time to identify spending patterns
                  </p>
                </div>
                <SixMonthBarChart data={overviewData.sixMonthSummary} />
              </section>
            )}
          </div>
        )}

        {/* 3. Current Month Summary Section */}
        <section className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Section Header */}
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
                    setSelectedMonth(newMonth);
                  }}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Previous month"
                >
                  <Icon name="chevronLeft" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>

                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 text-center px-2">
                  {dayjs(selectedMonth, "YYYY-MM").format("MMMM YYYY")}
                </h3>

                <button
                  onClick={() => {
                    const newMonth = dayjs(selectedMonth, "YYYY-MM").add(1, "month").format("YYYY-MM");
                    setSelectedMonth(newMonth);
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
                  onClick={() => setSelectedMonth(dayjs().format("YYYY-MM"))}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">Current Month</span>
                  <span className="sm:hidden">Today</span>
                </button>
              )}
            </div>
          </div>

          {/* Monthly Summary Loading State */}
          {isLoadingMonthlySummary && (
            <div className="flex items-center justify-center py-12">
              <div className="scale-[2.5]">
                <Spinner />
              </div>
            </div>
          )}

          {/* Monthly Summary Error State */}
          {monthlySummaryError && !isLoadingMonthlySummary && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600 text-sm">Failed to load monthly summary. Please try again.</p>
            </div>
          )}

          {/* Monthly Summary Data */}
          {!isLoadingMonthlySummary && !monthlySummaryError && monthlySummaryData && (
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <MonthlySummary
                income={monthlySummaryData.income}
                expenses={monthlySummaryData.expenses}
                net={monthlySummaryData.net}
              />

              {/* Category Breakdown */}
              {monthlySummaryData.categoryBreakdown.length > 0 && (
                <TopSpendingCategories categories={monthlySummaryData.categoryBreakdown} />
              )}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
};

export default DashboardPage;

