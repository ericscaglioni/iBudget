"use client";

import { ClientOnlyCurrency } from "@/components/ui";
import { useEffect, useId, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { sliceShare, toSpendingSlices, type SpendingCategory } from "./spending-slices";

type Props = {
  categories: SpendingCategory[];
  limit?: number;
  currency?: string;
};

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(query);
    const sync = () => setMatches(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [query]);

  return matches;
};

type SliceTooltipProps = {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
  currency: string;
};

const SliceTooltip = ({ active, payload, currency }: SliceTooltipProps) => {
  if (!active || !payload?.[0]) return null;
  const entry = payload[0];
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm shadow-lg">
      <p className="font-medium text-gray-900">{entry.name}</p>
      <p className="mt-0.5 tabular-nums text-gray-700">
        <ClientOnlyCurrency value={entry.value} currency={currency} />
      </p>
    </div>
  );
};

export const TopSpendingCategories = ({ categories, limit = 5, currency = "USD" }: Props) => {
  const headingId = useId();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const { slices, total } = toSpendingSlices(categories, limit);

  if (slices.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 text-center shadow-sm">
        <p className="text-gray-500 text-xs sm:text-sm">No spending data available for this period.</p>
      </div>
    );
  }

  const chartKey = slices.map((slice) => `${slice.id}:${slice.amount}`).join("|");

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm"
    >
      <h3
        id={headingId}
        className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 sm:mb-4 uppercase tracking-wide"
      >
        Spending this month
      </h3>

      <div className="grid grid-cols-1 items-center gap-4 sm:gap-6 md:grid-cols-2 md:gap-8">
        <div className="flex justify-center">
          <div
            className="relative aspect-square w-60 shrink-0 select-none sm:w-64 md:w-80 lg:w-96 [-webkit-tap-highlight-color:transparent] [&_svg]:outline-none [&_g]:outline-none [&_path]:outline-none"
            onFocusCapture={(event) => {
              if (event.target instanceof Element) event.target.blur();
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart
                accessibilityLayer={false}
                style={{ outline: "none", WebkitTapHighlightColor: "transparent" }}
              >
                <Pie
                  key={chartKey}
                  data={slices}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="62%"
                  outerRadius="90%"
                  paddingAngle={slices.length > 1 ? 2 : 0}
                  startAngle={90}
                  endAngle={-270}
                  stroke="#ffffff"
                  strokeWidth={2}
                  isAnimationActive={!reducedMotion}
                  animationBegin={0}
                  animationDuration={900}
                  animationEasing="ease-out"
                  rootTabIndex={-1}
                >
                  {slices.map((slice) => (
                    <Cell key={slice.id} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip content={<SliceTooltip currency={currency} />} cursor={false} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center md:px-14">
              <span className="text-xs font-medium uppercase tracking-wide text-grayNeutral">
                Spent
              </span>
              <ClientOnlyCurrency
                value={total}
                currency={currency}
                className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 tabular-nums"
              />
            </div>
          </div>
        </div>

        <ul className="w-full min-w-0 space-y-1.5 sm:space-y-2 md:space-y-3">
          {slices.map((slice) => (
            <li
              key={slice.id}
              className="flex items-center justify-between gap-3 rounded-md px-1.5 py-1 sm:px-2 md:py-1.5"
            >
              <span className="flex min-w-0 items-center gap-2 sm:gap-3">
                <span
                  className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 rounded-full ring-2 ring-white shadow-sm"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden
                />
                <span className="truncate text-xs sm:text-sm font-medium text-gray-700">
                  {slice.name}
                </span>
              </span>
              <span className="shrink-0 text-right text-xs sm:text-sm tabular-nums">
                <ClientOnlyCurrency
                  value={slice.amount}
                  currency={currency}
                  className="font-semibold text-gray-900"
                />
                <span className="ml-2 text-grayNeutral">{sliceShare(slice.amount, total)}%</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
