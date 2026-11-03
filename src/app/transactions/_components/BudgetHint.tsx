"use client";

import { ClientOnlyCurrency } from "@/components/ui";
import { budgetService } from "@/lib/client/services";
import { calendarMonthString } from "@/lib/utils/format";
import { useEffect, useState, type ReactNode } from "react";

type Props = {
  categoryId: string;
  amount: string;
  date: string;
  currency?: string;
  originalAmount?: number;
  originalCategoryId?: string;
  originalMonth?: string;
};

export const BudgetHint = ({
  categoryId,
  amount,
  date,
  currency,
  originalAmount = 0,
  originalCategoryId,
  originalMonth,
}: Props) => {
  const [status, setStatus] = useState<{ expected: number | null; actual: number } | null>(null);
  const yearMonth = date ? calendarMonthString(date) : "";
  const typed = Number(amount);

  useEffect(() => {
    if (!categoryId || !currency || !yearMonth) {
      setStatus(null);
      return;
    }
    let cancelled = false;
    budgetService
      .getCategoryStatus({ categoryId, yearMonth, currency })
      .then((result) => {
        if (!cancelled) setStatus(result);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId, currency, yearMonth]);

  const expected = status?.expected ?? null;
  const showHint =
    expected != null && expected > 0 && Boolean(currency) && Number.isFinite(typed) && typed >= 0;

  let body: ReactNode = null;
  if (showHint && status && currency && expected != null) {
    const sameLine =
      originalCategoryId === categoryId && originalMonth === yearMonth && originalAmount > 0;
    const remaining = expected - (status.actual - (sameLine ? originalAmount : 0) + typed);
    body =
      remaining >= 0 ? (
        <>
          <ClientOnlyCurrency value={remaining} currency={currency} /> left of{" "}
          <ClientOnlyCurrency value={expected} currency={currency} /> expected
        </>
      ) : (
        <span className="text-red-600">
          <ClientOnlyCurrency value={Math.abs(remaining)} currency={currency} /> over expected
        </span>
      );
  }

  return (
    <p className="min-h-5 text-xs sm:text-sm text-gray-600" aria-live="polite">
      {body}
    </p>
  );
};
