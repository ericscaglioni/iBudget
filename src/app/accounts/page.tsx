import { accountService } from "@/lib/server/services";
import { AccountsPageShell } from "./_components";
import { parseQueryParams } from "@/lib/utils/parse-query";

interface Props {
  searchParams: Record<string, string | string[] | undefined>;
}

const AccountsPage = async ({ searchParams }: Props) => {
  const queryParams = await parseQueryParams(searchParams);

  const [accounts, totalCount] = await accountService.listAccounts(queryParams);

  return (
    <AccountsPageShell
      accounts={accounts}
      totalCount={totalCount}
      page={queryParams.page}
      pageSize={queryParams.pageSize}
    />
  );
};

export default AccountsPage;