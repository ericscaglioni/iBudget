import { accountService, categoryService, transactionService } from "@/lib/server/services";
import { parseQueryParams } from "@/lib/utils/parse-query"; // I'll give you this helper
import { TransactionsPageShell } from "./_components";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

interface Props {
  searchParams: Record<string, string | string[] | undefined>;
}

const TransactionsPage = async ({ searchParams }: Props) => {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  
  const queryParams = await parseQueryParams(searchParams);

  const [transactions, totalCount] = await transactionService.getTransactionsByUser(userId, queryParams);
  const userAccounts = await accountService.getUserAccounts(userId);
  const userCategories = await categoryService.getUserCategories(userId);

  const accountOptions = userAccounts.map((a) => ({ label: a.name, value: a.id }));

  return (
    <TransactionsPageShell
      transactions={transactions}
      totalCount={totalCount}
      page={queryParams.page}
      pageSize={queryParams.pageSize}
      categoryOptions={userCategories}
      accountOptions={accountOptions}
    />
  );
}

export default TransactionsPage;