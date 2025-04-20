import { accountService } from "@/lib/server/services";
import { PageShell } from "@/components/PageShell";
import { AccountsTable, AccountsPageActions } from "./_components";

const AccountsPage = async () => {
  const accounts = await accountService.getAccounts();

  return (
    <PageShell
      title="Your Accounts"
      subtitle="See and manage all your accounts in one place"
    >
      <AccountsPageActions />
      <AccountsTable data={accounts} />
    </PageShell>
  );
};

export default AccountsPage;