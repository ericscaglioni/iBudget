"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { dayjs } from "@/lib/utils/dayjs";

interface SixMonthBarChartProps {
  data: { month: string; income: number; expenses: number }[];
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 mb-2">
          {dayjs(label, "YYYY-MM").format("MMMM YYYY")}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Format currency helper
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format month for display
const formatMonth = (month: string): string => {
  return dayjs(month, "YYYY-MM").format("MMM YYYY");
};

export const SixMonthBarChart = ({ data }: SixMonthBarChartProps) => {
  // Transform data for Recharts
  const chartData = data.map(item => ({
    month: item.month,
    displayMonth: formatMonth(item.month),
    Income: item.income,
    Expenses: item.expenses,
  }));

  // Calculate max value for Y-axis scaling
  const maxValue = Math.max(
    ...chartData.flatMap(item => [item.Income, item.Expenses])
  );
  
  // Smart Y-axis scaling: always start from 0, scale appropriately
  let yAxisMax = 0;
  if (maxValue > 0) {
    // Add 10% padding but ensure we don't go too high
    yAxisMax = Math.ceil(maxValue * 1.1);
  } else {
    // If all values are 0, set a small scale
    yAxisMax = 100;
  }

  // Format Y-axis tick values
  const formatYAxisTick = (value: number) => {
    if (value === 0) return '$0';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value.toFixed(0)}`;
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          6-Month Trend
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p className="text-sm">No data available for the past 6 months</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 sm:mb-6 uppercase tracking-wide">
        6-Month Trend
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
              dataKey="displayMonth" 
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
            />
            <Tooltip content={<CustomTooltip />} />
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
