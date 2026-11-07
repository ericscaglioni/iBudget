"use client";

import { ClientOnlyCurrency } from "@/components/ui";
import { budgetService } from "@/lib/client/services";
import { calendarMonthString } from "@/lib/utils/format";
import { useEffect, useState, type ReactNode } from "react";

type Props = {
  direction: "in" | "out";
  amount: string;
  date: string;
  currency?: string;
  originalAmount?: number;
  originalMonth?: string;
};

export const BudgetExchangeHint = ({
  direction,
  amount,
  date,
  currency,
  originalAmount = 0,
  originalMonth,
}: Props) => {
  const [status, setStatus] = useState<{ expected: number | null; actual: number } | null>(null);
  const yearMonth = date ? calendarMonthString(date) : "";
  const typed = Number(amount);

  useEffect(() => {
    if (!currency || !yearMonth) {
      setStatus(null);
      return;
    }
    let cancelled = false;
    budgetService
      .getExchangeStatus({ yearMonth, currency, direction })
      .then((result) => {
        if (!cancelled) setStatus(result);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, [currency, yearMonth, direction]);

  const expected = status?.expected ?? null;
  const showHint =
    expected != null && expected > 0 && Boolean(currency) && Number.isFinite(typed) && typed >= 0;

  let body: ReactNode = null;
  if (showHint && status && currency && expected != null) {
    const sameLine = originalMonth === yearMonth && originalAmount > 0;
    const remaining = expected - (status.actual - (sameLine ? originalAmount : 0) + typed);
    const label = direction === "in" ? "expected from other currencies" : "expected to other currencies";
    body =
      remaining >= 0 ? (
        <>
          <ClientOnlyCurrency value={remaining} currency={currency} /> left of{" "}
          <ClientOnlyCurrency value={expected} currency={currency} /> {label}
        </>
      ) : direction === "in" ? (
        <span className="text-income">
          <ClientOnlyCurrency value={Math.abs(remaining)} currency={currency} /> more than {label}
        </span>
      ) : (
        <span className="text-expense">
          <ClientOnlyCurrency value={Math.abs(remaining)} currency={currency} /> over {label}
        </span>
      );
  }

  return (
    <p className="min-h-5 text-xs sm:text-sm text-muted" aria-live="polite">
      {body}
    </p>
  );
};
