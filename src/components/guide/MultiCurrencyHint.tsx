"use client";

import { Button, Icon } from "@/components/ui";
import { guideService } from "@/lib/client/services";
import { AppError } from "@/lib/errors/AppError";
import { showError } from "@/lib/utils/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  /** The currency the dashboard is showing right now */
  currency: string;
  currencies: string[];
};

/**
 * Shown once, when the user ends up with accounts in more than one currency and has never picked a
 * default. It goes away on its own when they save a default currency, or when they dismiss it.
 */
export const MultiCurrencyHint = ({ currency, currencies }: Props) => {
  const router = useRouter();
  const [isDismissing, setIsDismissing] = useState(false);

  const handleDismiss = async () => {
    try {
      setIsDismissing(true);
      await guideService.dismissTip("multi-currency");
      router.refresh();
    } catch (error) {
      showError(error instanceof AppError ? error.message : "Couldn't hide the tip");
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4"
    >
      <div className="min-w-0 flex-1 text-xs sm:text-sm text-blue-900">
        <p className="font-medium">You have accounts in {currencies.join(" and ")}</p>
        <p className="mt-1 text-blue-800">
          Your dashboard is showing {currency}. Switch currency from the net worth card, use All to
          see every currency converted to your home currency, or choose what the dashboard opens on
          in Settings.
        </p>
        <Button className="mt-3" variant="outline" size="sm" onClick={() => router.push("/settings")}>
          Open settings
        </Button>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        disabled={isDismissing}
        aria-label="Dismiss tip"
        className="rounded p-1 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
      >
        <Icon name="close" className="size-4" />
      </button>
    </div>
  );
};
