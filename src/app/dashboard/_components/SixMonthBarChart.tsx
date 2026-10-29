"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatMonthYear } from "@/lib/utils/format";

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
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 mb-2">
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
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          6-Month Trend
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p className="text-sm">No data available for these months</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 sm:mb-6 uppercase tracking-wide">
        6-Month Trend <span className="text-gray-400 font-normal normal-case">({currency})</span>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month"
              tickFormatter={(value: string) => formatMonthYear(value)}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
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
              fill="#10b981" 
              radius={[2, 2, 0, 0]}
              name="Income"
            />
            <Bar 
              dataKey="Expenses" 
              fill="#ef4444" 
              radius={[2, 2, 0, 0]}
              name="Expenses"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
