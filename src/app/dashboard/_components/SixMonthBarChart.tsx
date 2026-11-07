"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatMonthYear } from "@/lib/utils/format";
import { useEffect, useState } from "react";

const forestChart = {
  light: { income: "#2F9E6B", expense: "#C2413B", grid: "#E6E2DB", muted: "#6B726E" },
  dark: { income: "#4ABA7A", expense: "#E06A64", grid: "#2A322E", muted: "#9AA39C" },
};

const useForestChart = () => {
  const [palette, setPalette] = useState(forestChart.light);
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setPalette(root.classList.contains("dark") ? forestChart.dark : forestChart.light);
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return palette;
};

interface SixMonthBarChartProps {
  data: { month: string; income: number; expenses: number }[];
  currency: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label, currency }: TooltipProps & { currency: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-line rounded-lg p-3">
        <p className="text-sm font-medium text-ink mb-2">
          {label ? formatMonthYear(label, true) : ""}
        </p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value, currency)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatCompactCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

export const SixMonthBarChart = ({ data, currency }: SixMonthBarChartProps) => {
  const palette = useForestChart();
  const chartData = data.map(item => ({
    month: item.month,
    Income: item.income,
    Expenses: item.expenses,
  }));

  const maxValue = Math.max(
    ...chartData.flatMap(item => [item.Income, item.Expenses])
  );
  
  const calculateYAxisConfig = (max: number): { yAxisMax: number; stepSize: number } => {
    if (max === 0) return { yAxisMax: 100, stepSize: 20 };
    
    let stepSize: number;
    if (max <= 100) stepSize = 20;
    else if (max <= 500) stepSize = 100;
    else if (max <= 2000) stepSize = 500;
    else if (max <= 10000) stepSize = 1000;
    else if (max <= 50000) stepSize = 5000;
    else if (max <= 100000) stepSize = 10000;
    else stepSize = 50000;
    
    const roundedMax = Math.ceil(max / stepSize) * stepSize;
    const yAxisMax = roundedMax === max ? roundedMax + stepSize : roundedMax;
    
    return { yAxisMax, stepSize };
  };
  
  const { yAxisMax, stepSize } = calculateYAxisConfig(maxValue);
  
  const generateTicks = (max: number, step: number): number[] => {
    const ticks: number[] = [];
    for (let i = 0; i <= max; i += step) {
      ticks.push(i);
    }
    return ticks;
  };
  
  const yAxisTicks = generateTicks(yAxisMax, stepSize);

  const formatYAxisTick = (value: number) => formatCompactCurrency(value, currency);

  if (chartData.length === 0) {
    return (
      <div className="bg-surface border border-line rounded-lg p-6 ">
        <h3 className="text-sm font-semibold text-ink mb-4 uppercase tracking-wide">
          6-Month Trend
        </h3>
        <div className="flex items-center justify-center h-64 text-muted">
          <p className="text-sm">No data available for these months</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-line rounded-lg p-4 sm:p-6 ">
      <h3 className="text-sm font-semibold text-ink mb-4 sm:mb-6 uppercase tracking-wide">
        6-Month Trend <span className="text-muted font-normal normal-case">({currency})</span>
      </h3>
      
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} />
            <XAxis 
              dataKey="month"
              tickFormatter={(value: string) => formatMonthYear(value)}
              tick={{ fontSize: 12, fill: palette.muted }}
              axisLine={{ stroke: palette.grid }}
              tickLine={{ stroke: palette.grid }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: palette.muted }}
              axisLine={{ stroke: palette.grid }}
              tickLine={{ stroke: palette.grid }}
              tickFormatter={formatYAxisTick}
              domain={[0, yAxisMax]}
              ticks={yAxisTicks}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend 
              wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
            />
            <Bar 
              dataKey="Income" 
              fill={palette.income} 
              radius={[2, 2, 0, 0]}
              name="Income"
            />
            <Bar 
              dataKey="Expenses" 
              fill={palette.expense} 
              radius={[2, 2, 0, 0]}
              name="Expenses"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
