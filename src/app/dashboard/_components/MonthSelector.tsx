"use client";

import { Icon } from "@/components/ui";
import { dayjs } from "@/lib/utils/dayjs";

interface Props {
  selectedMonth: string; // Format: YYYY-MM
  onMonthChange: (month: string) => void;
}

export const MonthSelector = ({ selectedMonth, onMonthChange }: Props) => {
  const handlePreviousMonth = () => {
    const newMonth = dayjs(selectedMonth, "YYYY-MM").subtract(1, "month").format("YYYY-MM");
    onMonthChange(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = dayjs(selectedMonth, "YYYY-MM").add(1, "month").format("YYYY-MM");
    onMonthChange(newMonth);
  };

  const handleCurrentMonth = () => {
    const currentMonth = dayjs().format("YYYY-MM");
    onMonthChange(currentMonth);
  };

  const displayMonth = dayjs(selectedMonth, "YYYY-MM").format("MMMM YYYY");
  const isCurrentMonth = selectedMonth === dayjs().format("YYYY-MM");

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Month Display with Navigation */}
          <div className="flex items-center gap-1 sm:gap-3 flex-1 min-w-0">
            <button
              onClick={handlePreviousMonth}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Previous month"
            >
              <Icon name="chevronLeft" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>

            <h2 className="text-base sm:text-xl font-semibold text-gray-900 text-center flex-1 truncate px-1">
              {displayMonth}
            </h2>

            <button
              onClick={handleNextMonth}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Next month"
            >
              <Icon name="chevronRight" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
          </div>

          {/* Right: Current Month Button */}
          {!isCurrentMonth && (
            <button
              onClick={handleCurrentMonth}
              className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
            >
              <span className="hidden sm:inline">Current Month</span>
              <span className="sm:hidden">Today</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

