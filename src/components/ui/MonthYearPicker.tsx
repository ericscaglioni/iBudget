'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { Button } from './Button';
import { dayjs } from '@/lib/utils/dayjs.js';

interface Props {
  label?: string;
  value: string; // Format: YYYY-MM
  onChange: (value: string) => void;
  placeholder?: string;
}

export const MonthYearPicker = ({ label, value, onChange, placeholder = 'Month/Year' }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? dayjs(value, 'YYYY-MM') : dayjs());
  const containerRef = useRef<HTMLDivElement>(null);

  // Set current month as default on mount if no value provided
  useEffect(() => {
    if (!value) {
      const currentMonth = dayjs().format('YYYY-MM');
      onChange(currentMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update selectedDate when value changes externally
  useEffect(() => {
    if (value) {
      setSelectedDate(dayjs(value, 'YYYY-MM'));
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePreviousMonth = () => {
    const newDate = selectedDate.subtract(1, 'month');
    setSelectedDate(newDate);
    onChange(newDate.format('YYYY-MM'));
  };

  const handleNextMonth = () => {
    const newDate = selectedDate.add(1, 'month');
    setSelectedDate(newDate);
    onChange(newDate.format('YYYY-MM'));
  };

  const handleMonthSelect = (month: number) => {
    const newDate = selectedDate.month(month);
    setSelectedDate(newDate);
    onChange(newDate.format('YYYY-MM'));
    setIsOpen(false);
  };

  const handleYearChange = (increment: number) => {
    setSelectedDate(selectedDate.add(increment, 'year'));
  };

  const displayValue = value ? dayjs(value, 'YYYY-MM').format('MMMM YYYY') : placeholder;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonth = selectedDate.month();
  const currentYear = selectedDate.year();

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto">
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      
      <div className="flex items-stretch gap-1">
        {/* Previous Month Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousMonth}
          aria-label="Previous month"
          className="px-2 h-auto"
        >
          <Icon name="chevronLeft" className="w-4 h-4" />
        </Button>

        {/* Month/Year Display Input */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 min-w-[140px] sm:min-w-[180px] text-left border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white hover:bg-gray-50"
        >
          {displayValue}
        </button>

        {/* Next Month Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
          aria-label="Next month"
          className="px-2 h-auto"
        >
          <Icon name="chevronRight" className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg p-4">
          {/* Year Selector */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleYearChange(-1)}
              aria-label="Previous year"
              className="px-2"
            >
              <Icon name="chevronLeft" className="w-4 h-4" />
            </Button>
            <span className="font-medium text-sm">{currentYear}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleYearChange(1)}
              aria-label="Next year"
              className="px-2"
            >
              <Icon name="chevronRight" className="w-4 h-4" />
            </Button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => (
              <Button
                key={month}
                variant={index === currentMonth ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleMonthSelect(index)}
                className="text-xs"
              >
                {month.substring(0, 3)}
              </Button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const currentMonth = dayjs().format('YYYY-MM');
                onChange(currentMonth);
                setSelectedDate(dayjs());
                setIsOpen(false);
              }}
              className="w-full text-xs"
            >
              Current Month
            </Button>
            {value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="w-full text-xs"
              >
                Clear filter
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

