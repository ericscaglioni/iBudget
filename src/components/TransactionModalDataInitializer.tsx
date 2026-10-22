"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useTransactionModal } from "@/lib/providers/TransactionModalProvider";

export const TransactionModalDataInitializer = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const { refreshOptions, setIsLoading } = useTransactionModal();
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    // The root layout also renders on /login, where the API routes redirect to HTML.
    // Wait for Clerk, and only fetch once there is a session (re-runs after sign in).
    if (!isLoaded || !isSignedIn) return;

    const initializeData = async () => {
      // Navigating (e.g. from /accounts after creating one) quietly refreshes the lists.
      // Only the first load shows the spinner and reports errors.
      const isFirstLoad = !hasLoadedOnce.current;
      if (isFirstLoad) setIsLoading(true);

      await refreshOptions({ silent: !isFirstLoad });

      hasLoadedOnce.current = true;
      setIsLoading(false);
    };

    initializeData();
  }, [isLoaded, isSignedIn, pathname, refreshOptions, setIsLoading]);

  return null;
};
