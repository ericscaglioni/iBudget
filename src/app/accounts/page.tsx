import { accountService } from "@/lib/server/services";
import { AccountsPageShell } from "./_components";

const AccountsPage = async () => {
  const accounts = await accountService.getAccounts();

  return (
    <AccountsPageShell accounts={accounts} />
  );
};

export default AccountsPage;