import { dayjs } from "./dayjs";

export const formatCurrency = (value: number, currency: string) => {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(value);
};

export const formatDate = (date: string | Date) => {
  return dayjs(date).format("LL")
};

/**
 * Get the start and end dates for a given month in YYYY-MM format
 * @param monthString - Month string in YYYY-MM format (e.g., "2025-10")
 * @returns Object with startDate and endDate for the month, or null if invalid
 */
export const getMonthDateRange = (monthString: string): { startDate: Date; endDate: Date } | null => {
  const [year, month] = monthString.split('-').map(Number);
  
  if (!year || !month || month < 1 || month > 12) {
    return null;
  }

  // Create month string in YYYY-MM format for dayjs
  const monthDate = `${year}-${String(month).padStart(2, '0')}-01`;
  
  // Start of the month
  const startDate = dayjs(monthDate).startOf('month').toDate();
  
  // End of the month (last millisecond)
  const endDate = dayjs(monthDate).endOf('month').toDate();
  
  return { startDate, endDate };
};