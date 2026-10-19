import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { accountService, categoryService, dashboardService } from "@/lib/server/services";
import { DashboardPageShell } from "./_components";
import { handleServerError } from "@/lib/utils/server-error-handler";
import { accountCurrencies } from "@/lib/constants";

// Force dynamic rendering since we use auth()
export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const DashboardPage = async ({ searchParams }: Props) => {
  try {
    const { currency: currencyParam } = await searchParams;
    const currency = typeof currencyParam === "string" && accountCurrencies.includes(currencyParam)
      ? currencyParam
      : undefined;

    const { userId } = await auth();
    if (!userId) redirect("/login");

    // Fetch dashboard data from the server
    const dashboardData = await dashboardService.getDashboardData(userId, {
      includeCurrentMonth: true,
      includePreviousMonth: true,
      currency,
    });

    // Fetch accounts and categories for transaction modal
    const userAccounts = await accountService.getUserAccounts(userId);
    const userCategories = await categoryService.getUserCategories(userId);
    const transferCategory = await categoryService.getSystemTransferCategory();

    const accountOptions = userAccounts.map((a) => ({ label: a.name, value: a.id, currency: a.currency }));

    return (
      <DashboardPageShell
        currency={dashboardData.currency}
        currencyBalances={dashboardData.currencyBalances}
        netWorth={dashboardData.netWorth}
        accountBalances={dashboardData.accountBalances}
        monthlyTotals={dashboardData.monthlyTotals}
        sixMonthHistory={dashboardData.sixMonthHistory}
        accountOptions={accountOptions}
        categoryOptions={userCategories}
        transferCategoryId={transferCategory.id}
      />
    );
  } catch (error) {
    handleServerError(error);
  }
};

export default DashboardPage;
