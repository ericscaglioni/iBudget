"use client";

import { PageShell } from "@/components";
import { ClientOnlyCurrency, ConfirmationModal, EmptyState, Icon, Input } from "@/components/ui";
import { budgetService } from "@/lib/client/services";
import type { BudgetData, BudgetLine } from "@/lib/client/services/budget";
import { formatMonthYear, shiftCalendarMonth } from "@/lib/utils/format";
import { showError, showSuccess } from "@/lib/utils/toast";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type Props = {
  budget: BudgetData;
};

const hrefFor = (yearMonth: string, currency: string, view: "currency" | "all") =>
  view === "all" ? `/budget?view=all&yearMonth=${yearMonth}` : `/budget?currency=${currency}&yearMonth=${yearMonth}`;

const ExpectedBar = ({ actual, expected }: { actual: number; expected: number | null }) => {
  if (expected == null || expected <= 0) {
    if (actual <= 0) return <div className="h-1.5 rounded-full bg-gray-100" />;
    return (
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full w-full bg-gray-300" />
      </div>
    );
  }
  const over = actual > expected;
  const width = Math.min(100, (actual / expected) * 100);
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full ${over ? "bg-red-500" : "bg-primary"}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

const LineRow = ({
  line,
  currency,
  canEdit,
  onSave,
}: {
  line: BudgetLine;
  currency: string;
  canEdit: boolean;
  onSave: (categoryId: string, amount: number) => Promise<void>;
}) => {
  const [draft, setDraft] = useState(line.expected == null ? "" : String(line.expected));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(line.expected == null ? "" : String(line.expected));
  }, [line.expected]);

  const commit = async () => {
    const parsed = draft.trim() === "" ? 0 : Number(draft);
    const current = line.expected ?? 0;
    if (!Number.isFinite(parsed) || parsed < 0) {
      setDraft(line.expected == null ? "" : String(line.expected));
      return;
    }
    if (parsed === current) return;
    setSaving(true);
    try {
      await onSave(line.categoryId, parsed);
    } finally {
      setSaving(false);
    }
  };

  const remaining = line.expected != null ? line.expected - line.actual : null;
  const unplanned = line.expected == null && line.actual > 0;

  return (
    <li className="space-y-1.5 rounded-md px-1.5 py-2 sm:px-2">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span
            className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 rounded-full ring-2 ring-white shadow-sm"
            style={{ backgroundColor: line.color }}
            aria-hidden
          />
          <span className="truncate text-xs sm:text-sm font-medium text-gray-700">{line.name}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3 text-xs sm:text-sm tabular-nums">
          {canEdit ? (
            <div className="w-24">
              <Input
                aria-label={`Expected for ${line.name}`}
                type="number"
                step="0.01"
                min="0"
                value={draft}
                disabled={saving}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={() => void commit()}
                onKeyDown={(event) => {
                  if (event.key === "Enter") (event.target as HTMLInputElement).blur();
                }}
              />
            </div>
          ) : (
            <ClientOnlyCurrency
              value={line.expected ?? 0}
              currency={currency}
              className={line.expected == null ? "text-grayNeutral" : "font-medium text-gray-900"}
            />
          )}
          <ClientOnlyCurrency value={line.actual} currency={currency} className="font-semibold text-gray-900 w-[5.5rem] text-right" />
        </span>
      </div>
      <ExpectedBar actual={line.actual} expected={line.expected} />
      <p className="text-xs text-grayNeutral">
        {unplanned && "Unplanned spend"}
        {remaining != null && remaining >= 0 && (
          <>
            <ClientOnlyCurrency value={remaining} currency={currency} /> left of expected
          </>
        )}
        {remaining != null && remaining < 0 && (
          <span className="text-red-600">
            <ClientOnlyCurrency value={Math.abs(remaining)} currency={currency} /> over expected
          </span>
        )}
      </p>
    </li>
  );
};

export const BudgetPageShell = ({ budget: initial }: Props) => {
  const router = useRouter();
  const [budget, setBudget] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [confirmCopy, setConfirmCopy] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    setBudget(initial);
  }, [initial]);

  const go = (yearMonth: string, currency: string, view: "currency" | "all") => {
    startTransition(() => {
      router.replace(hrefFor(yearMonth, currency, view));
    });
  };

  const handleSave = async (categoryId: string, expectedAmount: number) => {
    try {
      const next = await budgetService.upsertExpected({
        yearMonth: budget.yearMonth,
        currency: budget.currency,
        categoryId,
        expectedAmount,
      });
      setBudget(next);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Couldn't save that expected amount.");
    }
  };

  const runCopy = async (overwrite: boolean) => {
    setCopying(true);
    try {
      const next = await budgetService.copyPreviousMonth({
        yearMonth: budget.yearMonth,
        currency: budget.view === "all" ? undefined : budget.currency,
        view: budget.view === "all" ? "all" : undefined,
        overwrite,
      });
      setBudget(next);
      showSuccess(
        budget.copyFromMonth
          ? `Copied the plan from ${formatMonthYear(budget.copyFromMonth, true)}.`
          : "Copied the previous plan."
      );
    } catch (error) {
      showError(error instanceof Error ? error.message : "Couldn't copy the previous month.");
      throw error;
    } finally {
      setCopying(false);
    }
  };

  const handleCopy = async () => {
    if (budget.hasPlan) {
      setConfirmCopy(true);
      return;
    }
    try {
      await runCopy(false);
    } catch {
      // toast already shown
    }
  };

  const noCategories = budget.income.length === 0 && budget.expenses.length === 0;
  const showSwitcher = budget.availableCurrencies.length > 1;
  const allActive = budget.view === "all";

  return (
    <>
      <PageShell
        title="Budget"
        subtitle="Expected income and expenses for the month. These are targets, not limits."
        actionButton={{
          text: "Copy previous month",
          variant: "primary",
          size: "lg",
          onClick: handleCopy,
          disabled: copying || isPending || !budget.copyFromMonth,
          title: budget.copyFromMonth ? undefined : "No earlier month to copy from",
        }}
      >
        <div className="space-y-4 sm:space-y-6">
          {budget.ratesError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="status">
              {budget.ratesError}
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white p-2 sm:p-4 shadow-sm">
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => go(shiftCalendarMonth(budget.yearMonth, -1), budget.currency, budget.view)}
                  className="flex-shrink-0 rounded-lg p-1.5 hover:bg-gray-100 sm:p-2"
                  aria-label="Previous month"
                  disabled={isPending}
                >
                  <Icon name="chevronLeft" className="h-4 w-4 text-gray-600 sm:h-5 sm:w-5" />
                </button>
                <h2 className="px-2 text-center text-sm font-semibold text-gray-900 sm:text-lg">
                  {formatMonthYear(budget.yearMonth, true)}
                  <span className="ml-2 text-xs font-normal text-gray-400 sm:text-sm">({budget.currency})</span>
                </h2>
                <button
                  type="button"
                  onClick={() => go(shiftCalendarMonth(budget.yearMonth, 1), budget.currency, budget.view)}
                  className="flex-shrink-0 rounded-lg p-1.5 hover:bg-gray-100 sm:p-2"
                  aria-label="Next month"
                  disabled={isPending}
                >
                  <Icon name="chevronRight" className="h-4 w-4 text-gray-600 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
            {allActive && budget.ratesAsOf && (
              <p className="mt-2 text-center text-xs text-gray-500">
                Converted to {budget.homeCurrency} · rates as of {budget.ratesAsOf}. Switch to a currency to edit.
              </p>
            )}
          </div>

          {showSwitcher && (
            <div className="flex flex-wrap items-center gap-2">
              {budget.availableCurrencies.map((code) => {
                const active = !allActive && code === budget.currency;
                return (
                  <button
                    key={code}
                    type="button"
                    disabled={isPending}
                    onClick={() => go(budget.yearMonth, code, "currency")}
                    className={`rounded-full px-3 py-1 text-xs font-medium sm:text-sm ${
                      active ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {code}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={isPending || Boolean(budget.ratesError)}
                onClick={() => go(budget.yearMonth, budget.homeCurrency, "all")}
                className={`rounded-full px-3 py-1 text-xs font-medium sm:text-sm ${
                  allActive ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm sm:p-6">
              <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-green-700 sm:mb-2 sm:text-sm">
                Income
              </h3>
              <ClientOnlyCurrency
                value={budget.totals.actualIncome}
                currency={budget.currency}
                className="text-2xl font-bold text-green-900 sm:text-3xl"
              />
              <p className="mt-1 text-xs text-green-700 sm:text-sm">
                of{" "}
                <ClientOnlyCurrency value={budget.totals.expectedIncome} currency={budget.currency} /> expected
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm sm:p-6">
              <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-red-700 sm:mb-2 sm:text-sm">
                Expenses
              </h3>
              <ClientOnlyCurrency
                value={budget.totals.actualExpenses}
                currency={budget.currency}
                className="text-2xl font-bold text-red-900 sm:text-3xl"
              />
              <p
                className={`mt-1 text-xs sm:text-sm ${
                  budget.totals.actualExpenses > budget.totals.expectedExpenses && budget.totals.expectedExpenses > 0
                    ? "text-red-700"
                    : "text-red-700"
                }`}
              >
                of{" "}
                <ClientOnlyCurrency value={budget.totals.expectedExpenses} currency={budget.currency} /> expected
              </p>
            </div>
            <div
              className={`rounded-lg border p-4 shadow-sm sm:p-6 ${
                budget.totals.actualNet >= 0 ? "border-blue-200 bg-blue-50" : "border-orange-200 bg-orange-50"
              }`}
            >
              <h3
                className={`mb-1.5 text-xs font-medium uppercase tracking-wide sm:mb-2 sm:text-sm ${
                  budget.totals.actualNet >= 0 ? "text-blue-700" : "text-orange-700"
                }`}
              >
                Net
              </h3>
              <ClientOnlyCurrency
                value={budget.totals.actualNet}
                currency={budget.currency}
                className={`text-2xl font-bold sm:text-3xl ${
                  budget.totals.actualNet >= 0 ? "text-blue-900" : "text-orange-900"
                }`}
              />
              <p className={`mt-1 text-xs sm:text-sm ${budget.totals.actualNet >= 0 ? "text-blue-700" : "text-orange-700"}`}>
                of{" "}
                <ClientOnlyCurrency value={budget.totals.expectedNet} currency={budget.currency} /> expected
              </p>
            </div>
          </div>

          {noCategories ? (
            <EmptyState
              title="No categories yet"
              description="Categories are what you plan against, like Salary or Groceries. Create some, then come back to set expected amounts."
              action={{ label: "Go to Categories", onClick: () => router.push("/categories") }}
            />
          ) : (
            <>
              <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700 sm:text-sm">
                    Expected income
                  </h3>
                  <span className="text-xs text-grayNeutral sm:text-sm">Expected · actual</span>
                </div>
                <ul>
                  {budget.income.map((line) => (
                    <LineRow
                      key={line.categoryId}
                      line={line}
                      currency={budget.currency}
                      canEdit={budget.canEdit}
                      onSave={handleSave}
                    />
                  ))}
                </ul>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700 sm:text-sm">
                    Expected expenses
                  </h3>
                  <span className="text-xs text-grayNeutral sm:text-sm">Expected · actual</span>
                </div>
                <ul>
                  {budget.expenses.map((line) => (
                    <LineRow
                      key={line.categoryId}
                      line={line}
                      currency={budget.currency}
                      canEdit={budget.canEdit}
                      onSave={handleSave}
                    />
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </PageShell>

      <ConfirmationModal
        open={confirmCopy}
        onClose={() => setConfirmCopy(false)}
        onConfirm={() => runCopy(true)}
        title="Replace this month's plan?"
        description="This month already has expected amounts. Copying last month will override them."
        confirmLabel="Override"
      />
    </>
  );
};
