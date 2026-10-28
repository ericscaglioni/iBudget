"use client";

import { Button, Icon } from "@/components/ui";
import { useTransactionModal } from "@/lib/providers/TransactionModalProvider";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const HINT_KEY = "ibudget:seen-new-transaction";

export const FloatingTransactionButton = () => {
  const { openModal, isLoading } = useTransactionModal();
  const pathname = usePathname();
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setShowHint(window.localStorage.getItem(HINT_KEY) !== "1");
  }, []);

  if (pathname.startsWith("/login")) return null;

  const handleOpen = () => {
    window.localStorage.setItem(HINT_KEY, "1");
    setShowHint(false);
    openModal();
  };

  const dismissHint = () => {
    window.localStorage.setItem(HINT_KEY, "1");
    setShowHint(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {showHint && !isLoading && (
        <div className="relative max-w-[14rem] rounded-md border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm text-gray-700 shadow-lg">
          <p className="pr-5">Add a transaction from any page.</p>
          <button
            type="button"
            onClick={dismissHint}
            className="absolute right-1 top-1 rounded-sm p-0.5 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="Dismiss"
          >
            <Icon name="close" className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <Button
        onClick={handleOpen}
        variant="primary"
        size="lg"
        disabled={isLoading}
        className="rounded-full h-14 px-4 sm:px-5 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 gap-2"
        aria-label="New transaction"
      >
        {isLoading ? (
          <span className="size-6 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Icon name="plus" className="w-6 h-6" />
        )}
        <span className="pr-1">
          <span className="sm:hidden">New</span>
          <span className="hidden sm:inline">New transaction</span>
        </span>
      </Button>
    </div>
  );
};
