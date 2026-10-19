"use client";

import { Button, Icon } from "@/components/ui";
import { useTransactionModal } from "@/lib/providers/TransactionModalProvider";
import { usePathname } from "next/navigation";

export const FloatingTransactionButton = () => {
  const { openModal, isLoading } = useTransactionModal();
  const pathname = usePathname();
  
  // Don't show on login page
  if (pathname.startsWith("/login")) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={openModal}
        variant="primary"
        size="lg"
        disabled={isLoading}
        className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center"
        aria-label="Add new transaction"
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Icon name="plus" className="w-6 h-6" />
        )}
      </Button>
    </div>
  );
};
