import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { settingsService } from "@/lib/server/services";
import { handleServerError } from "@/lib/utils/server-error-handler";
import { SettingsPageShell } from "./_components";

// Force dynamic rendering since we use auth()
export const dynamic = "force-dynamic";

const SettingsPage = async () => {
  try {
    const { userId } = await auth();
    if (!userId) redirect("/login");

    const settings = await settingsService.getSettings(userId);

    return (
      <SettingsPageShell
        defaultCurrency={settings.defaultCurrency}
        availableCurrencies={settings.availableCurrencies}
      />
    );
  } catch (error) {
    handleServerError(error);
  }
};

export default SettingsPage;
