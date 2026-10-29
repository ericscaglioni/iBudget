"use client";

import { PageShell } from "@/components";
import { Button, Combobox, FieldLabel, SegmentedControl } from "@/components/ui";
import { settingsService } from "@/lib/client/services";
import { AppError } from "@/lib/errors/AppError";
import { showError, showSuccess } from "@/lib/utils/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  defaultCurrency: string;
  availableCurrencies: string[];
  openDashboardOn: "home" | "all";
}

export const SettingsPageShell = ({ defaultCurrency, availableCurrencies, openDashboardOn }: Props) => {
  const router = useRouter();
  const [currency, setCurrency] = useState(defaultCurrency);
  const [landing, setLanding] = useState<"home" | "all">(openDashboardOn);
  const [isSaving, setIsSaving] = useState(false);

  const hasAccounts = availableCurrencies.length > 0;
  const hasSeveralCurrencies = availableCurrencies.length > 1;
  const isDirty = currency !== defaultCurrency || landing !== openDashboardOn;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await settingsService.updateSettings({
        defaultCurrency: currency,
        ...(hasSeveralCurrencies ? { openDashboardOn: landing } : {}),
      });
      showSuccess("Settings saved");
      router.refresh();
    } catch (error) {
      showError(error instanceof AppError || error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageShell title="Settings" subtitle="Manage your preferences.">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6 max-w-xl">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Home currency</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 mb-4">
          The currency All is converted into. You can still switch between your currencies from the
          dashboard at any time.
        </p>

        {hasSeveralCurrencies ? (
          <div className="space-y-6">
            <Combobox
              options={availableCurrencies.map((code) => ({ value: code, label: code }))}
              value={currency}
              onChange={setCurrency}
              placeholder="Select a currency"
            />

            <div>
              <FieldLabel htmlFor="open-dashboard-on">Open dashboard on</FieldLabel>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 mb-3">
                All shows every account converted to {currency}. You can change this whenever you
                like, including from the chips on the dashboard.
              </p>
              <SegmentedControl
                value={landing}
                onChange={(value) => setLanding(value as "home" | "all")}
                options={[
                  { value: "home", label: `Home (${currency})` },
                  { value: "all", label: "All currencies" },
                ]}
              />
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                isLoading={isSaving}
                disabled={!isDirty}
                className="w-full sm:w-auto"
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : hasAccounts ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Your dashboard shows <span className="font-medium text-gray-900">{availableCurrencies[0]}</span>, the
              currency of your accounts.
            </p>
            <p className="text-sm text-gray-600">
              Once you add an account in another currency, you can choose a home currency here and
              open the dashboard on All (converted into it).{" "}
              <Link href="/accounts?new=1" className="text-primary font-medium hover:underline">
                Add an account
              </Link>
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            You don&apos;t have any accounts yet.{" "}
            <Link href="/accounts?new=1" className="text-primary font-medium hover:underline">
              Create an account
            </Link>{" "}
            to choose a home currency.
          </p>
        )}
      </div>
    </PageShell>
  );
};
