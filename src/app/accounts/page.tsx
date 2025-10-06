import { accountService } from "@/lib/server/services";
import { AccountsPageShell } from "./_components";
import { parseQueryParams } from "@/lib/utils/parse-query";
import { handleServerError } from "@/lib/utils/server-error-handler";

interface Props {
  searchParams: Record<string, string | string[] | undefined>;
}

const AccountsPage = async ({ searchParams }: Props) => {
  try {
    const queryParams = await parseQueryParams(searchParams);
    const { accounts, total } = await accountService.listAccounts(queryParams);

    return (
      <AccountsPageShell
        accounts={accounts}
        totalCount={total}
        page={queryParams.page}
        pageSize={queryParams.pageSize}
      />
    );
  } catch (error) {
    handleServerError(error);
  }
};

export default AccountsPage;