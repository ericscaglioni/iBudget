"use client";

import { Button, ClientOnlyCurrency, Collapsible } from "@/components/ui";
import clsx from "clsx";
import { useEffect, useId, useState } from "react";

export type TransactionTotalsRow = {
  currency: string;
  income: number;
  expenses: number;
  net: number;
};

type Props = {
  totals: TransactionTotalsRow[];
  isPending?: boolean;
  /** Currency to keep visible when the rest are collapsed (the user's default, if present). */
  preferredCurrency?: string;
};

const amountClass = "min-w-0 py-1 pl-3 text-right tabular-nums text-xs sm:text-sm";

const orderTotals = (totals: TransactionTotalsRow[], preferredCurrency?: string) => {
  if (!preferredCurrency) return totals;
  const featured = totals.find((row) => row.currency === preferredCurrency);
  if (!featured) return totals;
  return [featured, ...totals.filter((row) => row.currency !== preferredCurrency)];
};

const TotalsTable = ({
  rows,
  labelledBy,
  showHeader,
}: {
  rows: TransactionTotalsRow[];
  labelledBy?: string;
  showHeader: boolean;
}) => (
  <table className="w-full min-w-0 table-fixed" aria-labelledby={labelledBy}>
    <colgroup>
      <col className="w-[3.25rem] sm:w-[4.5rem]" />
      <col />
      <col />
      <col />
    </colgroup>
    {showHeader && (
      <thead>
        <tr>
          <th scope="col" className="py-0.5 pr-2 text-left text-xs font-medium text-grayNeutral">
            <span className="sr-only">Currency</span>
          </th>
          <th scope="col" className="py-0.5 pl-3 text-right text-xs font-medium text-grayNeutral">
            Income
          </th>
          <th scope="col" className="py-0.5 pl-3 text-right text-xs font-medium text-grayNeutral">
            Expenses
          </th>
          <th scope="col" className="py-0.5 pl-3 text-right text-xs font-medium text-grayNeutral">
            Net
          </th>
        </tr>
      </thead>
    )}
    <tbody>
      {rows.map((row) => (
        <tr key={row.currency}>
          <th
            scope="row"
            className="py-1 pr-2 text-left text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap"
          >
            {row.currency}
          </th>
          <td className={clsx(amountClass, "text-green-700")}>
            <ClientOnlyCurrency className="block truncate" value={row.income} currency={row.currency} />
          </td>
          <td className={clsx(amountClass, "text-red-700")}>
            <ClientOnlyCurrency className="block truncate" value={row.expenses} currency={row.currency} />
          </td>
          <td className={clsx(amountClass, row.net < 0 ? "text-red-700" : "text-green-700")}>
            <ClientOnlyCurrency className="block truncate" value={row.net} currency={row.currency} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const TransactionTotals = ({ totals, isPending = false, preferredCurrency }: Props) => {
  const headingId = useId();
  const extraId = useId();
  const [expanded, setExpanded] = useState(false);
  const ordered = orderTotals(totals, preferredCurrency);
  const featured = ordered[0];
  const extra = ordered.slice(1);
  const extraKey = extra.map((row) => row.currency).join(",");

  useEffect(() => {
    setExpanded(false);
  }, [extraKey]);

  if (totals.length === 0 || !featured) return null;

  return (
    <section
      className={clsx(
        "mb-3 rounded-md border border-gray-200 bg-white px-3 py-2.5 shadow-sm sm:px-4 sm:py-3",
        isPending && "opacity-60"
      )}
      aria-busy={isPending || undefined}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h2
          id={headingId}
          className="text-xs font-medium uppercase tracking-wide text-grayNeutral"
        >
          Totals for these filters
        </h2>
        {extra.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 px-2 py-1 text-xs"
            aria-expanded={expanded}
            aria-controls={extraId}
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? "Show less" : "View all"}
          </Button>
        )}
      </div>
      <TotalsTable rows={[featured]} labelledBy={headingId} showHeader />
      {extra.length > 0 && (
        <Collapsible open={expanded} id={extraId}>
          <TotalsTable rows={extra} showHeader={false} />
        </Collapsible>
      )}
    </section>
  );
};
