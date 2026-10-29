import { accountService, categoryService, settingsService, transactionService } from "@/lib/server/services";
import { parseQueryParams } from "@/lib/utils/parse-query";
import { TransactionsPageShell } from "./_components";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { handleServerError } from "@/lib/utils/server-error-handler";

// Force dynamic rendering since we use auth() and searchParams
export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const TransactionsPage = async ({ searchParams }: Props) => {
  try {
    const { userId } = await auth();
    if (!userId) redirect("/login");
    
    const resolvedSearchParams = await searchParams;
    const queryParams = await parseQueryParams(resolvedSearchParams);

    const [{ transactions, total }, totals, userAccounts, userCategories, transferCategory, settings] =
      await Promise.all([
        transactionService.getTransactionsByUser(userId, queryParams),
        transactionService.summarizeTransactionsByUser(userId, queryParams),
        accountService.getUserAccounts(userId),
        categoryService.getUserCategories(userId),
        categoryService.getSystemTransferCategory(),
        settingsService.getSettings(userId),
      ]);

    const accountOptions = userAccounts.map((a) => ({ label: a.name, value: a.id, currency: a.currency }));

    return (
      <TransactionsPageShell
        transactions={transactions}
        totalCount={total}
        totals={totals}
        preferredCurrency={settings.defaultCurrency}
        page={queryParams.page}
        pageSize={queryParams.pageSize}
        categoryOptions={userCategories}
        accountOptions={accountOptions}
        transferCategoryId={transferCategory.id}
      />
    );
  } catch (error) {
    handleServerError(error);
  }
};

export default TransactionsPage;