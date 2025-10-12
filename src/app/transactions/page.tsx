import { accountService, categoryService, transactionService } from "@/lib/server/services";
import { parseQueryParams } from "@/lib/utils/parse-query";
import { TransactionsPageShell } from "./_components";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { handleServerError } from "@/lib/utils/server-error-handler";

interface Props {
  searchParams: Record<string, string | string[] | undefined>;
}

const TransactionsPage = async ({ searchParams }: Props) => {
  try {
    const { userId } = await auth();
    if (!userId) redirect("/login");
    
    const queryParams = await parseQueryParams(searchParams);

    const { transactions, total } = await transactionService.getTransactionsByUser(userId, queryParams);
    const userAccounts = await accountService.getUserAccounts(userId);
    const userCategories = await categoryService.getUserCategories(userId);
    const transferCategory = await categoryService.getSystemTransferCategory();

    const accountOptions = userAccounts.map((a) => ({ label: a.name, value: a.id }));

    return (
      <TransactionsPageShell
        transactions={transactions}
        totalCount={total}
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