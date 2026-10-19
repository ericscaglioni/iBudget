"use client";

import { PageShell } from "@/components";
import { Button, Combobox } from "@/components/ui";
import { settingsService } from "@/lib/client/services";
import { AppError } from "@/lib/errors/AppError";
import { showError, showSuccess } from "@/lib/utils/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  defaultCurrency: string;
  availableCurrencies: string[];
}

export const SettingsPageShell = ({ defaultCurrency, availableCurrencies }: Props) => {
  const router = useRouter();
  const [currency, setCurrency] = useState(defaultCurrency);
  const [isSaving, setIsSaving] = useState(false);

  const hasAccounts = availableCurrencies.length > 0;
  const isDirty = currency !== defaultCurrency;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await settingsService.updateSettings({ defaultCurrency: currency });
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
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Default currency</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 mb-4">
          The currency your dashboard opens in. You can still switch between your currencies from the dashboard.
        </p>

        {hasAccounts ? (
          <div className="space-y-4">
            <Combobox
              options={availableCurrencies.map((code) => ({ value: code, label: code }))}
              value={currency}
              onChange={setCurrency}
              placeholder="Select a currency"
            />

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
        ) : (
          <p className="text-sm text-gray-600">
            You don&apos;t have any accounts yet.{" "}
            <Link href="/accounts" className="text-primary font-medium hover:underline">
              Create an account
            </Link>{" "}
            to choose a default currency.
          </p>
        )}
      </div>
    </PageShell>
  );
};
