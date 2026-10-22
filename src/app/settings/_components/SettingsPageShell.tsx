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
  // With a single currency there is nothing to choose between yet
  const hasSeveralCurrencies = availableCurrencies.length > 1;
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

        {hasSeveralCurrencies ? (
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
        ) : hasAccounts ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Your dashboard shows <span className="font-medium text-gray-900">{availableCurrencies[0]}</span>, the
              currency of your accounts.
            </p>
            <p className="text-sm text-gray-600">
              Once you add an account in another currency, you&apos;ll be able to choose here which one the dashboard
              opens in.{" "}
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
            to choose a default currency.
          </p>
        )}
      </div>
    </PageShell>
  );
};
