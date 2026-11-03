import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { accountCurrencies } from "@/lib/constants";
import { budgetService } from "@/lib/server/services";
import { initializeUserDefaults } from "@/lib/server/utils/initializeUserDefaults";
import { handleServerError } from "@/lib/utils/server-error-handler";
import { BudgetPageShell } from "./_components";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const BudgetPage = async ({ searchParams }: Props) => {
  try {
    const params = await searchParams;
    const currencyParam = typeof params.currency === "string" ? params.currency : undefined;
    const currency = currencyParam && accountCurrencies.includes(currencyParam) ? currencyParam : undefined;
    const view = params.view === "all" ? ("all" as const) : undefined;
    const yearMonth = typeof params.yearMonth === "string" ? params.yearMonth : undefined;

    const { userId } = await auth();
    if (!userId) redirect("/login");

    await initializeUserDefaults(userId);

    const budget = await budgetService.getBudget(userId, { yearMonth, currency, view });

    return <BudgetPageShell budget={budget} />;
  } catch (error) {
    handleServerError(error);
  }
};

export default BudgetPage;
