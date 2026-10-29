import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { accountService, categoryService, dashboardService, guideService } from "@/lib/server/services";
import { initializeUserDefaults } from "@/lib/server/utils/initializeUserDefaults";
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
    const { currency: currencyParam, view: viewParam } = await searchParams;
    const currency = typeof currencyParam === "string" && accountCurrencies.includes(currencyParam)
      ? currencyParam
      : undefined;
    const view = viewParam === "all" ? "all" as const : undefined;

    const { userId } = await auth();
    if (!userId) redirect("/login");

    // Webhook often never reaches localhost; fill users + default categories on first visit
    await initializeUserDefaults(userId);

    // Fetch dashboard data from the server
    const dashboardData = await dashboardService.getDashboardData(userId, {
      includeCurrentMonth: true,
      includePreviousMonth: true,
      currency,
      view,
    });

    // Fetch accounts and categories for transaction modal
    const userAccounts = await accountService.getUserAccounts(userId);
    const userCategories = await categoryService.getUserCategories(userId);
    const transferCategory = await categoryService.getSystemTransferCategory();
    const guide = await guideService.getGuide(userId);

    const accountOptions = userAccounts.map((a) => ({ label: a.name, value: a.id, currency: a.currency }));

    return (
      <DashboardPageShell
        currency={dashboardData.currency}
        view={dashboardData.view}
        homeCurrency={dashboardData.homeCurrency}
        currencyBalances={dashboardData.currencyBalances}
        netWorth={dashboardData.netWorth}
        accountBalances={dashboardData.accountBalances}
        monthlyTotals={dashboardData.monthlyTotals}
        sixMonthHistory={dashboardData.sixMonthHistory}
        ratesAsOf={dashboardData.ratesAsOf}
        ratesError={dashboardData.ratesError}
        accountOptions={accountOptions}
        categoryOptions={userCategories}
        transferCategoryId={transferCategory.id}
        guide={guide}
      />
    );
  } catch (error) {
    handleServerError(error);
  }
};

export default DashboardPage;
