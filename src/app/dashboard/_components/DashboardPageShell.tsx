"use client";

import { PageShell } from "@/components";
import { dayjs } from "@/lib/utils/dayjs.js";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AccountsOverview } from "./AccountsOverview";
import { MonthlySummary } from "./MonthlySummary";
import { NetWorthHero } from "./NetWorthHero";
import { TopSpendingCategories } from "./TopSpendingCategories";
import { Button, Icon } from "@/components/ui";
import { SixMonthBarChart } from "./SixMonthBarChart";
import { ReorderAccountsModal } from "./ReorderAccountsModal";
import { GettingStarted } from "@/components/guide/GettingStarted";
import { MultiCurrencyHint } from "@/components/guide/MultiCurrencyHint";
import type { CurrencyBalance, NetWorth } from "@/lib/server/services/dashboard";
import type { Guide } from "@/lib/server/services/guide";
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
  incomeFromExchange: number;
  expensesFromExchange: number;
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
  currency: string;
  currencyBalances: CurrencyBalance[];
  netWorth: NetWorth;
  accountBalances: AccountBalance[];
  monthlyTotals: MonthlyTotal[];
  sixMonthHistory: SixMonthHistory[];
  accountOptions: ComboboxOption[];
  categoryOptions: CategoryOption[];
  transferCategoryId: string;
  guide: Guide;
}

export const DashboardPageShell = ({
  currency,
  currencyBalances,
  netWorth,
  accountBalances,
  monthlyTotals,
  sixMonthHistory,
  accountOptions,
  categoryOptions,
  transferCategoryId,
  guide,
}: Props) => {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [openTransactionModal, setOpenTransactionModal] = useState(false);
  const [openReorderModal, setOpenReorderModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // The shown currency lives in the URL so the page is server-rendered with the right data
  const handleCurrencyChange = (next: string) => {
    startTransition(() => {
      router.replace(`/dashboard?currency=${next}`);
    });
  };

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

  // Find the monthly data for the selected month (and the one before, for the comparison)
  const selectedMonthData = monthlyTotals.find((m) => m.month === selectedMonth);
  const previousMonthKey = dayjs(selectedMonth, "YYYY-MM").subtract(1, "month").format("YYYY-MM");
  const previousMonthData = monthlyTotals.find((m) => m.month === previousMonthKey);
  const hasPreviousMonthData = !!previousMonthData;
  const isCurrentMonth = selectedMonth >= dayjs().format("YYYY-MM");

  // Format the selected month for display
  const formattedMonth = dayjs(selectedMonth, "YYYY-MM").format("MMMM YYYY");

  return (
    <>
      <PageShell
      title="Dashboard"
      subtitle="Overview of your financial accounts and monthly totals"
      // Without an account there is nothing to record a transaction against, so don't offer it yet
      actionButton={guide.hasAccounts ? {
        text: "+ New Transaction",
        variant: "primary",
        size: "lg",
        onClick: handleOpenTransactionModal,
      } : undefined}
    >
      {!guide.hasAccounts ? (
        // Brand-new user: show only the way forward instead of a dashboard full of empty cards
        guide.checklist && <GettingStarted steps={guide.checklist.steps} canDismiss={false} />
      ) : (
      <div className="space-y-4 sm:space-y-6">
        {guide.checklist && <GettingStarted steps={guide.checklist.steps} canDismiss />}

        {guide.showMultiCurrencyHint && (
          <MultiCurrencyHint currency={currency} currencies={currencyBalances.map((c) => c.currency)} />
        )}

        {/* Section 1: Net worth in the base currency, with the per-currency breakdown */}
        <section>
          <NetWorthHero
            netWorth={netWorth}
            currency={currency}
            currencyBalances={currencyBalances}
            onCurrencyChange={handleCurrencyChange}
            disabled={isPending}
          />
        </section>

        {/* Section 2: Month at a glance, with month selector */}
        <section className="space-y-3 sm:space-y-4 md:space-y-6">
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
              Monthly Summary
              <span className="ml-2 text-xs sm:text-sm font-normal text-gray-400">({currency})</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 md:mb-4">
              Income and expenses from your {currency} accounts
            </p>
          </div>

          {/* Month Selector */}
          <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {/* Month Navigation */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => handleMonthChange(previousMonthKey)}
                  disabled={!hasPreviousMonthData}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                  aria-label="Previous month"
                >
                  <Icon name="chevronLeft" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>

                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 text-center px-2">
                  {formattedMonth}
                </h3>

                <button
                  onClick={() => handleMonthChange(dayjs(selectedMonth, "YYYY-MM").add(1, "month").format("YYYY-MM"))}
                  disabled={isCurrentMonth}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                  aria-label="Next month"
                >
                  <Icon name="chevronRight" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
              </div>

              {/* Current Month Button */}
              {!isCurrentMonth && (
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
            <MonthlySummary
              income={selectedMonthData.income}
              expenses={selectedMonthData.expenses}
              incomeFromExchange={selectedMonthData.incomeFromExchange}
              expensesFromExchange={selectedMonthData.expensesFromExchange}
              net={selectedMonthData.net}
              currency={currency}
              previousExpenses={previousMonthData?.expenses}
              previousLabel={dayjs(previousMonthKey, "YYYY-MM").format("MMM")}
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-gray-500 text-sm">
                No data available for {formattedMonth}
              </p>
            </div>
          )}
        </section>

        {/* Section 3: Where the money went this month */}
        {selectedMonthData && selectedMonthData.categoryBreakdown.length > 0 && (
          <section>
            <TopSpendingCategories
              categories={selectedMonthData.categoryBreakdown}
              currency={currency}
            />
          </section>
        )}

        {/* Section 4: Accounts, grouped by currency */}
        <section>
          <div className="flex items-center justify-between gap-3 mb-2 sm:mb-3 md:mb-4">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
              Accounts
            </h2>
            {/* With a single account there is nothing to put in order */}
            {accountBalances.length > 1 && (
              <Button variant="outline" size="sm" onClick={() => setOpenReorderModal(true)}>
                <Icon name="reorder" className="mr-1.5 size-4" />
                Reorder
              </Button>
            )}
          </div>
          <AccountsOverview accountBalances={accountBalances} />
        </section>

        {/* Section 5: Financial Trends */}
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
            <SixMonthBarChart data={sixMonthHistory} currency={currency} />
          </section>
        )}
      </div>
      )}
    </PageShell>

      <ReorderAccountsModal
        open={openReorderModal}
        onClose={() => setOpenReorderModal(false)}
        accounts={accountBalances}
        currency={currency}
      />

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

